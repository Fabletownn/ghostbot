const PARTY = require('../models/party.js');
const CONFIG = require('../models/config.js');

module.exports = {
    name: 'pb',
    aliases: ['partybot', 'myvc'],
    description: 'These commands allow members to control their PartyBot rooms',
    category: 'user',
    syntax: 'pb <parameter e.g. kick> <value e.g. user>',
    async execute(client, message, args) {

        const voiceConnected = message.member.voice.channel;

        if (!args[0]) return;

        const partyCommand = args[0].toLowerCase();

        if (voiceConnected !== null) {

            const voiceID = voiceConnected.id;

            PARTY.findOne({

                voiceID: voiceID

            }, (err, data) => {

                if (err) return console.log(err);
                if (!data) return;

                if (data.ownerID !== message.author.id) return;

                CONFIG.findOne({

                    guildID: message.guild.id

                }, (c_err, c_data) => {

                    if (c_err) return console.log(c_err);
                    if (!c_data) return;

                    if (partyCommand == 'lock') voiceConnected.setUserLimit(voiceConnected.members.size);
                    if (partyCommand == 'unlock') voiceConnected.setUserLimit(c_data.pbvclimit);

                });

                if (partyCommand == 'kick') {

                    if (!args[1]) return;

                    const optCommandArg = args[1].toLowerCase();
                    const userKick = message.mentions.users.first() || client.users.cache.get(args[1]);

                    if (!userKick) return;

                    if (optCommandArg.startsWith('<@') || (!isNaN(optCommandArg) && optCommandArg.length >= 17)) {

                        if (userKick && message.guild.members.cache.get(userKick.id)) {

                            let userChannel = message.guild.members.cache.get(userKick.id).voice.channel;

                            if ((userChannel !== null && userChannel.name === `PartyBot Room`) && userKick.id !== message.author.id) {

                                if (userChannel.id !== message.member.voice.channel.id) return;

                                message.guild.members.cache.get(userKick.id).voice.setChannel(null, {

                                    reason: 'Disconnected from voice channel by PartyBot owner ' + message.author.tag

                                });

                            }

                        }

                    }

                } else if (partyCommand == 'ban') {

                    if (!args[1]) return;

                    const optCommandArg = args[1].toLowerCase();
                    const userBan = message.mentions.users.first() || client.users.cache.get(args[1]);

                    if (!userBan) return;

                    if (optCommandArg.startsWith('<@') || (!isNaN(optCommandArg) && optCommandArg.length >= 17)) {

                        if (userBan && message.guild.members.cache.get(userBan.id)) {

                            let userChannel = message.guild.members.cache.get(userBan.id).voice.channel;

                            if ((userChannel !== null && userChannel.name === `PartyBot Room`) && userBan.id !== message.author.id) {

                                if (userChannel.id !== message.member.voice.channel.id) return;

                                message.guild.members.cache.get(userBan.id).voice.channel.permissionOverwrites.edit(userBan.id, {

                                    Connect: false

                                }).then(() => {

                                    message.guild.members.cache.get(userBan.id).voice.setChannel(null, {

                                        reason: 'Banned from voice channel by PartyBot owner ' + message.author.tag

                                    });

                                });

                            }

                        }

                    }

                } else if (partyCommand == 'unban') {

                    if (!args[1]) return;

                    const optCommandArg = args[1].toLowerCase();
                    const userUnban = message.mentions.users.first() || client.users.cache.get(args[1]);

                    if (!userUnban) return;

                    if (optCommandArg.startsWith('<@') || (!isNaN(optCommandArg) && optCommandArg.length >= 17)) {

                        if (userUnban && message.guild.members.cache.get(userUnban.id)) {

                            if (userUnban.id !== message.author.id) {

                                message.guild.members.cache.get(data.ownerID).voice.channel.permissionOverwrites.delete(userUnban.id);

                            }

                        }

                    }

                } else if (partyCommand == 'owner') {

                    if (!args[1]) return;

                    const optCommandArg = args[1].toLowerCase();
                    const newOwner = message.mentions.users.first() || client.users.cache.get(args[1]);

                    if (!newOwner) return;

                    if (optCommandArg.startsWith('<@') || (!isNaN(optCommandArg) && optCommandArg.length >= 17)) {

                        if (newOwner && message.guild.members.cache.get(newOwner.id)) {

                            let userChannel = message.guild.members.cache.get(newOwner.id).voice.channel;

                            if ((userChannel !== null && userChannel.name === `PartyBot Room`) && newOwner.id !== message.author.id) {

                                if (userChannel.id !== message.member.voice.channel.id) return;

                                if (data) {

                                    data.ownerID = newOwner.id;
                                    data.save().catch((err) => console.log(err));

                                }

                            }

                        }

                    }

                }

            });

        }

    }

};