const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sf = require('seconds-formater');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode-view')
        .setDescription('View all main channel slowmodes')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const phasmophobiaCat = interaction.guild.channels.cache.get('754890847635505283'); // Phasmophobia category
        const otopicCat = interaction.guild.channels.cache.get('865111206346883112');       // Off topic category

        const phasmophobiaParent = phasmophobiaCat.children.cache.filter((channel) => channel.rateLimitPerUser !== 0); // Filter channels in Phasmophobia category with a slowmode
        const otopicParent = otopicCat.children.cache.filter((channel) => channel.rateLimitPerUser !== 0);             // Filter channels in Off Topic category with a slowmode
        
        if ((!phasmophobiaCat) || (!otopicCat)) return interaction.reply({ content: 'One of the categories listed no longer exist.' });

        // Sort both maps by alphabetical order and their slowmode
        const mappedPCats = phasmophobiaParent.sort((a, b) => a.rawPosition - b?.rawPosition).map((pChan) => `<#${pChan.id}>: **${sf.convert(pChan.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');
        const mappedOCats = otopicParent.sort((a, b) => a.rawPosition - b?.rawPosition).map((oChan) => `<#${oChan.id}>: **${sf.convert(oChan.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');

        // If both categories exist, send slowmode information
        await interaction.reply({ content: `Showcasing active slowmodes for main categories (\`#${phasmophobiaCat.name}\` and \`#${otopicCat.name}\`):\n\n${mappedPCats}\n${mappedOCats}` });
    },
};