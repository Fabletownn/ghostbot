const { EmbedBuilder } = require('discord.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'help',
    aliases: ['dmlist'],
    description: 'A list of all bot commands as well as their usages',
    category: 'staff',
    syntax: 'help (info [command name])',
    async execute(client, message, args) {
        const helpEmbed = new EmbedBuilder()
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
                iconURL: message.author.displayAvatarURL({
                    dynamic: true
                })
            })
            .setTimestamp();

        if (args[0] && !args[1]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);

        if (!args[0]) {
            message.reply('Sending..').then(async (sendingMessage) => {

                try {
                    await message.author.send({
                        embeds: [helpEmbed]
                    }).then(async (helpMessage) => {
                        await sendingMessage.edit('📨');

                        await helpMessage.react('🎉');
                        await helpMessage.react('🔨');
                        await helpMessage.react('🔧');
                        await helpMessage.react('🏠');
                    });
                } catch (err) {
                    return sendingMessage.edit('I cannot message you (`' + err + '`). Please make sure you have messages enabled!');
                }
            });
        } else if (args[0]) {
            const optParam = args[0].toLowerCase();

            if (optParam.startsWith('info')) {
                if (args[1]) {
                    const optVal = args[1].toLowerCase();
                    const commandInfo = client.commands.get(optVal) || client.commands.find(a => a.aliases && a.aliases.includes(optVal));

                    if (!commandInfo) return message.reply('Unknown command. Please make sure you\'re listing the name of a command or alias!');

                    const syntaxEmbed = new EmbedBuilder()
                        .setTitle('Command Help')
                        .setDescription('Below is additional information for the command `' + commandInfo.name + '`.')
                        .addFields([{
                                name: 'Syntax',
                                value: '```' + (commandInfo.syntax || 'None') + '```',
                                inline: false
                            },
                            {
                                name: 'Description',
                                value: '```' + (commandInfo.description || 'None') + '```',
                                inline: false
                            },
                            {
                                name: 'Alias(es)',
                                value: '```' + (commandInfo.aliases || 'None') + '```',
                                inline: false
                            },
                            {
                                name: 'Category',
                                value: '```' + (commandInfo.category.charAt(0).toUpperCase() + commandInfo.category.slice(1) || 'None') + '```',
                                inline: false
                            }
                        ])
                        .setColor('ffffff');

                    await message.reply({
                        embeds: [syntaxEmbed]
                    });
                }
            } else {
                return message.reply('Unknown parameter (expected `info` or `none`; got ' + optParam + ').');
            }
        }
    }
};