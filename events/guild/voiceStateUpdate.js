/*
    Creates PartyBot channels and data when the "join to create" voice channel is joined
*/

const { ChannelType, EmbedBuilder } = require('discord.js');
const PARTY = require('../../models/party.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');
const ROOMNAMES = require('../../models/pbroomnames.json');

module.exports = async (Discord, client, oldState, newState) => {
    const oldVoiceGuild = oldState.guild;
    const newVoiceGuild = newState.guild;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldVoiceGuild === null || newVoiceGuild === null) return;

    const cTimestamp = Math.round((Date.now()) / 1000);

    ///////////////////////////// Logs
    LCONFIG.findOne({
        guildID: newVoiceGuild.id
    }, async (lErr, lData) => {
        if (lErr) return console.log(lErr);
        if (!lData) return;
        if (!lData.vcchannel) return;
        if (!lData.vcwebhook) return;

        const newUser = client.users.cache.get(newState.id);

        if (oldChannel === null && newChannel !== null) {
            if (newChannel.id === '1253056675531722772') return; // TODO: TEMPORARY

            const joinedEmbed = new EmbedBuilder()
                .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newState.id}> joined a voice channel (${newChannel.name})`)
                .addFields([
                    { name: 'Channel', value: `<#${newChannel.id}> (${newChannel.name})` },
                    { name: 'Date', value: `<t:${cTimestamp}:F>` },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newState.id}\nChannel = ${newChannel.id}\`\`\`` }
                ])
                .setTimestamp()
                .setColor('#66FF66')

            await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, joinedEmbed);
        } else if (oldChannel !== null && newChannel !== null) {
            if (oldChannel.id === newChannel.id) return; // muting/deafening sends update event, don't send if they didn't actually move
            if (oldChannel.id === '1253056675531722772' || newChannel.id === '1253056675531722772') return; // TODO: TEMPORARY

            const movedEmbed = new EmbedBuilder()
                .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newState.id}> moved voice channels (${newChannel.name})`)
                .addFields([
                    { name: 'New Channel', value: `<#${newChannel.id}> (${newChannel.name})`, inline: true },
                    { name: 'Old Channel', value: `<#${oldChannel.id}> (${oldChannel.name})`, inline: true },
                    { name: '\u200b', value: '\u200b', inline: true },
                    { name: 'Date', value: `<t:${cTimestamp}:F>` },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newState.id}\nChannel = ${newChannel.id}\`\`\`` }
                ])
                .setTimestamp()
                .setColor('#58B9FF')

            await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, movedEmbed);
        } else if (oldChannel !== null && newChannel === null) {
            if (oldChannel.id === '1253056675531722772') return; // TODO: TEMPORARY

            const leftEmbed = new EmbedBuilder()
                .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newState.id}> left a voice channel (${oldChannel.name})`)
                .addFields([
                    { name: 'Channel', value: `<#${oldChannel.id}> (${oldChannel.name})` },
                    { name: 'Date', value: `<t:${cTimestamp}:F>` },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newState.id}\nChannel = ${oldChannel.id}\`\`\`` }
                ])
                .setTimestamp()
                .setColor('#FF6666')

            await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, leftEmbed);
        }
    });

    ///////////////////////////// PartyBot
    const possibleRoomNames = ROOMNAMES.roomnames;
    const randomRoomName = possibleRoomNames[Math.floor(Math.random() * possibleRoomNames.length)];

    CONFIG.findOne({
        guildID: newVoiceGuild.id
    }, async (cErr, cData) => {
        if (cErr) return console.log(cErr);
        if (!cData) return;

        if ((newChannel !== null) && (newChannel.id === cData.pbvcid)) {
            const newMember = newState.member;

            if (newMember.user.bot) return;

            PARTY.findOne({
                ownerID: newMember.user.id
            }, async (err, data) => {
                if (err) return console.log(err);

                if (!data) {
                    const pbParent = newVoiceGuild.channels.cache.get(cData.pbvcid).parent.id;

                    await newVoiceGuild.channels.create({
                        name: randomRoomName,
                        type: ChannelType.GuildVoice,
                        parent: pbParent,
                        userLimit: cData.pbvclimit
                    }).then(async (pRoom) => {
                        const newVoice = new PARTY({
                            voiceID: pRoom.id,
                            ownerID: newMember.user.id
                        });

                        await newVoice.save().catch((err) => console.log(err));
                        await newMember.voice.setChannel(pRoom.id).catch(async() => {
                            if (!newMember.voice.channel) {
                                if (newVoice) await newVoice.delete().catch((err) => console.log(err));
                                if (pRoom) await pRoom.delete().catch((err) => console.log(err));
                            }
                        });
                    });
                } else {
                    newMember.voice.setChannel(data.voiceID).catch(async () => {
                        if (!newMember.voice.channel) {
                            await newVoice.delete().catch((err) => console.log(err));
                            await pRoom.delete().catch((err) => console.log(err));
                        }
                    });
                }
            });
        }
        else if ((oldChannel !== null && newChannel == null) || (oldChannel !== null && newChannel !== null)) {
            const voiceSize = oldChannel.members.size;
            const leaveUID = oldState?.member?.id || newState?.member?.id || oldState?.id || newState?.id; // If they left the room use the member ID, otherwise
                                                                                                           // if they left the server use the user ID

            if (!leaveUID) return;

            if (newChannel == null && oldChannel?.id === cData.pbvcid) {
                PARTY.findOne({
                    ownerID: leaveUID
                }, async (err, data) => {
                    if (err) return console.log(err);
                    if (!data) return;

                    const createdChannel = oldVoiceGuild.channels.cache.get(data.voiceID);

                    if (createdChannel) await createdChannel.delete().catch((err) => {});
                    await data.delete().catch((err) => console.log(err));
                });
            }

            if (voiceSize <= 0) {
                PARTY.findOne({
                    voiceID: oldChannel.id
                }, async (err, data) => {
                    if (err) return console.log(err);
                    if (!data) return; // Not a custom room

                    await data.delete().catch((err) => console.log(err)); // If the data fails to delete (it created the channel
                    await oldChannel.delete().catch((err) => console.log(err)); // but not any data), be sure to delete the channel anyway
                });
            }
            else if (voiceSize !== 0) {
                PARTY.findOne({
                    voiceID: oldChannel.id
                }, (err, data) => {
                    if (err) return console.log(err);
                    if (!data) return;
                    if (data.ownerID !== leaveUID) return;

                    const randomMember = oldChannel.members.random();

                    if (randomMember && randomMember.user) {
                        data.ownerID = randomMember.user.id;
                        data.save().catch((err) => console.log(err));
                    }
                });
            }
        }
    });
};