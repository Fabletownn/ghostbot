const sf = require('seconds-formater');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode-view')
        .setDescription('View all main channel slowmodes')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        const phasmophobiaCat = interaction.guild.channels.cache.get('754890847635505283');
        const otopicCat = interaction.guild.channels.cache.get('865111206346883112');

        const phasmophobiaParent = phasmophobiaCat.children.cache.filter((channel) => channel.rateLimitPerUser !== 0);
        const otopicParent = otopicCat.children.cache.filter((channel) => channel.rateLimitPerUser !== 0);

        const mappedPCats = phasmophobiaParent.sort((a, b) => a.rawPosition - b?.rawPosition).map((pChan) => `<#${pChan.id}>: **${sf.convert(pChan.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');
        const mappedOCats = otopicParent.sort((a, b) => a.rawPosition - b?.rawPosition).map((oChan) => `<#${oChan.id}>: **${sf.convert(oChan.rateLimitPerUser || 0).format('MM:SS')}** slowmode`).join('\n');

        if (phasmophobiaCat && otopicCat) {
            await interaction.reply({ content: `Showcasing active slowmodes for main categories (\`#${phasmophobiaCat.name}\` and \`#${otopicCat.name}\`):\n\n${mappedPCats}\n${mappedOCats}` });
        } else {
            return interaction.reply({ content: 'One of the categories listed no longer exist.' });
        }
    },
};