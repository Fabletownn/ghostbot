const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Searches for a user based on a username query')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('query')
                .setDescription('The username query to search for')
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option.setName('limit')
                .setDescription('The maximum amount of searches to return with')
                .setRequired(false)
        ),
    async execute(interaction) {
        const queryOption = interaction.options.getString('query');        // Get username query string
        const limitOption = interaction.options.getInteger('limit') || 15; // Get limit if given, otherwise set to 15

        const userFetch = await interaction.client.guilds.cache.get(interaction.guild.id).members.search({ query: queryOption, limit: limitOption, cache: false }); // Map of fetched users with query and limit
        const resultTags = userFetch.map((m) => ` ${m.user}`); // User tag mapping
        const fetchedResults = userFetch.map((m) => `${m.user.username} | ${m.user.id} | Created ${m.user.createdAt}`).join('\n'); // String to display for each user

        if (fetchedResults) {
            // Display a more detailed embed about the user if only 1 result was found
            if (userFetch.size === 1) {
                userFetch.map(async (m) => {
                    await interaction.deferReply();

                    const createdDateTS = Math.round(m.user.createdTimestamp / 1000);
                    const joinDateTS = Math.round(m.joinedTimestamp / 1000);

                    let bananaCount; // Fun banana count, Jace easter egg
                    if (m.user.id !== '338496408988418048') bananaCount = Math.floor(Math.random() * 99).toString();

                    const infoEmbed = new EmbedBuilder()
                        .setAuthor({
                            name: `${m.user.username} (${m.user.displayName})`,
                            iconURL: m.user.displayAvatarURL({
                                dynamic: true
                            })
                        })
                        .addFields([
                            {
                                name: 'User ID',
                                value: m.user.id,
                                inline: true
                            },
                            {
                                name: 'Mention',
                                value: '<@' + m.user.id + '>',
                                inline: true
                            },
                            {
                                name: 'Nuclear Bananas Owned',
                                value: bananaCount || 'Infinite',
                                inline: true
                            },
                            {
                                name: 'Created',
                                value: '<t:' + createdDateTS + ':F>',
                                inline: false
                            },
                            {
                                name: 'Joined',
                                value: '<t:' + joinDateTS + ':F>',
                                inline: false
                            },
                        ]);

                    await interaction.followUp({ content: `One result found. Showing information for **${m.user.username}**.`, embeds: [infoEmbed] });
                });
                
            // Display a larger list of data if more than one user was found    
            } else if (userFetch.size > 1) {
                const fResults = `Fetched:${resultTags || ' None.'}\n\`\`\`fix\n${fetchedResults || 'None'}\`\`\``;

                await interaction.deferReply();

                if (fResults.length < 1500) {
                    interaction.followUp({ content: `Showing **${userFetch.size}** members matching query \`${queryOption}\` (of ${limitOption.toString()} limit) regardless of cache.\n${fResults}` });
                }  else {
                    interaction.followUp({ content: 'There were too many results! Please try and make your query field more specific.' });
                }
            }
        } else {
            await interaction.reply({ content: `No results found for \`${queryOption}\`.` });
        }
    },
};