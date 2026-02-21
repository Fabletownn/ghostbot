const { EmbedBuilder } = require('discord.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');
const superagent = require('superagent');

module.exports = async (Discord, client, messages, channel) => {
    let bulkDeleteInformation = []; // Prepare empty array for bulk delete information
    let bulkDeleteUserIDs = [];     // Prepare empty array for list of user IDs involved

    const guild = channel.guild; // Fetch the server
    const lData = client.cachedLogConfig; // Get existing log configuration data

    // Don't log if there is no data, no ignored channels or categories, or webhooks ready to send it
    if (!lData) return;
    if (!(guild.channels.cache.get(lData.deletechannel))) return;
    if (!(guild.channels.cache.get(lData.editchannel))) return;
    if (lData.ignoredchannels == null) return;
    if (lData.ignoredcategories == null) return;
    if (lData.deletewebhook == null) return;

    // Do not log if the channel or category the channel is in is being ignored
    const categoryID = channel.isThread() ? channel.parent?.parent.id : (channel.parent ? channel.parent.id : null);

    if (lData.ignoredchannels.includes(channel.id) || lData.ignoredchannels.includes(channel.parent?.id)) return;
    if (lData.ignoredcategories.includes(categoryID)) return;

    const currentDate = new Date().toLocaleString('en-US', { hour12: true }); // Stringified date to upload

    // For each message deleted in the bulk deletion
    messages.forEach((deleted) => {
        // Do not log if it is partial or from a bot
        if (deleted.partial) return;
        if (deleted.author.bot) return;

        const authorTag = deleted.author.tag; // Deleted author's tag
        const authorDisplayName = deleted.author.displayName; // Deleted author's name
        const authorID = deleted.author.id; // Deleted author's ID
        const channelName = channel.name; // Channel name

        // String to add for every message deletion
        let addString = `${authorTag} (${authorDisplayName}) [${authorID}] | (#${channelName}): ${(deleted.content > 2000) ? `${deleted.content.slice(0, 2000)}...` : deleted.content}`;
        let userString = `${authorID}`;
        
        // Push every message into the upload log, and every user ID involved (if not already in) to the ID array
        bulkDeleteInformation.push(addString);
        if (!bulkDeleteUserIDs.includes(userString)) bulkDeleteUserIDs.push(userString);
    });

    // Don't upload an empty log
    if (bulkDeleteInformation.length <= 0) return;

    const lineLength = bulkDeleteInformation[bulkDeleteInformation.length - 1].replace(/\n/g, '').replace(/./g, '-') // Ending lined dashes depending on how long the last message is
    const sendContent = `Phasmophobia Bulk Delete @ ${currentDate} UTC:\n\n${bulkDeleteInformation.join('\n')}\n\n${lineLength}\n`
        + `Out of ${messages.size} deleted messages, ${bulkDeleteInformation.length} are logged. Messages are not logged if they are uncached, sent by a bot, or similar.`;

    // Send a request to upload the bulk delete log
    try {
        const res = superagent
            .post('https://sourceb.in/api/bins')
            .send({
                files: [{
                    name: 'Phasmophobia Bulkdelete Sourcebin Log',
                    content: sendContent
                }]
            });
        
        if (res.ok) {
            const bulkDeleteEmbed = new EmbedBuilder()
                .setDescription(`**${messages.size}** message(s) were deleted and **${bulkDeleteInformation.length}** are known in cache.\n\n**IDs Involved**: ${(bulkDeleteUserIDs.length > 0) ? bulkDeleteUserIDs.join(', ') : 'Unknown'}`)
                .addFields(
                    { name: 'Link', value: `https://cdn.sourceb.in/bins/${res.body.key}/0` }
                )
                .setTimestamp()
                .setColor('#ED498D');

            await useWebhookIfExisting(client, lData.deletechannel, lData.deletewebhook, bulkDeleteEmbed);
        }
    } catch (error) {
        return trailError(`Error uploading bulk delete log: ${error}`);
    }
}