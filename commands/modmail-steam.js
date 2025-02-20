const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-stean')
        .setDescription('Grants or removes Steam Moderator permission if necessary')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addBooleanOption((option) =>
            option.setName('steam')
                .setDescription('Whether to grant Steam Moderator permission to this ticket')
                .setRequired(true)
        ),
    async execute(interaction) {
        const grantSteamPermission = interaction.options.getBoolean('steam');
        const steamModeratorRoleID = '766063761060528138';
        let commandResponse = '';

        // If they enabled it, give the role access, otherwise remove it
        if (grantSteamPermission) {
            await interaction.channel.permissionOverwrites.edit(steamModeratorRoleID, {
                ViewChannel: true,
                ReadMessageHistory: true,
                SendMessages: true,
                AttachFiles: true
            });

            commandResponse = `<@&${steamModeratorRoleID}> permissions have been added to this ticket.`;
        } else {
            await interaction.channel.permissionOverwrites.delete(steamModeratorRoleID);

            commandResponse = `<@&${steamModeratorRoleID}> permissions have been removed from this ticket.`;
        }

        await interaction.reply({ content: commandResponse, allowedMentions: { parse: [] }});
    },
};