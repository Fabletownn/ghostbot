/*
    Creates PartyBot channels and data when the "join to create" voice channel is joined
*/

const { ChannelType, EmbedBuilder } = require('discord.js');
const PARTY = require('../../models/party.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

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
            const joinedEmbed = new EmbedBuilder()
                .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newState.id}> joined a voice channel (${newChannel.name})`)
                .addFields([
                    { name: 'Channel', value: `<#${newChannel.id}> (${newChannel.name})` },
                    { name: 'Date', value: `<t:${cTimestamp}:F>` },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newState.id}\nChannel = ${newChannel.id}\`\`\`` }
                ])
                .setTimestamp()
                .setColor('#00FF00')

            await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, joinedEmbed);
        } else if (oldChannel !== null && newChannel !== null) {
            if (oldChannel.id === newChannel.id) return; // muting/deafening sends update event, don't send if they didn't actually move

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

            await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, movedEmbed);
        } else if (oldChannel !== null && newChannel === null) {
            const leftEmbed = new EmbedBuilder()
                .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newState.id}> left a voice channel (${oldChannel.name})`)
                .addFields([
                    { name: 'Channel', value: `<#${oldChannel.id}> (${oldChannel.name})` },
                    { name: 'Date', value: `<t:${cTimestamp}:F>` },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newState.id}\nChannel = ${oldChannel.id}\`\`\`` }
                ])
                .setTimestamp()
                .setColor('#FA0404')

            await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, leftEmbed);
        }
    });

    ///////////////////////////// PartyBot
    CONFIG.findOne({
        guildID: newVoiceGuild.id
    }, async (cErr, cData) => {
        if (cErr) return console.log(cErr);
        if (!cData) return;

        if ((newChannel !== null) && (newChannel.id === cData.pbvcid)) {
            const newMember = newState.member;

            if (!newMember.user.bot) {
                PARTY.findOne({
                    ownerID: newMember.user.id
                }, async (err, data) => {
                    if (err) return console.log(err);

                    if (!data) {
                        const pbParent = newVoiceGuild.channels.cache.get(cData.pbvcid).parent.id;

                        await newVoiceGuild.channels.create({
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
        }
        else if ((oldChannel !== null && newChannel === null) || (oldChannel !== null && newChannel !== null)) {
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
};