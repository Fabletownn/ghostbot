const { ButtonBuilder, ButtonStyle, ContainerBuilder, SectionBuilder } = require('discord.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');
const BULKS = require('../../models/bulkdeletes.js');

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
    
    for (const deleted of messages.values()) {
        if (deleted.partial) continue;
        if (deleted.author?.bot) continue;
        
        const content = (deleted.content || '').slice(0, 2000);
        const authorTag = deleted.author.tag;
        const authorID = deleted.author.id;
        const channelName = channel.name;
        
        // Push the deleted information into the array
        bulkDeleteInformation.push(`@${authorTag} (${authorID}) | #${channelName}: ${content}`);
        
        // Add the user ID into the list of involved users if not already
        if (!bulkDeleteUserIDs.includes(authorID)) bulkDeleteUserIDs.push(authorID);
    }

    // Don't upload an empty log
    if (bulkDeleteInformation.length <= 0) return;

    const logContent = bulkDeleteInformation.reverse().join('\n')
        + `\n\n${messages.size} messages were deleted in bulk and ${bulkDeleteInformation.length} are logged. Messages may not be logged if they are uncached, sent by a bot, or similar.`;

    // Send a request to upload the bulk delete log
    try {
        const bulkLogText = new SectionBuilder()
            .addTextDisplayComponents((text) =>
                text.setContent(`### **${messages.size}** messages were deleted with **${bulkDeleteInformation.length}** known in cache\n**IDs Involved**: ${(bulkDeleteUserIDs.length > 0) ? bulkDeleteUserIDs.join(', ') : 'Unknown'}`)
            )
            .setButtonAccessory(new ButtonBuilder()
                .setStyle(ButtonStyle.Primary)
                .setEmoji('1332851977507307550')
                .setCustomId('log-viewbulk')
            );

        const logContainer = new ContainerBuilder()
            .addSectionComponents(bulkLogText)
            .setAccentColor(0xED498D)

        // Send the log through the webhook, and if successful, use the ID of that log in the bulk data
        const sentLog = await useWebhookIfExisting(client, lData.deletechannel, lData.deletewebhook, logContainer, true);
        if (sentLog) {
            const newBulkLogData = new BULKS({
                messageID: sentLog.id,
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // expire 3 months from now
                log: logContent
            });

            await newBulkLogData.save();
        }
    } catch (error) {
        return trailError(`Error uploading bulk delete log: ${error}`);
    }
}