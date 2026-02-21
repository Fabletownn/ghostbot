const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getChannel, getMember } = require('./fetch-utils.js');
const LOG_CONFIG = require('../models/logconfig.js');
const PARTY = require('../models/party.js');

async function handleAction(interaction, voice_channel, action, user) {
    const cData = interaction.client.cachedConfig;
    const actionMember = user ? await getMember(interaction.guild, user.id) : null;
    let userID = 0;
    
    switch (action) {
        case "lockroom": // Lock Room; locks the room to prevent members from joining
            await voice_channel.setUserLimit(voice_channel.members.size);
            break;
        case "unlockroom": // Unlock Room; unlocks the room to allow others to join
            
            await voice_channel.setUserLimit(cData?.pbvclimit || 4);
            break;
        case "kickuser": // Kick User (User); kicks a user from the room
            const kickVoiceChannel = actionMember.voice.channel;
            if (!actionMember || !kickVoiceChannel || (kickVoiceChannel && kickVoiceChannel.id !== voice_channel.id))
                return interaction.followUp({ content: 'That user is not connected to your voice channel.', flags: MessageFlags.Ephemeral });
            
            await actionMember.voice.setChannel(null, {
                reason: `Disconnected from voice channel by custom VC host ${interaction.user.username} (${interaction.user.id})`
            });
            
            userID = user.id;
            break;
        case "banuser": // Ban User (User); bans a user from the room
            if (!actionMember) return interaction.followUp({ content: 'That user is no longer in the server.', flags: MessageFlags.Ephemeral });

            // Remove the banned user's permission to connect to the voice channel
            await voice_channel.permissionOverwrites.edit(user.id, {
                Connect: false
            });
            
            // If they are currently in the voice channel, disconnect them
            const banVoiceChannel = actionMember.voice?.channel;
            if (banVoiceChannel?.id === interaction.member.voice?.channel?.id) {
                await actionMember.voice.setChannel(null, {
                    reason: `Banned from voice channel by custom VC host ${interaction.user.username} (${interaction.user.id})`
                });
            }
            
            userID = user.id;
            break;
        case "unbanuser": // Unban User (User); unbans a user from the room
            if (!actionMember) return interaction.followUp({ content: 'That user is no longer in the server.', flags: MessageFlags.Ephemeral });

            await voice_channel.permissionOverwrites.delete(user.id);

            userID = user.id;
            break;
        case "transferowner": // Transfer Room Ownership (User); transfers ownership to another person in the voice channel
            if (!actionMember) return interaction.followUp({ content: 'That user is no longer in the server.', flags: MessageFlags.Ephemeral });
            
            const pData = await PARTY.findOne({ voiceID: voice_channel.id });
            if (!pData) return interaction.followUp({ content: 'Something went wrong.', flags: MessageFlags.Ephemeral });
            
            const ownerVoiceChannel = actionMember.voice.channel;
            if (!ownerVoiceChannel) return interaction.followUp({ content: 'That user is not connected to your voice channel.', flags: MessageFlags.Ephemeral });
            if (ownerVoiceChannel.id !== voice_channel.id) return interaction.followUp({ content: 'That user is not connected to your voice channel.', flags: MessageFlags.Ephemeral });

            pData.ownerID = user.id;
            await pData.save();

            userID = user.id;
            break;
        default:
            break;
    }
    
    return userID;
}

async function logAction(interaction, choicekey, userID = 0) {
    const lData = interaction.client.cachedLogConfig; // Get existing configuration data

    // If there is no data or existing data channel, don't continue
    if (!lData) return;
    if (!lData.vcchannel) return;

    const logUser = interaction.user;
    const logAvatar = interaction.user.displayAvatarURL({ dynamic: true });
    const cTimestamp = Math.round((Date.now()) / 1000);

    let logMessage = 'Unknown';

    switch (choicekey) {
        case "lockroom":
            logMessage = 'Locked their room';
            break;
        case "unlockroom":
            logMessage = 'Unlocked their room';
            break;
        case "kickuser":
            logMessage = 'Kicked a member from their room';
            break;
        case "banuser":
            logMessage = 'Banned a member from their room';
            break;
        case "unbanuser":
            logMessage = 'Unbanned a member from their room';
            break;
        case "transferowner":
            logMessage = 'Transferred ownership to another member';
            break;
        default:
            return;
    }

    const logEmbed = new EmbedBuilder()
        .setAuthor({ name: logUser.username, iconURL: logAvatar })
        .setDescription(`<@${logUser.id}> updated their custom voice channel`)
        .addFields([
            { name: 'Action', value: logMessage, inline: true }
        ])
        .setTimestamp();

    if (userID !== 0) { // If there was a user ID that got kicked/banned/etc. log it
        await logEmbed.addFields([
            { name: 'Member', value: `<@${userID}> (${userID})`, inline: true },
            { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
            { name: 'ID', value: `\`\`\`ini\nOwner = ${logUser.id}\nUser = ${userID}\`\`\`` }
        ]);
    } else {
        await logEmbed.addFields([
            { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
            { name: 'ID', value: `\`\`\`ini\nOwner = ${logUser.id}\`\`\`` }
        ]);
    }

    await getChannel(interaction.guild, lData.vcchannel).send({ embeds: [logEmbed] });
}

async function checkOwnership(interaction) {
    const currentChannel = interaction?.member?.voice?.channel;
    const userID = interaction?.user?.id;

    if (currentChannel && userID) {
        const checkData = await PARTY.findOne({ voiceID: currentChannel.id, ownerID: userID });
        if (checkData) return true;
    }

    return false;
}

module.exports = {
    handleAction,
    logAction,
    checkOwnership
}