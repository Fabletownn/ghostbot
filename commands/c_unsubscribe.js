const SUB = require('../models/subs.js');
const { EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    name: 'unsubscribe',
    description: 'Unsubscribes a staff member from a thread/forum post',
    aliases: ['unsub'],
    category: 'staff',
    syntax: 'unsubscribe',
    async execute(client, message, args) {
        
        const allowedChannels = ['1034230224973484112', '1034231311147216959', '1034278601060777984', '1082421799578521620', '1020011442205900870'];

        if (message.channel.type !== ChannelType.PublicThread) return message.reply('Invalid channel, or channel not found. Please make sure the channel is a proper type (forum/thread).');
        if (allowedChannels.some((chID) => message.channel.parent.id !== chID)) return message.react('❓');

        SUB.findOne({

            guildID: message.guild.id,
            postID: message.channel.id

        }, async (err, data) => {

            if (err) return console.error(err);

            if (data) {

                if (data.subbedMembers.includes(message.author.id)) {

                    const subIndex = data.subbedMembers.indexOf(message.author.id) || null;

                    if (subIndex >= 0) {

                        await data.subbedMembers.splice(subIndex, 1);
                        await data.save().catch((err) => console.log(err));

                        if (data.subbedMembers.length <= 0) await data.delete();

                        await message.react('✅');
                        setTimeout(() => message.delete(), 2500);

                    } else {

                        await message.react('❓');
                        setTimeout(() => message.delete(), 2500);

                    }

                } else {

                    return message.reply('You are not subscribed to this thread. To subscribe, please use the **!subscribe** command.');

                }

            } else {

                return message.reply('You are not subscribed to this thread. To subscribe, please use the **!subscribe** command.');

            }

        });

    }

};