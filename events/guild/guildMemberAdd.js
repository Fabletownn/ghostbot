const CONFIG = require('../../models/config.js');
const PULLS = require('../../models/pullrooms.js');

/*
    Checks if a member is joining the server after evading a pullroom
    If a member still has a pullroom channel after leaving and rejoining, readd the role and put them back in there
*/
module.exports = async (Discord, client, member) => {
    const guildID = member.guild.id;
    const userID = member.user.id;

    const configData = await CONFIG.findOne({ guildID: guildID }); // Get existing configuration data
    if (!configData) return;
    if (!configData.pullroleid) return; // Don't continue if there is no Pulled role

    const pullData = await PULLS.findOne({ userID: userID }); // Get existing pullroom data for the user
    if (!pullData) return;

    const pullChannel = member.guild.channels.cache.get(pullData.channelID);
    if (!pullChannel) return pullData.delete(); // If data exists but there is no channel, delete the data

    // Give the user the Pulled role, readd their channel permissions, and alert them they still have a pullroom open
    await member.roles.add(configData.pullroleid);

    await pullChannel.permissionOverwrites.edit(userID, {
        ViewChannel: true,
        ReadMessageHistory: true,
        SendMessages: true,
        AttachFiles: true,
        EmbedLinks: true
    });

    await pullChannel.send({ content: `<@${userID}> You still have a pullroom open, please allow the session to conclude before leaving again!` });
}