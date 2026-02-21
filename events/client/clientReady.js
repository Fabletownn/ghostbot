const { ActivityType } = require('discord.js');
const cron = require('node-cron');
const STATUS = require('../../models/statuses.js');
const DELETES = require('../../models/deletes.js');
const EDITS = require('../../models/edits.js');
const { cacheConfigData, cacheLogConfigData } = require('../../utils/data-utils.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');

module.exports = async (Discord, client) => {
    /*
        Most frequently queried databases, cache them at bot startup so they are accessed faster later
    */
    await cacheConfigData(client);
    await cacheLogConfigData(client);

    /*
        Change bot status upon start/restart, and schedule a status change every hour
    */
    searchAndChangeStatus(client).catch(() => {});

    cron.schedule('0 * * * *', async () => {
        try {
            await searchAndChangeStatus(client);
        } catch (_) {}
    });

    /*
        Send message logs every 7.5 seconds
    */
    setInterval(async() => {
        try {
            const lData = client.cachedLogConfig; // Get existing log configuration data
            if (!lData) return;

            const deleteLogs = await DELETES.find({ guildID: process.env.GUILDID }); // Get existing delete log data
            const editLogs = await EDITS.find({ guildID: process.env.GUILDID }); // Get existing edit log data

            for (const d of deleteLogs) {
                await useWebhookIfExisting(client, lData.deletechannel, lData.deletewebhook, d.embed);
                await d.deleteOne();
            }

            for (const e of editLogs) {
                await useWebhookIfExisting(client, lData.editchannel, lData.editwebhook, e.embed);
                await e.deleteOne();
            }
        } catch (error) {
            trailError(error);
        }
    }, 7500);

    console.log(`${client.user.username} is online and running (in ${client.guilds.cache.size} servers).`);
}

async function searchAndChangeStatus(client) {
    const sData = await STATUS.findOne({ guildID: process.env.GUILDID }); // Get existing server status data

    // If there is no status data, just set the activity to 'Playing Phasmophobia'
    if (!sData) {
        client.user.setPresence({
            activities: [
                { name: 'custom', type: ActivityType.Custom, state: 'Playing Phasmophobia' },
            ],
        });
        
    // Otherwise, go through and select a random status to set to    
    } else {
        const statusIndexes = sData.statuses.filter((status) => status !== null);
        const randomize = statusIndexes[Math.floor(Math.random() * statusIndexes.length)];
        const randomStatus = randomize !== 'Phasmophobia' ? randomize : 'Playing Phasmophobia'; // default "Phasmophobia" no longer makes sense with user status

        try {
            client.user.setPresence({
                activities: [
                    { name: 'custom', type: ActivityType.Custom, state: randomStatus },
                ],
            });
        } catch (err) {
            return trailError(`Failed to change bot status: ${err}`);
        }
    }
}