/*
    Creates PartyBot channels and data when the "join to create" voice channel is joined
*/

const { ChannelType, EmbedBuilder } = require('discord.js');
const PARTY = require('../../models/party.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');
const ROOMNAMES = require('../../models/vcroomnames.json');

module.exports = async (Discord, client, oldState, newState) => {
    const oldVoiceGuild = oldState.guild;
    const newVoiceGuild = newState.guild;

    const oldChannel = oldState.channel;
    const newChannel = newState.channel;

    if (oldVoiceGuild === null || newVoiceGuild === null) return;

    const cTimestamp = Math.round((Date.now()) / 1000);

    ///////////////////////////// Logs
    const lData = await LCONFIG.findOne({
        guildID: newVoiceGuild.id
    });

    if (!lData) return;
    if (!lData.vcchannel) return;
    if (!lData.vcwebhook) return;

    const customRoomNames = ROOMNAMES.roomnames;
    const isCustomRoom = customRoomNames.some((room_name) => room_name.includes(newChannel?.name || oldChannel?.name));

    const newUser = client.users.cache.get(newState.id);

    if (oldChannel === null && newChannel !== null) {
        if (newChannel.id === '1067184155760267284') return; // TODO: TEMPORARY

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

        if (isCustomRoom)
            await joinedEmbed.setFooter({ text: "Joined a custom-made room" });

        await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, joinedEmbed);
    } else if (oldChannel !== null && newChannel !== null) {
        if (oldChannel.id === newChannel.id) return; // muting/deafening sends update event, don't send if they didn't actually move
        if (oldChannel.id === '1067184155760267284' || newChannel.id === '1067184155760267284') return; // TODO: TEMPORARY

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

        if (isCustomRoom)
            await movedEmbed.setFooter({ text: "Moved to custom-made room" });

        await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, movedEmbed);
    } else if (oldChannel !== null && newChannel === null) {
        if (oldChannel.id === '1067184155760267284') return; // TODO: TEMPORARY

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

        if (isCustomRoom)
            await leftEmbed.setFooter({ text: "Left from custom-made room" });

        await wf.useWebhookIfExisting(client, lData.vcchannel, lData.vcwebhook, leftEmbed);
    }

    ///////////////////////////// Custom VCs
    // Check a member ID, otherwise if they left the server check for a user ID
    // This also ensures that ownership is given away if a room owner was banned from the server
    const stateUserID = oldState?.member?.id || newState?.member?.id || oldState?.id || newState?.id;

    const possibleRoomNames = ROOMNAMES.roomnames;
    const randomRoomName = possibleRoomNames[Math.floor(Math.random() * possibleRoomNames.length)];

    const configData = await CONFIG.findOne({
        guildID: newVoiceGuild.id
    });

    if (!configData) return;

    // If a user joins the room creation channel
    if ((newChannel !== null) && (newChannel.id === configData.pbvcid)) {
        const newMember = newState.member;

        if (newMember.user.bot) return;

        const roomData = await PARTY.findOne({
            ownerID: stateUserID
        });

        // Create a new room and room data if they don't own a room
        if (!roomData) {
            const pbParent = newVoiceGuild.channels.cache.get(configData.pbvcid).parent.id;

            await newVoiceGuild.channels.create({
                name: randomRoomName,
                type: ChannelType.GuildVoice,
                parent: pbParent,
                userLimit: configData.pbvclimit
            }).then(async (pRoom) => {
                const newVoice = new PARTY({
                    voiceID: pRoom.id,
                    ownerID: stateUserID
                });

                await newVoice.save().catch((err) => console.log(err));
                await newMember.voice.setChannel(pRoom.id).catch(async() => {
                    if (!newMember.voice.channel) {
                        if (newVoice) await PARTY.findOneAndDelete({ ownerID: stateUserID });
                        if (pRoom) await pRoom.delete().catch((err) => console.log(err));
                    }
                });
            });
        } else {
            // Send them back to their room if they try and create duplicate rooms
            await newMember.voice.setChannel(roomData.voiceID).catch(async () => {
                if (!newMember.voice.channel) {
                    const voice = newVoiceGuild.channels.cache.get(roomData.voiceID);

                    await voice.delete().catch((err) => console.log(err));
                    await roomData.deleteOne().catch((err) => console.log(err));
                }
            });
        }
    }
    // If a user leaves a channel or moves channels
    else if ((oldChannel !== null && newChannel == null) || (oldChannel !== null && newChannel !== null)) {
        const voiceSize = oldChannel.members.size;

        // If they quickly joined the room creation channel and left, delete any data or created
        // voice channels left over
        if (newChannel === null && oldChannel?.id === configData.pbvcid) {
            const roomData = await PARTY.findOne({
                ownerID: stateUserID
            });
            const createdChannel = newVoiceGuild.channels.cache.get(roomData?.voiceID);

            if (createdChannel)
                await createdChannel.delete().catch(() => {});

            await PARTY.findOneAndDelete({
                ownerID: stateUserID
            });
        }

        // If the room is empty, delete the room (if there's room data)
        if (voiceSize <= 0) {
            const foundData = await PARTY.findOne({ voiceID: oldChannel.id });
            if (!foundData) return; // Not a custom room (Doesn't need a room name check since there wouldn't be any
                                    // room data for normal VCs)

            const roomChannel = newVoiceGuild.channels.cache.get(foundData.voiceID);
            if (roomChannel) await roomChannel.delete().catch((err) => console.log(err));
            
            await PARTY.findOneAndDelete({ voiceID: oldChannel.id });
        } else if (voiceSize !== 0) { // Transfer ownership to random user if owner leaves
            const transferData = await PARTY.findOne({
                voiceID: oldChannel.id
            });

            if (!transferData) return;
            if (transferData.ownerID !== stateUserID) return;

            const randomMember = oldChannel.members.random();

            if (randomMember && randomMember.user) {
                transferData.ownerID = randomMember.user.id;
                transferData.save().catch((err) => console.log(err));
            }
        }
    }
};