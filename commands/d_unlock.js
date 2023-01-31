const { ChannelType } = require('discord.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'unlock',
    description: 'This command will unlock a locked channel',
    category: 'mod',
    syntax: 'unlock <channel>',
    async execute(client, message, args) {

        if (!args[0]) return fc.InsufficientArgs(message, 1, args, module.exports.syntax);

        const reqArg = args[0].toLowerCase();
        const toChannelUnlock = message.mentions.channels.first() || message.guild.channels.cache.get(reqArg);

        if (!toChannelUnlock || !message.guild.channels.cache.get(toChannelUnlock.id)) return message.reply('Invalid channel, or channel not found. Please make sure the channel is text-based!');
        if (toChannelUnlock.type !== ChannelType.GuildText) return message.reply('Invalid channel, or channel is not text. Please make sure the channel is text-based!');

        await toChannelUnlock.permissionOverwrites.edit(message.guild.id, {

            SendMessages: true

        }).then(async () => {

            await message.reply('Successfully unlocked the <#' + toChannelUnlock.id + '> channel.');
            await toChannelUnlock.send('This channel **has been unlocked**. Thank you for your patience.');

        });

    }

};