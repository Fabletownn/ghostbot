const { EmbedBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'setup',
    aliases: ['createdata'],
    description: 'This creates or resets data for the server when the Phas bot initially gets invited',
    category: 'admin',
    syntax: 'setup',
    async execute(client, message) {

        const resetEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Configuration',
                iconURL: message.guild.iconURL({
                    dynamic: true
                })
            })
            .setDescription('This server has already been set up. Reset data?')
            .setColor('ffffff');

        CONFIG.findOne({

            guildID: message.guild.id

        }, (err, data) => {

            message.reply(`Creating configuration data for ${message.guild.name}..`).then(async (setupMessage) => {

                if (err) return setupMessage.edit(`Failed to create data for the server: \`${err}\``);

                if (!data) {

                    const newData = new CONFIG({
                        guildID: message.guild.id,
                        prefix: '!',
                        autopublish: false,
                        pbvcid: '761671691960188949',
                        pbvclimit: 4
                    });

                    newData.save().catch(err => console.log(err)).then(async () => {

                        await setupMessage.edit('Successfully created data.');

                        fc.ConfigSuccess(message, `Data has been set up for the server.\n\nThe following are the default configuration settings. Use the \`config\` command to edit this.\n\`\`\`prefix: ${newData.prefix}\nautopublish: ${newData.autopublish}\npb_vc_id: ${newData.pbvcid}\npb_default_limit: ${newData.pbvclimit}\`\`\``);

                    });

                } else if (data) {

                    await message.reply({
                        embeds: [resetEmbed]
                    }).then(async (resetPrompt) => {

                        await resetPrompt.react('✅');
                        await resetPrompt.react('❌');

                        const filter = (reaction, user) => (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && user.id === message.author.id && !user.bot;
                        const promptCollector = resetPrompt.createReactionCollector({
                            filter,
                            time: 30_000,
                            max: 1
                        });

                        promptCollector.on('collect', async (r) => {

                            if (r.emoji.name === '✅') {

                                await resetPrompt.delete();

                                await data.delete().then(async () => {

                                    const newData = new CONFIG({
                                        guildID: message.guild.id,
                                        prefix: "!",
                                        autopublish: false,
                                        pbvcid: '761671691960188949',
                                        pbvclimit: 4
                                    });

                                    newData.save().catch((err) => console.log(err)).then(async () => {

                                        fc.ConfigSuccess(message, `Data has been set back up for the server.\n\nBelow are the default configuration settings. Use the \`config\` command to edit this.\n\`\`\`prefix: ${newData.prefix}\nautopublish: ${newData.autopublish}\npb_vc_id: ${newData.pbvcid}\npb_default_limit: ${newData.pbvclimit}\`\`\``);

                                    });

                                });

                            } else if (r.emoji.name === '❌') {

                                await resetPrompt.delete();

                                return message.channel.send('Data reset cancelled.');

                            }

                        });

                    });

                }

            });

        });

    }

};