/*
    Creates PartyBot channels and data when the "join to create" voice channel is joined
*/

const { ChannelType } = require('discord.js');
const PARTY = require('../../models/party.js');
const CONFIG = require('../../models/config.js');

module.exports = async (Discord, client, oldState, newState) => {
    const oldVoiceGuild = oldState.guild;
    const newVoiceGuild = newState.guild;

    if (oldVoiceGuild !== null && newVoiceGuild !== null) {
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        CONFIG.findOne({
            guildID: newVoiceGuild.id
        }, (cErr, cData) => {

            if (cErr) return console.log(cErr);
            if (!cData) return;

            if ((newChannel !== null) && (newChannel.id === cData.pbvcid)) {
                const newMember = newState.member;

                if (!newMember.user.bot) {
                    PARTY.findOne({
                        ownerID: newMember.user.id
                    }, (err, data) => {
                        if (err) return console.log(err);

                        if (!data) {
                            const pbParent = newVoiceGuild.channels.cache.get(cData.pbvcid).parent.id;

                            newVoiceGuild.channels.create({
                                name: 'PartyBot Room',
                                type: ChannelType.GuildVoice,
                                parent: pbParent,
                                userLimit: cData.pbvclimit
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