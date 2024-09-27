const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');
const superagent = require('superagent');

module.exports = async (Discord, client, messages, channel) => {
    let bulkDeleteInformation = [];
    let bulkDeleteUserIDs = [];

    const guild = channel.guild;

    const data = await LCONFIG.findOne({
        guildID: guild.id
    });

    if (!data) return;
    if (!(guild.channels.cache.get(data.deletechannel))) return;
    if (!(guild.channels.cache.get(data.editchannel))) return;
    if (data.ignoredchannels == null) return;
    if (data.ignoredcategories == null) return;
    if (data.deletewebhook == null) return;

    if (data.ignoredchannels.some((ignored_channel) => channel.id === ignored_channel)) return;
    if (data.ignoredcategories.some((ignored_cat) => channel.parent.id === ignored_cat)) return;

    const currentDate = new Date().toLocaleString('en-US', { hour12: true });

    messages.forEach((deleted) => {
        if (deleted.partial) return;
        if (deleted.author.bot) return;

        const authorTag = deleted.author.tag;
        const authorDisplayName = deleted.author.displayName;
        const authorID = deleted.author.id;
        const channelName = channel.name;

        let addString = `${authorTag} (${authorDisplayName}) [${authorID}] | (#${channelName}): ${(deleted.content > 2000) ? `${deleted.content.slice(0, 2000)}...` : deleted.content}`;
        let userString = `${authorID}`;
        bulkDeleteInformation.push(addString);
        if (!bulkDeleteUserIDs.includes(userString)) bulkDeleteUserIDs.push(userString);
    });

    if (bulkDeleteInformation.length <= 0) return;

    const lineLength = bulkDeleteInformation[bulkDeleteInformation.length - 1].replace(/\n/g, '').replace(/./g, '-')
    const sendContent = `Phasmophobia Bulk Delete @ ${currentDate} UTC:\n\n${bulkDeleteInformation.join('\n')}\n\n${lineLength}\n`
        + `Out of ${messages.size} deleted messages, ${bulkDeleteInformation.length} are logged. Messages are not logged if they are uncached, sent by a bot, or similar.`;

    try {
        superagent
            .post('https://sourceb.in/api/bins')
            .send({
                files: [{
                    name: 'Phasmophobia Bulkdelete Sourcebin Log',
                    content: sendContent
                }]
            })
            .end((err, res) => {
                if (err) return console.log(err);

                if (res.ok) {
                    const bulkDeleteEmbed = new EmbedBuilder()
                        .setDescription(`**${messages.size}** message(s) were deleted and **${bulkDeleteInformation.length}** are known in cache.\n\n**IDs Involved**: ${(bulkDeleteUserIDs.length > 0) ? bulkDeleteUserIDs.join(', ') : 'Unknown'}`)
                        .addFields(
                            { name: 'Link', value: `https://cdn.sourceb.in/bins/${res.body.key}/0` }
                        )
                        .setTimestamp()
                        .setColor('#ED498D');

                    wf.useWebhookIfExisting(client, data.deletechannel, data.deletewebhook, bulkDeleteEmbed);
                } else {
                    return console.error(`Error uploading bulk delete log: ${res.statusCode} - ${res.body.message}`);
                }
            });
    } catch (error) {
        return console.error(`Error uploading bulk delete log: ${error}`);
    }
}