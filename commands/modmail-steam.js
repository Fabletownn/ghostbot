const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const SV = require('../models/server-values.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-steam')
        .setDescription('Grants or removes Steam Moderator permission if necessary')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addBooleanOption((option) =>
            option.setName('steam')
                .setDescription('Whether to grant Steam Moderator permission to this ticket')
                .setRequired(true)
        ),
    async execute(interaction) {
        const grantSteamPermission = interaction.options.getBoolean('steam');
        const steamModeratorRoleID = SV.ROLES.STEAM_MODERATOR;
        let commandResponse = '';
        
        if (!interaction.channel.parent.name.toLowerCase().includes('modmail'))
            return interaction.reply({ content: 'This command can only be executed in ModMail tickets.', flags: MessageFlags.Ephemeral })

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