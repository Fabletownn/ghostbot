const PARTY = require('../models/party.js');
const CONFIG = require('../models/config.js');

module.exports = {
    name: 'pb',
    aliases: ['partybot', 'myvc'],
    description: 'These commands allow members to control their PartyBot rooms',
    category: 'user',
    syntax: 'pb <lock|unlock|kick|ban|unban|owner> <User>',
    async execute(client, message, args) {

        const voiceConnected = message.member.voice.channel;

        if (!args[0]) return;

        const partyCommand = args[0].toLowerCase();

        if (voiceConnected !== null) {

            const voiceID = voiceConnected.id;

            PARTY.findOne({

                voiceID: voiceID

            }, async (err, data) => {

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

                    const userKick = args[1].replace(/[^0-9]/g, '');

                    await message.guild.members.fetch(userKick).then(() => {

                        if (!message.guild.members.cache.get(userKick)) return;

                        const userChannel = message.guild.members.cache.get(userKick).voice.channel;

                        if ((userChannel !== null && userChannel.name === 'PartyBot Room') && userKick !== message.author.id) {

                            if (userChannel.id !== message.member.voice.channel.id) return;

                            message.guild.members.cache.get(userKick).voice.setChannel(null, {

                                reason: 'Disconnected from voice channel by PartyBot owner @' + message.author.username + ' (' + message.author.id + ')'

                            });

                        }

                    }).catch((err) => {
                    
                        return;
                    
                    });

                } else if (partyCommand == 'ban') {

                    if (!args[1]) return;

                    const userBan = args[1].replace(/[^0-9]/g, '');

                    await message.guild.members.fetch(userBan).then(() => {

                        if (!message.guild.members.cache.get(userBan)) return;

                        const userChannel = message.guild.members.cache.get(userBan).voice.channel;

                        if ((userChannel !== null && userChannel.name === 'PartyBot Room') && userBan !== message.author.id) {

                            if (userChannel.id !== message.member.voice.channel.id) return;

                            message.guild.members.cache.get(userBan).voice.channel.permissionOverwrites.edit(userBan, {

                                Connect: false

                            }).then(() => {

                                message.guild.members.cache.get(userBan).voice.setChannel(null, {

                                    reason: 'Banned from voice channel by PartyBot owner @' + message.author.username + ' (' + message.author.id + ')'

                                });

                            });

                        }

                    }).catch((err) => {
                    
                        return;
                    
                    });

                } else if (partyCommand == 'unban') {

                    if (!args[1]) return;

                    const userUnban = args[1].replace(/[^0-9]/g, '');

                    await message.guild.members.fetch(userUnban).then(() => {

                        if (!message.guild.members.cache.get(userUnban)) return;

                        if (userUnban !== message.author.id) {

                            message.guild.members.cache.get(data.ownerID).voice.channel.permissionOverwrites.delete(userUnban);

                        }

                    }).catch((err) => {
                    
                        return;
                    
                    });

                } else if (partyCommand == 'owner') {

                    if (!args[1]) return;

                    const newOwner = args[1].replace(/[^0-9]/g, '');

                    await message.guild.members.fetch(newOwner).then(() => {

                        if (!message.guild.members.cache.get(newOwner)) return;

                        const userChannel = message.guild.members.cache.get(newOwner).voice.channel;

                        if ((userChannel !== null && userChannel.name === 'PartyBot Room') && newOwner !== message.author.id) {

                            if (userChannel.id !== message.member.voice.channel.id) return;

                            if (data) {

                                data.ownerID = newOwner;
                                data.save().catch((err) => console.log(err));

                            }

                        }

                    }).catch((err) => {
                    
                        return;
                    
                    });

                }

            });

        }

    }

};