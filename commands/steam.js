const CONFIG = require('../models/config.js');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-steam')
        .setDescription('Allows Steam Moderators to see a hoisted ModMail ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        CONFIG.findOne({
            guildID: interaction.guild.id
        }, async (err, data) => {
            if (err) return console.log(err);
            if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });

            const steamModeratorRoleID = '766063761060528138';

            if (interaction.channel.parent.id === data.ammcategoryid) {
                await interaction.channel.permissionOverwrites.edit(steamModeratorRoleID, {
                    ViewChannel: true,
                    ReadMessageHistory: true,
                    SendMessages: true,
                    AttachFiles: true
                });

                await interaction.reply({ content: `Allowed <@&${steamModeratorRoleID}> access to this ModMail ticket.`, allowedMentions: { parse: [] } });
            } else {
                return interaction.reply({ content: `That command does not work here.`, ephemeral: true });
            }
        });
    },
};