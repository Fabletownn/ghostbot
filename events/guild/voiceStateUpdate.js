const { ChannelType } = require('discord.js');
const PARTY = require('../../models/party.js');
const CONFIG = require('../../models/config.js');

module.exports = async (Discord, client, oldState, newState) => {

    /*
        Handles everything for PartyBot (excluding the command management)
        Creates a voice channel, boots them back to it if they try and spam open one, transfers ownership if they abandon it, disbands if they leave with nobody else in the channel
    */

    const oldVoiceGuild = oldState.guild;
    const newVoiceGuild = newState.guild;

    if (oldVoiceGuild !== null && newVoiceGuild !== null) {

        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        CONFIG.findOne({

            guildID: newVoiceGuild.id

        }, (c_err, c_data) => {

            if (c_err) return console.log(c_err);
            if (!c_data) return;

            if ((newChannel !== null) && (newChannel.id === c_data.pbvcid)) {

                const newMember = newState.member;

                if (!newMember.user.bot) {

                    PARTY.findOne({

                        ownerID: newMember.user.id

                    }, (err, data) => {

                        if (err) return console.log(err);

                        if (!data) {

                            const pbParent = newVoiceGuild.channels.cache.get(c_data.pbvcid).parent.id;

                            newVoiceGuild.channels.create({

                                name: 'PartyBot Room',
                                type: ChannelType.GuildVoice,
                                parent: pbParent,
                                userLimit: c_data.pbvclimit

                            }).then((pRoom) => {

                                const newVoice = new PARTY({
                                    voiceID: pRoom.id,
                                    ownerID: newMember.user.id
                                });

                                newVoice.save().catch((err) => console.log(err)).then(() => {

                                    newMember.voice.setChannel(pRoom.id);

                                });

                            });

                        } else {

                            newMember.voice.setChannel(data.voiceID);

                        }

                    });

                }

            } else if ((oldChannel !== null && newChannel === null) || (oldChannel !== null && newChannel !== null)) {

                const voiceSize = oldChannel.members.size;
                const voiceName = oldChannel.name;

                if ((voiceSize <= 0) && voiceName === 'PartyBot Room') {

                    PARTY.findOne({

                        voiceID: oldChannel.id

                    }, (err, data) => {

                        if (err) return console.log(err);
                        if (!data) return;

                        if (data) {

                            data.delete().catch((err) => console.log(err)).then(() => {

                                oldChannel.delete();

                            });

                        }

                    });

                }

                if ((voiceSize != 0) && voiceName === 'PartyBot Room') {

                    PARTY.findOne({

                        voiceID: oldChannel.id

                    }, (err, data) => {

                        if (err) return console.log(err);
                        if (!data) return;

                        if (data) {

                            if (data.ownerID !== newState.member.user.id) return;
                            const randomUser = oldChannel.members.random().user;

                            data.ownerID = randomUser.id;
                            data.save().catch((err) => console.log(err));

                        }

                    });

                }

            }

        });

    }

};