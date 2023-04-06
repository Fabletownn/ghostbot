const { EmbedBuilder, ChannelType } = require('discord.js');
const CONFIG = require('../models/config.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'config',
    aliases: ['configurate', 'configuration'],
    description: 'This command changes configuration settings within the bot',
    category: 'admin',
    syntax: 'config <setting> <value>',
    async execute(client, message, args) {

        const parametersAvailable = ['view', 'prefix', 'autopublish', 'pb_vc_id', 'pb_default_limit'];
        const paramList = 'The following parameters can be configured.\n```\nview <all>\nprefix <value>\nautopublish <on/off>\npb_vc_id <channel id>\npb_default_limit <1-99>```';

        const configEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Configuration',
                iconURL: message.guild.iconURL({
                    dynamic: true
                })
            })
            .setDescription('Insufficient arguments (want 2; got ' + args.length.toString() + '). Syntax is `config <param> <value>`.\n\n' + paramList)
            .setColor('ffffff')

        const unknownEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Configuration',
                iconURL: message.guild.iconURL({
                    dynamic: true
                })
            })
            .setDescription('Unknown config parameter or value. Syntax is `config <param> <value>`.\n\n' + paramList)
            .setColor('ffffff')

        if (args.length < 2) return message.reply({
            embeds: [configEmbed]
        });

        let configParam = args[0].toLowerCase();
        let configVal = args[1].toLowerCase();

        if (parametersAvailable.find((conf) => configVal.includes(conf.id))) return message.reply({
            embeds: [unknownEmbed]
        });

        CONFIG.findOne({

            guildID: message.guild.id

        }, (err, data) => {

            if (err) return fc.ErrorMessage(message, err);
            if (!data) return fc.ErrorMessage(message, 'There is no data yet created for the server. Use the `setup` command.');

            if (configParam === 'prefix') {

                if (data && data.prefix === configVal) return fc.ErrorMessage(message, 'That prefix is already being used.');
                if (configVal.length > 2) return fc.ErrorMessage(message, 'Please try and condense the prefix `' + configVal + '` into something shorter (want max 2, got ' + configVal.length + ').');

                if (data) {

                    const oldPrefix = data.prefix;

                    data.prefix = configVal;
                    data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the bot prefix (formerly ' + oldPrefix + ').\n```' + data.prefix + '```'));

                }

            } else if (configParam === 'autopublish') {

                if (configVal === 'on' || configVal === 'true') {

                    if (data && data.autopublish == true) return fc.ErrorMessage(message, 'Auto-publishing is already enabled.');

                    if (data) {

                        data.autopublish = true;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully enabled auto-publishing.'));

                    }

                } else if (configVal === 'off' || configVal === 'false') {

                    if (data && data.autopublish == false) return fc.ErrorMessage(message, 'Auto-publishing is already disabled.');

                    if (data) {

                        data.autopublish = false;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully disabled auto-publishing.'));

                    }

                } else {

                    return message.reply({
                        embeds: [unknownEmbed]
                    });

                }

            } else if (configParam === 'pb_vc_id') {

                const vChannel = message.guild.channels.cache.get(configVal);

                if (data && data.pbvcid === configVal) return fc.ErrorMessage(message, 'Invalid channel (doesn\'t exist or is not a voice channel).');
                if (!vChannel || (vChannel && vChannel.type !== ChannelType.GuildVoice)) return fc.ErrorMessage(message, 'Invalid channel (doesn\'t exist or is not a voice channel).');

                if (data) {

                    data.pbvcid = configVal;
                    data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the PartyBot creation channel to <#' + configVal + '>.'));

                }

            } else if (configParam === 'pb_default_limit') {

                if (!configVal.match(/^[1-9][0-9]?$/)) return fc.ErrorMessage(message, 'Invalid integer (not a number, or not through 1 to 99).');

                if (data) {

                    data.pbvclimit = parseInt(configVal);
                    data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the PartyBot member limit to ' + configVal + '.'));

                }

            } else if (configParam === 'view') {

                if (data) {

                    const currentConfigEmbed = new EmbedBuilder()
                        .setAuthor({
                            name: 'Configuration',
                            iconURL: message.guild.iconURL({
                                dynamic: true
                            })
                        })
                        .setDescription(`Below are the configuration settings for ${message.guild.name}.\n\`\`\`\nprefix: ${data.prefix || '!'}\nautopublish: ${data.autopublish || 'false'}\npb_vc_id: ${data.pbvcid}\npb_default_limit: ${data.pbvclimit}\`\`\``)
                        .setColor('ffffff')

                    message.reply({
                        embeds: [currentConfigEmbed]
                    });

                }

            } else {

                return message.reply({
                    embeds: [unknownEmbed]
                });

            }

        });

    }

};