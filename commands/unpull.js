const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');
const fs = require('fs');
const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unpull')
        .setDescription('(Moderator) Removes a user from their pullroom')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption((option) =>
            option.setName('user')
                .setDescription('The user that will be pullroomed')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userOption = interaction.options.getUser('user');

        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (cErr, cData) => {
            if (cErr) return console.log(cErr);
            if (!cData) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });

            PULL.findOne({
                guildID: interaction.guild.id,
                userID: userOption.id
            }, async (pErr, pData) => {
                if (pErr) return console.log(pErr);
                if (!pData) return interaction.reply({ content: 'That user does not have a pullroom session open.' });

                const fileName = `phasmophobia-${pData.roomName}-transcript.txt`;

                await interaction.guild.members.cache.get(userOption.id).roles.remove(cData.pullroleid);

                fs.writeFile(fileName, pData.transcript, async function (err) {
                    if (err) return console.log(err);

                    const transcriptFile = new AttachmentBuilder(`./${fileName}`, { name: fileName });

                    await interaction.client.channels.cache.get(cData.pulllogid).send({ content: `Pullroom session with \`${pData.userTag} (${pData.userID})\` has ended, logs are provided below.`, files: [transcriptFile] }).then(() => {
                        fs.unlink(`./${fileName}`, (err) => {
                            if (err) return console.log(err);
                        });
                    });

                    await interaction.guild.channels.cache.get(pData.channelID).delete();

                    await interaction.reply({ content: `Removed <@${pData.userID}> from their pullroom.` });

                    await pData.delete();
                });
            });
        });
    },
};