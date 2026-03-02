const { ChannelType, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sf = require('seconds-formater');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode-view')
        .setDescription('View all main channel slowmodes')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addChannelOption((option) =>
            option.setName('category')
                .setDescription('The category of channels to view slowmodes for')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true)),
    async execute(interaction) {
        const category = interaction.options.getChannel('category');

        // Filter then sort both maps by alphabetical order and their slowmode
        const filteredChannels = category.children.cache.filter((channel) => channel.rateLimitPerUser !== 0); // Filter channels in Phasmophobia category with a slowmode
        if (filteredChannels.size <= 0) return interaction.reply({ content: 'That category has no channels with a set slowmode.' });
        
        const mappedChannels = filteredChannels.sort((a, b) => a.rawPosition - b?.rawPosition).map((c) => `- <#${c.id}>: **${sf.convert(c.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');
        await interaction.reply({ content: `Active slowmodes for the **${category.name}** category:\n${mappedChannels}` });
    },
};