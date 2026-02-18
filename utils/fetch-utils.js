function getChannel(guild, channelID) {
    return guild.channels.cache.get(channelID) || null;
}

async function getMessage(guild, channelID, messageID) {
    const channel = await guild.channels.cache.get(channelID);
    if (!channel) return null;
    
    try {
        return await channel.messages.fetch(messageID);
    } catch {
        return null;
    }
}

async function getUser(client, userID, isforced = false) {
    try {
        return await client.users.fetch(userID, { force: isforced });
    } catch {
        return null;
    }
}

async function getMember(guild, userID) {
    try {
        return await guild.members.fetch(userID);
    } catch {
        return null;
    }
}

module.exports = {
    getChannel,
    getMessage,
    getUser,
    getMember
};
