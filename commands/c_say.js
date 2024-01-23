const { ChannelType } = require('discord.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'say',
    aliases: ['mimic', 'sendmessage'],
    description: 'Sends a message in any designated channel',
    category: 'staff',
    syntax: 'say [channel] [message]',
    async execute(client, message, args) {
        if (!args[0]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);

        const chanArg = args[0];
        const channelMention = message.mentions.channels.first() || message.guild.channels.cache.get(chanArg);

        if (!args[1]) return fc.InsufficientArgs(message, 2, args, module.exports.syntax);
        if (!channelMention) return message.reply('Invalid channel (unknown channel, or unknown type).');

        const messageSend = args.slice(1).join(' ');

        if (message.guild.channels.cache.get(channelMention.id)) {
            const channelSend = message.guild.channels.cache.get(channelMention.id);
            const blacklistedTypes = [ChannelType.GuildAnnouncement, ChannelType.GuildVoice, ChannelType.GuildStageVoice];

            if (blacklistedTypes.some((blType) => channelSend.type === blType)) return message.reply('Blocked channel type (unknown channel, or blacklisted category).');

            await channelSend.send(messageSend).then(async () => {
                await message.reply(`Successfully sent a message in <#${channelMention.id}> to say: \`${messageSend}\`.`);
            });
        } else {
            return message.reply('Invalid channel (unknown channel, or unknown type).');
        }
    }
};