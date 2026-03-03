const { MessageFlags, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { getChannel, getMember } = require('../utils/fetch-utils.js');
const superagent = require('superagent');
const PULL = require('../models/pullrooms.js');
const SV = require('../models/server-values.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unpull')
        .setDescription('Removes a user from their pullroom')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('user-id')
                .setDescription('The User ID of the pullroomed user')
                .setRequired(false)
        ),
    async execute(interaction) {
        const idOption = interaction.options.getString('user-id');
        const channelTopic = interaction.channel.topic;

        // User ID to remove from pullroom; if there is no specified user ID,
        // use the channel's topic - in a pullroom, it will be the user's ID
        const pullID = idOption ? idOption : channelTopic?.split(' ')[2];
        
        // Get and check existing configuration and pullroom data
        const cData = interaction.client.cachedConfig;
        const pData = await PULL.findOne({ guildID: interaction.guild.id, userID: pullID });
        
        if (!cData)
            return interaction.reply({ content: 'There is no data set up for pullrooms yet!' });
        if (!pData)
            return interaction.reply({ content: 'No pullroom session found. Run the command in a pullroom or provide a `user-id` option.' });
        if ((pData.admin) && !(interaction.member.roles.cache.has(SV.ROLES.ADMINISTRATOR)))
            return interaction.reply({ content: 'Please ask an Administrator to run this command.', flags: MessageFlags.Ephemeral });

        await interaction.deferReply();

        const USER_REPORTS_CID = SV.CHANNELS.USER_REPORTS;                                  // Channel ID for the user reports channel
        const ADMIN_DISCUSSION_CID = SV.CHANNELS.ADMIN_DISCUSSION;                          // Channel ID for the admin channel
        const log_sendChannelID = pData.admin ? ADMIN_DISCUSSION_CID : USER_REPORTS_CID;    // Log channel ID depending on admin value
        const transcript_sendChannelID = pData.admin ? ADMIN_DISCUSSION_CID : cData.pulllogid; // Transcript channel ID depending on admin value
        
        const [
            log_sendChannel,        // Channel to send the log to
            transcript_sendChannel, // Channel to send the transcript to
            pullroomChannel,        // Channel of the pullroom itself
            pullMember              // Member object for the pulled user
        ] = await Promise.all([
            getChannel(interaction.guild, log_sendChannelID),
            getChannel(interaction.guild, transcript_sendChannelID),
            getChannel(interaction.guild, pData.channelID),
            getMember(interaction.guild, pData.userID)
        ]);
        
        const roleRemovePromise = pullMember ? pullMember.roles.remove(cData.pullroleid).catch(() => {}) : Promise.resolve();
        const transcriptEmbed = new EmbedBuilder()
            .setTitle(`${pData.userTag} (\`${pData.userID}\`)`)
            .setDescription('Pullroom session ended, transcript log attached')
            .setFooter({ iconURL: interaction.user.displayAvatarURL({ dynamic: true }), text: `Pullroom Closed by ${interaction.user.tag} (${interaction.user.id})`})
            .setTimestamp()
            .setColor('#58B9FF')

        // Upload pullroom transcript to Sourcebin
        let transcriptComponentRow;
        const transcriptLineCount = pData.transcript.split(/\n./g).length;

        // If there are no messages sent in the pullroom, don't send a request to create a log
        if (transcriptLineCount > 1) {
            try {
                const res = await superagent
                    .post('https://sourceb.in/api/bins')
                    .send({
                        files: [{
                            name: 'Phasmophobia Pullroom Sourcebin Log',
                            content: pData.transcript
                        }]
                    });

                // If the transcript successfully uploaded, send it into the configured logs channel
                if (res.ok) {
                    const transcriptButton = new ButtonBuilder()
                        .setLabel("Log link")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://cdn.sourceb.in/bins/${res.body.key}/0`)

                    transcriptComponentRow = new ActionRowBuilder().addComponents(transcriptButton);
                }
            } catch (err) {
                trailError(err);
            }
        }

        // If the transcript had no lines or failed to upload, send a Log unavailable embed/button
        if (!transcriptComponentRow) {
            const unavailableButton = new ButtonBuilder()
                .setCustomId('log-unavailable')
                .setLabel("Log unavailable")
                .setStyle(ButtonStyle.Danger)
                .setDisabled(true);

            transcriptComponentRow = new ActionRowBuilder().addComponents(unavailableButton);
        }

        await transcript_sendChannel?.send({ embeds: [transcriptEmbed], components: [transcriptComponentRow] });

        const idUsername = interaction.client.users.cache.get(pullID)?.username;
        await Promise.all([
            // Remove the pulled role from the user, if possible
            roleRemovePromise,
            // Delete the pullroom channel, if possible
            pullroomChannel?.delete().catch(() => {}),
            // Delete pullroom data
            PULL.findOneAndDelete({ guildID: interaction.guild.id, userID: pullID }).catch(trailError),
            // Follow up the interaction, if existing (don't error if run in the deleted pullroom channel (often))
            interaction.followUp({ content: `Removed <@${pData.userID}> from their pullroom.` }).catch(() => {}),
            // Send log
            log_sendChannel?.send({ content: `🪢 <@${pullID}> ${idUsername ? `(${idUsername}) ` : ''}was removed from pullroom by ${interaction.user.username}` })
        ]);
    },
};