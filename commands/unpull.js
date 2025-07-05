const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');
const superagent = require('superagent');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unpull')
        .setDescription('Removes a user from their pullroom')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('user-id')
                .setDescription('The User ID of the pullroomed user')
                .setRequired(true)
        ),
    async execute(interaction) {
        const idOption = interaction.options.getString('user-id'); // User ID to remove from pullroom
        const userReports = '805795819722244148';          // Channel ID for the user reports channel
        const userReportsChannel = interaction.guild.channels.cache.get(userReports); // User reports channel object

        const cData = await CONFIG.findOne({ guildID: interaction.guild.id });                 // Get existing configuration data
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: idOption }); // Get existing pullroom data

        if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if (!pData) return interaction.reply({ content: 'That user does not have a pullroom session open.' });

        const pullroomChannel = interaction.guild.channels.cache.get(pData.channelID); // Pullroom channel object
        const pullMember = interaction.guild.members.cache.get(pData.userID);          // Member object for the pullroomed user

        await interaction.deferReply();

        if (pullMember) await pullMember.roles.remove(cData.pullroleid).catch(() => {}); // If the member is in the server, remove the role from them

        const transcriptEmbed = new EmbedBuilder()
            .setTitle(`${pData.userTag} (\`${pData.userID}\`)`)
            .setDescription('Pullroom session ended, transcript log attached')
            .setFooter({ iconURL: interaction.user.displayAvatarURL({ dynamic: true }), text: `Pullroom Closed by ${interaction.user.tag} (${interaction.user.id})`})
            .setTimestamp()
            .setColor('#58B9FF')

        // Upload pullroom transcript to Sourcebin
        try {
            superagent
                .post('https://sourceb.in/api/bins')
                .send({
                    files: [{
                        name: 'Phasmophobia Pullroom Sourcebin Log',
                        content: pData.transcript
                    }]
                })
                .end(async (err, res) => {
                    if (err) return trailError(err);

                    // If the transcript successfully uploaded, send it into the configured logs channel
                    if (res.ok) {
                        const transcriptButton = new ButtonBuilder()
                            .setLabel("Log link")
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://cdn.sourceb.in/bins/${res.body.key}/0`)

                        const successRow = new ActionRowBuilder()
                            .addComponents(transcriptButton);

                        await interaction.client.channels.cache.get(cData.pulllogid).send({ embeds: [transcriptEmbed], components: [successRow] });
                    }
                });
            
        // If the transcript failed to upload, send a Log unavailable embed, but still show that they were pullroomed    
        } catch (err) {
            const unavailableButton = new ButtonBuilder()
                .setCustomId('log-unavailable')
                .setLabel("Log unavailable")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true);

            const failRow = new ActionRowBuilder()
                .addComponents(unavailableButton);

            await interaction.client.channels.cache.get(cData.pulllogid).send({ embeds: [transcriptEmbed], components: [failRow] });
            await trailError(err);
        }

        // Delete the pullroom channel and data
        if (pullroomChannel) await pullroomChannel.delete().catch(() => {});

        await interaction.followUp({ content: `Removed <@${pData.userID}> from their pullroom.` }).catch(() => {});

        await PULL.findOneAndDelete({
            guildID: interaction.guild.id,
            userID: idOption
        }).catch((err) => trailError(err));

        const idUsername = interaction.client.users.cache.get(idOption)?.username;
        if (userReportsChannel) await userReportsChannel.send({ content: `🪢 <@${idOption}> ${idUsername ? `(${idUsername}) ` : ''}was removed from pullroom by ${interaction.user.username}` });
    },
};