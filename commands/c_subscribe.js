const SUB = require('../models/subs.js');
const { ChannelType } = require('discord.js');

module.exports = {
    name: 'subscribe',
    description: 'Subscribes a staff member to a thread/forum post',
    aliases: ['sub'],
    category: 'staff',
    syntax: 'subscribe',
    async execute(client, message) {
        const allowedChannels = ['1034230224973484112', '1034231311147216959', '1034278601060777984', '1082421799578521620', '1020011442205900870'];

        if (message.channel.type !== ChannelType.PublicThread) return message.reply('Invalid channel, or channel not found. Please make sure the channel is a proper type (forum/thread).');
        if (!(allowedChannels.some((chID) => message.channel.parent.id === chID))) return message.react('❓');

        SUB.findOne({
            guildID: message.guild.id,
            postID: message.channel.id
        }, async (err, data) => {
            if (err) return console.error(err);

            if (!data) {
                if (message.channel.ownerId !== message.author.id) {
                    const newSubData = new SUB({
                        guildID: message.guild.id,
                        postID: message.channel.id,
                        originalPoster: message.channel.ownerId || '',
                        subbedMembers: [message.author.id],
                        alreadyPosted: false
                    });

                    await newSubData.save().catch((err) => console.log(err));

                    await message.react('✅');
                    setTimeout(() => message.delete(), 2500);
                } else {
                    return message.reply('You cannot subscribe to a thread that you own!');
                }
            } else {
                if (!data.subbedMembers.includes(message.author.id)) {
                    if (data.originalPoster !== message.author.id) {
                        await data.subbedMembers.push(message.author.id);
                        await data.save().catch((err) => console.log(err));

                        await message.react('✅');
                        setTimeout(() => message.delete(), 2500);
                    } else {
                        return message.reply('You cannot subscribe to a thread that you own!');
                    }
                } else {
                    return message.reply('You are already subscribed to this thread. To unsubscribe, please use the **!unsubscribe** command.');
                }
            }
        });
    }
};