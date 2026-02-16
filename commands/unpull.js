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
        const cData = await CONFIG.findOne({ guildID: interaction.guild.id });                 // Get existing configuration data
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: idOption }); // Get existing pullroom data

        if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if (!pData) return interaction.reply({ content: 'That user does not have a pullroom session open.' });

        const USER_REPORTS_CID = '805795819722244148';                                             // Channel ID for the user reports channel
        const ADMIN_DISCUSSION_CID = '781985975844733029';                                         // Channel ID for the admin channel
        const log_sendChannelID = pData.admin ? ADMIN_DISCUSSION_CID : USER_REPORTS_CID;           // Log channel ID depending on admin value
        const log_sendChannel = interaction.guild.channels.cache.get(log_sendChannelID);                  // Log channel object
        const transcript_sendChannelID = pData.admin ? ADMIN_DISCUSSION_CID : cData.pulllogid; // Transcript channel ID depending on admin value
        const transcript_sendChannel = interaction.guild.channels.cache.get(transcript_sendChannelID);    //  Transcript channel object

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
        let transcriptComponentRow;
        
        try {
            const res = await superagent
                .post('https://sourceb.in/api/bins')
                .send({
                    files: [{
                        name: 'Phasmophobia Pullroom Sourcebin Log',
                        content: pData.transcript
                    }]
                })

                // If the transcript successfully uploaded, send it into the configured logs channel
                if (res.ok) {
                    const transcriptButton = new ButtonBuilder()
                        .setLabel("Log link")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://cdn.sourceb.in/bins/${res.body.key}/0`)

                    transcriptComponentRow = new ActionRowBuilder().addComponents(transcriptButton);
                }
            
        // If the transcript failed to upload, send a Log unavailable embed, but still show that they were pullroomed    
        } catch (err) {
            const unavailableButton = new ButtonBuilder()
                .setCustomId('log-unavailable')
                .setLabel("Log unavailable")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true);

            transcriptComponentRow = new ActionRowBuilder().addComponents(unavailableButton);
            trailError(err);
        }

        await transcript_sendChannel.send({ embeds: [transcriptEmbed], components: [transcriptComponentRow] });

        // Delete the pullroom channel and data
        if (pullroomChannel) await pullroomChannel.delete().catch(() => {});
        await interaction.followUp({ content: `Removed <@${pData.userID}> from their pullroom.` }).catch(() => {});

        await PULL.findOneAndDelete({
            guildID: interaction.guild.id,
            userID: idOption
        }).catch((err) => trailError(err));

        const idUsername = interaction.client.users.cache.get(idOption)?.username;
        if (log_sendChannel) await log_sendChannel.send({ content: `🪢 <@${idOption}> ${idUsername ? `(${idUsername}) ` : ''}was removed from pullroom by ${interaction.user.username}` });
    },
};