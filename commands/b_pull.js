const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const CONFIG = require('../models/config.js');
const PULL = require('../models/pullrooms.js');

module.exports = {
    name: 'pull',
    description: 'Creates a pullroom channel for the specified user to talk with a member of the staff',
    category: 'mod',
    syntax: 'pull [user]',
    async execute(client, message, args) {
        const moderatorID = '756591038373691606';
        const trialModeratorID = '759255791605383208';

        if (args.length < 1) return message.reply('Insufficient arguments (want 1; got ' + args.length.toString() + '). Syntax is `' + module.exports.syntax + '`.');

        const pulledUser = args[0].replace(/[^0-9]/g, '');

        await message.guild.members.fetch(pulledUser).then(() => {
            if (!message.guild.members.cache.get(pulledUser)) return message.reply('Invalid member, or user not found. Please make sure the specified user is in the server!');

            const UI = client.users.cache.get(pulledUser);

            if (UI.id === message.author.id) return message.reply('Failed to pullroom the specified member. Find a friend to pullroom, not yourself!');

            const modifiedUsername = UI.username.replace(/[^a-zA-Z]+/g, '').toLowerCase();
            const roomName = `pullroom-${modifiedUsername}`;

            CONFIG.findOne({
                guildID: message.guild.id
            }, async (err, data) => {
                if (err) return message.reply('Failed to pullroom the specified member. An unknown error has occurred (' + err + ').');
                if (!data) return message.reply('Failed to pullroom the specified member. Ask an Admin to set up data for the server.');

                PULL.findOne({
                    guildID: message.guild.id,
                    userID: UI.id,
                }, async (pErr, pData) => {
                    if (pErr) return console.log(pErr);
                    if (pData) return message.reply('Failed to pullroom the specified member. This user already has a pullroom session open (<#' + pData.channelID + '>).');

                    const pullCategory = message.guild.channels.cache.get(data.pullcategoryid);

                    if (pullCategory) {
                        await message.guild.channels.create({
                            name: roomName,
                            parent: data.pullcategoryid,
                            topic: 'User ID: ' + UI.id,
                            permissionOverwrites: [{
                                    id: message.guild.id,
                                    deny: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
                                },
                                {
                                    id: UI.id,
                                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks]
                                },
                                {
                                    id: moderatorID,
                                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
                                },
                                {
                                    id: trialModeratorID,
                                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ManageMessages]
                                }
                            ]
                        }).then(async (pullroom) => {
                            await pullroom.setPosition(0);

                            const pullEmbed = new EmbedBuilder()
                                .setAuthor({
                                    name: UI.username + ' Pullroom',
                                    iconURL: client.users.cache.get(UI.id).displayAvatarURL({
                                        dynamic: true
                                    })
                                })
                                .setDescription(`${UI.username} has been pulled by ${message.author.username}.\n\n${data.pullmsg}`)
                                .setColor('ffffff');

                            if (message.guild.members.cache.get(pulledUser)) {
                                const newPullData = new PULL({
                                    guildID: message.guild.id,
                                    userID: UI.id,
                                    userTag: UI.username,
                                    channelID: pullroom.id,
                                    roomName: roomName,
                                    transcript: `[${new Date().toLocaleString().replace(',', '')}] Pullroom started by ${message.author.username} with ${UI.username} opened..\n`
                                });

                                newPullData.save().catch((err) => console.log(err));

                                await message.guild.members.cache.get(pulledUser).roles.add(data.pullroleid);

                                await pullroom.send({
                                    content: `A member of the moderation team would like to talk to you, <@${UI.id}>.`,
                                    embeds: [pullEmbed]
                                });
                                await message.reply(`📤 Pulled \`${UI.username}\` into <#${newPullData.channelID}>`);
                                await pullroom.send(`<@${message.author.id}>`).then((m) => m.delete());
                            }
                        });
                    }
                });
            });
        }).catch((err) => {
            return message.reply('Invalid member, or user not found. Please make sure the specified user is in the server!');
        });
    }
};