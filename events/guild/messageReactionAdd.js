const { EmbedBuilder } = require('discord.js');

module.exports = async (Discord, client, reaction, user) => {

    const message = reaction.message;
    const reactionName = reaction.emoji.name;

    /*
        Handles reactions in DM to change embeds
        "!help" should prompt these reactions
    */

    const homeEmbed = new EmbedBuilder()
        .setAuthor({
            name: client.user.username + ' Help',
            iconURL: client.user.displayAvatarURL({
                dynamic: true
            })
        })
        .setDescription('Below is a full list of all commands available.\n\nFor specific information on a command, try: `help info <command name>`\n``` ```')
        .addFields([{
                name: 'PartyBot Commands',
                value: 'React with the 🎉 emoji to get a list of PartyBot commands.',
                inline: false
            },
            {
                name: 'Staff Commands',
                value: 'React with the 🔨 emoji to get a list of staff commands.',
                inline: false
            },
            {
                name: 'Admin Commands',
                value: 'React with the 🔧 emoji to get a list of Admin commands.',
                inline: false
            },
        ])
        .setColor('ffffff')
        .setFooter({
            text: 'React with the 🏠 emoji to jump back to this menu',
            iconURL: user.displayAvatarURL({
                dynamic: true
            })
        })
        .setTimestamp()

    const pbEmbed = new EmbedBuilder()
        .setAuthor({
            name: 'Category Help',
            iconURL: client.user.displayAvatarURL({
                dynamic: true
            })
        })
        .setDescription('Below is a full list of all category commands available.\n``` ```')
        .addFields([{
                name: 'pb lock',
                value: 'Locks your PartyBot channel',
                inline: false
            },
            {
                name: 'pb unlock',
                value: 'Unlocks your PartyBot channel',
                inline: false
            },
            {
                name: 'pb owner <user>',
                value: 'Transfers ownership to a user in your PartyBot channel',
                inline: false
            },
            {
                name: 'pb kick <user>',
                value: 'Kicks a user out of your PartyBot channel',
                inline: false
            },
            {
                name: 'pb ban <user>',
                value: 'Bans a user from your PartyBot channel',
                inline: false
            },
            {
                name: 'pb unban <user>',
                value: 'Unbans a user from your PartyBot channel',
                inline: false
            }
        ])
        .setColor('ffffff')
        .setFooter({
            text: 'React with the 🏠 emoji to jump back to the menu',
            iconURL: user.displayAvatarURL({
                dynamic: true
            })
        })
        .setTimestamp()

    const baseEmbed = new EmbedBuilder()
        .setAuthor({
            name: 'Category Help',
            iconURL: client.user.displayAvatarURL({
                dynamic: true
            })
        })
        .setDescription('Below is a full list of all category commands available.\n``` ```')
        .setColor('ffffff')
        .setFooter({
            text: 'React with the 🏠 emoji to jump back to the menu',
            iconURL: user.displayAvatarURL({
                dynamic: true
            })
        })
        .setTimestamp()

    if ((message.author.id === client.user.id) && (reaction.message.channel.isDMBased())) {

        if (!user.bot) {

            if (reactionName === '🎉') {

                await reaction.message.edit({

                    embeds: [pbEmbed]

                });

            } else if (reactionName === '🔨') {

                await client.commands.forEach((cmd) => {

                    if (cmd.category === 'staff') {

                        baseEmbed.addFields([{
                            name: cmd.syntax,
                            value: cmd.description,
                            inline: false
                        }]);

                    }

                });

                await reaction.message.edit({

                    embeds: [baseEmbed]

                });

            } else if (reactionName === '🔧') {

                await client.commands.forEach((cmd) => {

                    if (cmd.category === 'admin') {

                        baseEmbed.addFields([{
                            name: cmd.syntax,
                            value: cmd.description,
                            inline: false
                        }]);

                    }

                });

                await reaction.message.edit({

                    embeds: [baseEmbed]

                });

            } else if (reactionName === '🏠') {

                reaction.message.edit({

                    embeds: [homeEmbed]

                });

            }

        }

    }

};