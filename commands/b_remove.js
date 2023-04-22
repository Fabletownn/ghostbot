const { AttachmentBuilder } = require('discord.js');
const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');
const fs = require('fs');

module.exports = {
    name: 'remove',
    description: 'This command removes a user from their pullroom session',
    category: 'mod',
    syntax: 'remove <User>',
    async execute(client, message, args) {

        const pulledUser = message.mentions.users.first() || message.guild.members.cache.get(args[0]);

        if (args.length < 1) return message.reply('Insufficient arguments (want 1; got ' + args.length.toString() + '). Syntax is `' + module.exports.syntax + '`.');
        if ((!pulledUser) || (!message.guild.members.cache.get(pulledUser.id))) return message.reply('Invalid member, or user not found. Please make sure the specified user is in the server!');

        if (!message.channel.topic) return message.reply('Failed to remove the specified member (invalid or not a pullroom channel).');

        const UI = message.mentions.users.first() || message.guild.members.cache.get(args[0]);
        const execChannelID = message.channel.id;

        CONFIG.findOne({

            guildID: message.guild.id

        }, async (err, data) => {

            if (err) return console.log(err);
            if (!data) return message.reply('Failed to remove the specified member (no data found).');

            PULL.findOne({

                guildID: message.guild.id,
                userID: UI.id

            }, async (pErr, pData) => {

                if (pErr) return console.log(pErr);
                if (!pData) return message.reply('Failed to remove the specified member (no pullroom data found).');

                if (pulledUser.id !== UI.id) return message.reply('Failed to remove the specified user ' + client.users.cache.get(pulledUser.id).tag + '. This is not their pullroom thread.');

                const fileName = `phasmophobia-${pData.roomName}-transcript.txt`;

                const botResponse = await message.reply('📥 Removing `' + client.users.cache.get(pulledUser.id).tag + '` from their pullroom..');

                if (message.guild.members.cache.get(pData.userID)) await message.guild.members.cache.get(pData.userID).roles.remove(data.pullroleid);

                fs.writeFile(fileName, pData.transcript, async function (err) {

                    if (err) return console.log(err);

                    const transcriptFile = new AttachmentBuilder(`./${fileName}`, { name: fileName });

                    await client.channels.cache.get(data.pulllogid).send({ content: `Pullroom session with \`${client.users.cache.get(pData.userID).tag} (${pData.userID})\` has ended, logs are provided below (${fileName}).`, files: [transcriptFile] }).then(() => {

                        fs.unlink(`./${fileName}`, (err) => {

                            if (err) return console.log(err);

                        });

                    });

                    await message.guild.channels.cache.get(pData.channelID).delete();

                    await pData.delete();

                    if (message.guild.channels.cache.get(execChannelID)) botResponse.edit('📥 Removed `' + client.users.cache.get(pulledUser.id).tag + '` from their pullroom.');

                });

            });

        });

    }

};