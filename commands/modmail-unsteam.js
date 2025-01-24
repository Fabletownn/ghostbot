const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../models/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-unsteam')
        .setDescription('Removes Steam Moderator access from a hoisted ModMail ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const data = await CONFIG.findOne({ guildID: interaction.guild.id });  // Get existing configuration data
        const steamModeratorRoleID = '766063761060528138';                   // Steam Moderator's role ID

        if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if ((interaction.channel.parent.id !== data.mmcategoryid) || (interaction.channel.parent.id !== data.ammcategoryid)) return interaction.reply({ content: `That command does not work here.`, ephemeral: true });

        // Delete permission overwrites entirely, as they are not usually set
        await interaction.channel.permissionOverwrites.delete(steamModeratorRoleID);
        await interaction.reply({ content: `Removed <@&${steamModeratorRoleID}> permission overwrites from this ModMail ticket.`, allowedMentions: { parse: [] } });
    },
};