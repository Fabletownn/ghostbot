const { EmbedBuilder } = require('@discordjs/builders');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'search',
    aliases: ['find'],
    description: 'This will search for a user based on their username with a specific query',
    category: 'staff',
    syntax: 'search <query>',
    async execute(client, message, args) {

        const nameSearch = args.slice(0).join(' ');
        const queryLimit = 15;

        if (!nameSearch) return fc.InsufficientArgs(message, 1, args, module.exports.syntax);

        await message.reply('Searching..').then(async (searchMessage) => {

            const userFetch = await client.guilds.cache.get(message.guild.id).members.search({
                query: nameSearch,
                limit: queryLimit,
                cache: false
            });

            const resultTags = userFetch.map((m) => ` ${m.user}`);
            const fetchedResults = userFetch.map((m) => `${m.user.tag} | ${m.user.id} | Created ${m.user.createdAt}`).join('\n');

            if (fetchedResults) {

                if (userFetch.size == 1) {

                    userFetch.map(async (m) => {

                        const createdDateTS = Math.round(m.user.createdTimestamp / 1000);
                        const joinDateTS = Math.round(m.joinedTimestamp / 1000);

                        let duckCount;

                        if (m.user.id !== '219169741447626754') duckCount = Math.floor(Math.random() * 99).toString();

                        const infoEmbed = new EmbedBuilder()
                            .setAuthor({
                                name: 'User ' + m.user.tag,
                                iconURL: m.user.displayAvatarURL({
                                    dynamic: true
                                })
                            })
                            .addFields([{
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
                                name: 'Ducks Owned',
                                value: duckCount || 'Infinite',
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

                        await searchMessage.edit({
                            content: 'Only one result found. Showing information for **' + m.user.tag + '**:',
                            embeds: [infoEmbed]
                        });

                    });

                } else if (userFetch.size > 1) {

                    const fResults = `Fetched:${resultTags || ' None.'}\n\`\`\`fix\n${fetchedResults || 'None'}`;

                    if (fResults.length < 1500) {

                        await searchMessage.edit(`More than one result found. Showing **${userFetch.size}** members matching query \`${nameSearch}\` (of ${queryLimit.toString()} limit) regardless of cache.\n${fResults}`);

                    } else {

                        await searchMessage.edit('There were too many results! Please try and make your query field more specific.');

                    }

                }

            } else {

                await searchMessage.edit('No results found.');

            }

        });

    }

};