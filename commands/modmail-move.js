const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmail-move')
        .setDescription('Moves the current ModMail ticket to a category, and grants Steam Moderator permission if necessary')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('category')
                .setDescription('The category to move this ticket to')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addBooleanOption((option) =>
            option.setName('steam')
                .setDescription('Whether to grant Steam Moderator permission to this ticket')
                .setRequired(false)
        ),
    async execute(interaction) {
        const currentCategory = interaction.channel.parent;
        const selectedCategoryId = interaction.options.getString('category');
        const selectedCategory = interaction.guild.channels.cache.get(selectedCategoryId);
        const grantSteamPermission = interaction.options.getBoolean('steam');
        const steamModeratorRoleID = '766063761060528138';

        if (!selectedCategory) return interaction.reply({ content: 'Failed to move this ticket, the category selected does not exist.', ephemeral: true });
        if (!currentCategory.name.toLowerCase().includes('modmail')) return interaction.reply({ content: 'Failed to move this ticket, the current category is not for ModMail tickets.', ephemeral: true });

        let commandResponse = `Moved this ticket to the <#${selectedCategoryId}> category.`;

        await interaction.channel.setParent(selectedCategoryId);

        // Only if they selected the Steam Moderator option..
        if (grantSteamPermission !== null) {
            // If they enabled it, give the role access, otherwise remove it
            if (grantSteamPermission) {
                await interaction.channel.permissionOverwrites.edit(steamModeratorRoleID, {
                    ViewChannel: true,
                    ReadMessageHistory: true,
                    SendMessages: true,
                    AttachFiles: true
                });

                commandResponse += ` <@&${steamModeratorRoleID}> permissions have been added to this ticket.`;
            } else {
                await interaction.channel.permissionOverwrites.delete(steamModeratorRoleID);

                commandResponse += ` <@&${steamModeratorRoleID}> permissions have been removed from this ticket.`;
            }
        }

        await interaction.reply({ content: commandResponse, allowedMentions: { parse: [] }});
    },
    async autocomplete(interaction) {
        // Filter categories of the server that have the word "ModMail" in them
        const categories = interaction.guild.channels.cache.filter((channel) =>
            channel.type === 4 && // Type 4 are categories
            channel.name.toLowerCase().includes('modmail') &&
            !channel.name.toLowerCase().includes('information') // Don't include informational channels
        ).map((category) => ({
            name: category.name,
            value: category.id,
        }))
            .slice(0, 25); // Limit to 25 (Discord limitation, will only be a few anyway)

        await interaction.respond(categories);
    },
};