const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const superagent = require("superagent");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unpull')
        .setDescription('(Moderator) Removes a user from their pullroom')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('user-id')
                .setDescription('The User ID of the pullroomed user')
                .setRequired(true)
        ),
    async execute(interaction) {
        const idOption = interaction.options.getString('user-id');

        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (cErr, cData) => {
            if (cErr) return console.log(cErr);
            if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });

            PULL.findOne({
                guildID: interaction.guild.id,
                userID: idOption
            }, async (pErr, pData) => {
                if (pErr) return console.log(pErr);
                if (!pData) return interaction.reply({ content: 'That user does not have a pullroom session open.' });

                const pullroomChannel = interaction.guild.channels.cache.get(pData.channelID);
                const pullMember = interaction.guild.members.cache.get(pData.userID);

                await interaction.deferReply();

                if (pullMember) await pullMember.roles.remove(cData.pullroleid).catch((err) => {});

                const transcriptEmbed = new EmbedBuilder()
                    .setTitle(`${pData.userTag} (\`${pData.userID}\`)`)
                    .setDescription('Pullroom session ended, transcript log attached')
                    .setFooter({ iconURL: interaction.user.displayAvatarURL({ dynamic: true }), text: `Pullroom Closed by ${interaction.user.tag} (${interaction.user.id})`})
                    .setTimestamp()
                    .setColor('#58B9FF')

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
                            if (err) return console.log(err);

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
                } catch (err) {
                    const unavailableButton = new ButtonBuilder()
                        .setCustomId('log-unavailable')
                        .setLabel("Log unavailable")
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true);

                    const failRow = new ActionRowBuilder()
                        .addComponents(unavailableButton);

                    await interaction.client.channels.cache.get(cData.pulllogid).send({ embeds: [transcriptEmbed], components: [failRow] });
                    await console.log(err);
                }

                if (pullroomChannel) await pullroomChannel.delete().catch((err) => {});

                await interaction.followUp({ content: `Removed <@${pData.userID}> from their pullroom.` }).catch((err) => {});

                await pData.delete();
            });
        });
    },
};