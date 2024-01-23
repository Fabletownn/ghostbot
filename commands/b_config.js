const { EmbedBuilder, ChannelType } = require('discord.js');
const CONFIG = require('../models/config.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'config',
    aliases: ['configurate', 'configuration'],
    description: 'Changes configuration settings within the bot',
    category: 'admin',
    syntax: 'config [param] [value]',
    async execute(client, message, args) {
        let paramList = '';

        const availableConfigs = new Map([
            ['prefix', '<value>'],
            ['autopublish', '<on/off>'],
            ['pb_vc_id', '<channel>'],
            ['pb_default_limit', '<1-99>'],
            ['pullroom_category', '<category ID>'],
            ['pullroom_role', '<role>'],
            ['pullroom_logs', '<channel>'],
            ['pullroom_message', '<message>']
        ]);

        for (let config of availableConfigs) {
            paramList += `${config[0]} ${config[1]}\n`;
        }

        const configEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Configuration',
                iconURL: message.guild.iconURL({
                    dynamic: true
                })
            })
            .setDescription('Insufficient arguments (want 2; got ' + args.length.toString() + '). Syntax is `' + module.exports.syntax + '`.\n\n```\nview\n' + paramList + '```')
            .setColor('ffffff');

        const unknownEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Configuration',
                iconURL: message.guild.iconURL({
                    dynamic: true
                })
            })
            .setDescription('Unknown config parameter or value. Syntax is `' + module.exports.syntax + '`.\n\n```\nview\n' + paramList + '```')
            .setColor('ffffff');

        if (args[0] === 'view') return ViewConfigs(message);
        if (args.length < 2) return message.reply({
            embeds: [configEmbed]
        });

        let configParam = args[0].toLowerCase();
        let configVal = args[1].toLowerCase();

        if (!availableConfigs.get(configParam)) return message.reply({
            embeds: [unknownEmbed]
        });

        CONFIG.findOne({
            guildID: message.guild.id
        }, (err, data) => {
            if (err) return fc.ErrorMessage(message, err);
            if (!data) return fc.ErrorMessage(message, 'There is no data yet created for the server. Use the `setup` command.');

            switch (configParam) {
                case 'prefix':
                    if (data && data.prefix === configVal) return fc.ErrorMessage(message, 'That prefix is already being used.');
                    if (configVal.length > 2) return fc.ErrorMessage(message, 'Please try and condense the prefix `' + configVal + '` into something shorter (want max 2, got ' + configVal.length + ').');

                    if (data) {
                        const oldPrefix = data.prefix;

                        data.prefix = configVal;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the bot prefix (formerly ' + oldPrefix + ').\n```' + data.prefix + '```'));
                    }

                    break;

                case 'autopublish':
                    if ((configVal !== 'off' && configVal !== 'false' && configVal !== 'on' && configVal !== 'true')) return message.reply({
                        embeds: [unknownEmbed]
                    });

                    if (configVal === 'on' || configVal === 'true') {
                        if ((data) && (data.autopublish === true)) return fc.ErrorMessage(message, 'Auto-publishing is already enabled.');

                        if (data) {
                            data.autopublish = true;
                            data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully enabled auto-publishing.'));
                        }
                    } else if (configVal === 'off' || configVal === 'false') {
                        if ((data) && (data.autopublish === false)) return fc.ErrorMessage(message, 'Auto-publishing is already disabled.');

                        if (data) {
                            data.autopublish = false;
                            data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully disabled auto-publishing.'));
                        }
                    }

                    break;

                case 'pb_vc_id':
                    const partyChannel = message.mentions.channels.first() || message.guild.channels.cache.get(configVal);

                    if ((data) && (data.pbvcid === partyChannel.id)) return fc.ErrorMessage(message, 'That channel is already in use.');
                    if ((!partyChannel) || (partyChannel && partyChannel.type !== ChannelType.GuildVoice)) return fc.ErrorMessage(message, 'Invalid channel (doesn\'t exist or is not a voice channel).');

                    if (data) {
                        data.pbvcid = partyChannel.id;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the PartyBot creation channel to <#' + partyChannel.id + '>.'));
                    }

                    break;

                case 'pb_default_limit':
                    if (!configVal.match(/^[1-9][0-9]?$/)) return fc.ErrorMessage(message, 'Invalid integer (not a number, or not through 1 to 99).');

                    if (data) {
                        data.pbvclimit = parseInt(configVal);
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the PartyBot member limit to ' + configVal + '.'));
                    }

                    break;

                case 'pullroom_category':
                    const pullParent = message.guild.channels.cache.get(configVal);

                    if ((!pullParent) || (pullParent && pullParent.type !== ChannelType.GuildCategory)) return fc.ErrorMessage(message, 'Invalid category (doesn\'t exist or is not a channel parent).');
                    if ((data) && (data.pullcategoryid === pullParent.id)) return fc.ErrorMessage(message, 'That category is already set.');

                    if (data) {
                        data.pullcategoryid = pullParent.id;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the pullroom category to <#' + pullParent.id + '>.'));
                    }

                    break;

                case 'pullroom_role':
                    const pullRole = message.mentions.roles.first() || message.guild.roles.cache.get(configVal);

                    if ((!pullRole) || (pullRole && pullRole.position > message.guild.members.resolve(client.user).roles.highest.position)) return fc.ErrorMessage(message, 'Invalid role (doesn\'t exist or role hierachy is higher than mine).');
                    if ((data) && (data.pullroleid === pullRole.id)) return fc.ErrorMessage(message, 'That role is already in use.');

                    if (data) {
                        data.pullroleid = pullRole.id;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the pullroom role to <@&' + pullRole.id + '>.'));
                    }

                    break;

                case 'pullroom_logs':
                    const logsChannel = message.mentions.channels.first() || message.guild.channels.cache.get(configVal);

                    if ((data) && (data.pulllogid === logsChannel.id)) return fc.ErrorMessage(message, 'That channel is already in use.');
                    if ((!logsChannel) || (logsChannel && logsChannel.type !== ChannelType.GuildText)) return fc.ErrorMessage(message, 'Invalid channel (doesn\'t exist or is not a text channel).');

                    if (data) {
                        data.pulllogid = logsChannel.id;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the pullroom logs channel to <#' + logsChannel.id + '>.'));
                    }

                    break;

                case 'pullroom_message':
                    const starterMessage = args.slice(1).join(' ') || null;

                    if ((data) && (data.pullmsg === starterMessage)) return fc.ErrorMessage(message, 'That message is already in use.');
                    if (starterMessage.length > 3500) return fc.ErrorMessage(message, 'Please try and condense the message into something shorter (want max 3500, got ' + starterMessage.length + ').');

                    if (data) {
                        data.pullmsg = starterMessage;
                        data.save().catch((err) => console.log(err)).then(() => fc.ConfigSuccess(message, 'Successfully set the pullroom starter message to:\n```\n' + starterMessage + '\n```'));
                    }

                    break;

                default:
                    message.reply({
                        embeds: [unknownEmbed]
                    });

                    break;
            }
        });
    }
};

function ViewConfigs(message) {
    CONFIG.findOne({
        guildID: message.guild.id
    }, (err, data) => {
        if (err) return;
        if (!data) return fc.ErrorMessage(message, 'There is no data yet created for the server. Use the `setup` command.');

        let configViews = '';

        const allConfigs = new Map([
            ['prefix', data.prefix],
            ['autopublish', data.autopublish],
            ['pb_vc_id', data.pbvcid],
            ['pb_default_limit', data.pbvclimit],
            ['pullroom_category', data.pullcategoryid],
            ['pullroom_role', data.pullroleid],
            ['pullroom_logs', data.pulllogid],
            ['pullroom_message', `"${data.pullmsg}"`]
        ]);

        for (let config of allConfigs) {
            configViews += `${config[0]}: ${config[1] ? config[1] : 'false'}\n`;
        }

        const currentConfigEmbed = new EmbedBuilder()
            .setAuthor({
                name: 'Configuration',
                iconURL: message.guild.iconURL({
                    dynamic: true
                })
            })
            .setDescription(`Below are the configuration settings for ${message.guild.name}.\n\`\`\`\n${configViews}\`\`\``)
            .setColor('ffffff')

        message.reply({
            embeds: [currentConfigEmbed]
        });

    });
}