const { ChannelType } = require('discord.js');
const fc = require('../handlers/global_functions.js');

module.exports = {
    name: 'lock',
    description: 'This command will lock down a specific channel',
    category: 'mod',
    syntax: 'lock <channel> (<reason>)',
    async execute(client, message, args) {

        if (!args[0]) return fc.InsufficientArgs(message, 1, args, module.exports.syntax);

        const reqArg = args[0].toLowerCase();
        const toChannelLock = message.mentions.channels.first() || message.guild.channels.cache.get(reqArg);
        const lockReason = args.slice(1).join(' ') || null;

        if (!toChannelLock || !message.guild.channels.cache.get(toChannelLock.id)) return message.reply('Invalid channel, or channel not found. Please make sure the channel is text-based!');
        if (toChannelLock.type !== ChannelType.GuildText) return message.reply('Invalid channel, or channel is not text. Please make sure the channel is text-based!');

        if (lockReason === null) {

            await toChannelLock.permissionOverwrites.edit(message.guild.id, {

                SendMessages: false

            }).then(async () => {

                await message.reply('Successfully locked the <#' + toChannelLock.id + '> channel (with reason: none specified).');
                await toChannelLock.send('This channel **has been locked** by a moderator. Please standby while any issues are being handled.\n\nExpect a message from a staff member stating why this was done soon.');

            });

        } else if (lockReason) {

            await toChannelLock.permissionOverwrites.edit(message.guild.id, {

                SendMessages: false

            }).then(async () => {

                await message.reply('Successfully locked the <#' + toChannelLock.id + '> channel (with reason: ' + lockReason + ').');
                await toChannelLock.send('This channel **has been locked** by a moderator. Please standby while any issues are being handled.\n\nReason: ' + lockReason);

            });

        }

    }

};