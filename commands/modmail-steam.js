const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../models/config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-steam')
        .setDescription('Allows Steam Moderators to see a hoisted ModMail ticket')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const data = await CONFIG.findOne({ guildID: interaction.guild.id });  // Get existing configuration data
        const steamModeratorRoleID = '766063761060528138';                   // Steam Moderator role ID

        if (!data) return interaction.reply({ content: 'I can\'t run that command if there is no data set up for the server! Use `/config-setup` first.' });
        if ((interaction.channel.parent.id !== data.mmcategoryid) || (interaction.channel.parent.id !== data.ammcategoryid)) return interaction.reply({ content: `That command does not work here.`, ephemeral: true });

        // Change permission overwrites to allow Steam Moderators to view and interact with the channel
        await interaction.channel.permissionOverwrites.edit(steamModeratorRoleID, {
            ViewChannel: true,
            ReadMessageHistory: true,
            SendMessages: true,
            AttachFiles: true
        });

        await interaction.reply({ content: `Allowed <@&${steamModeratorRoleID}> access to this ModMail ticket.`, allowedMentions: { parse: [] } });
    },
};