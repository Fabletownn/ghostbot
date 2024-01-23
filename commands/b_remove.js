const { AttachmentBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');
const fs = require('fs');

module.exports = {
    name: 'remove',
    description: 'Removes a user from their pullroom session',
    category: 'mod',
    syntax: 'remove [user]',
    async execute(client, message, args) {
        if (args.length < 1) return message.reply('Insufficient arguments (want 1; got ' + args.length.toString() + '). Syntax is `' + module.exports.syntax + '`.');

        const removeID = args[0].replace(/[^0-9]/g, '');

        if (!message.channel.topic) return message.reply('Failed to remove the specified member. The channel was invalid or not a pullroom channel.');

        const execChannelID = message.channel.id;

        CONFIG.findOne({
            guildID: message.guild.id
        }, async (err, data) => {
            if (err) return console.log(err);
            if (!data) return message.reply('Failed to remove the specified member (no data found).');

            PULL.findOne({
                guildID: message.guild.id,
                userID: removeID
            }, async (pErr, pData) => {
                if (pErr) return console.log(pErr);
                if (!pData) return message.reply('Failed to remove the specified member (no pullroom data found).');

                if (pData.userID !== removeID) return message.reply('Failed to remove the specified user ' + pData.userTag + '. This is not their pullroom thread.');

                const fileName = `phasmophobia-${pData.roomName}-transcript.txt`;
                const botResponse = await message.reply('📥 Removing `' + pData.userTag + '` from their pullroom..');

                await message.guild.members.fetch(pData.userID).then(() => {
                    if (!message.guild.members.cache.get(pData.userID)) return;

                    message.guild.members.cache.get(pData.userID).roles.remove(data.pullroleid)
                }).catch((err) => {
                    return;
                });

                fs.writeFile(fileName, pData.transcript, async function(err) {
                    if (err) return console.log(err);

                    const transcriptFile = new AttachmentBuilder(`./${fileName}`, {
                        name: fileName
                    });

                    await client.channels.cache.get(data.pulllogid).send({
                        content: `Pullroom session with \`${pData.userTag} (${pData.userID})\` has ended, logs are provided below.`,
                        files: [transcriptFile]
                    }).then(() => {
                        fs.unlink(`./${fileName}`, (err) => {
                            if (err) return console.log(err);
                        });
                    });

                    await message.guild.channels.cache.get(pData.channelID).delete();

                    if (message.guild.channels.cache.get(execChannelID)) botResponse.edit('📥 Removed `' + pData.userTag + '` from their pullroom.');

                    await pData.delete();
                });
            });
        });
    }
};