const { ActivityType } = require('discord.js');
const cron = require('node-cron');
const STATUS = require('../../models/statuses.js');
const LCONFIG = require('../../models/logconfig.js');
const DELETES = require('../../models/deletes.js');
const EDITS = require('../../models/edits.js');
const COOLDOWNS = require('../../models/repcooldowns.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = (Discord, client) => {
    console.log(`${client.user.username} is online and running (in ${client.guilds.cache.size} servers).`);

    /*
        Change bot status upon start/restart, and schedule a status change every hour
    */
    searchAndChangeStatus(client);

    cron.schedule('0 * * * *', async () => {
        searchAndChangeStatus(client);

        /*
            Delete expired report cooldowns every hour
        */
        const cooldowns = await COOLDOWNS.find({ guildID: '435431947963990026' });

        await cooldowns.forEach((cd) => {
            if (cd.expires < Date.now()) {
                cd.deleteOne().catch((err) => console.log(err));
            }
        });
    });

    /*
        Send message logs every 7.5 seconds
    */
    setInterval(async () => {
        const data = await LCONFIG.findOne({ guildID: '435431947963990026' }); // Get existing log configuration data

        if (!data) return;

        const deletelogs = await DELETES.find({ guildID: '435431947963990026' }); // Get existing delete log data

        await deletelogs.forEach((d) => { // Send every log stored and delete the data afterward
            wf.useWebhookIfExisting(client, data.deletechannel, data.deletewebhook, d.embed)
                .then(() => d.deleteOne().catch((err) => console.log(err)));
        });

        const editlogs = await EDITS.find({ guildID: '435431947963990026' }); // Get existing edit log data

        await editlogs.forEach((d) => { // Send every log stored and delete the data afterward, again
            wf.useWebhookIfExisting(client, data.editchannel, data.editwebhook, d.embed)
                .then(() => d.deleteOne().catch((err) => console.log(err)));
        });
    }, (7500));
};

async function searchAndChangeStatus(client) {
    const data = await STATUS.findOne({ guildID: '435431947963990026' }); // Get existing server status data

    // If there is no status data, just set the activity to 'Playing Phasmophobia'
    if (!data) {
        client.user.setPresence({
            activities: [
                { name: 'custom', type: ActivityType.Custom, state: 'Playing Phasmophobia' },
            ],
        });
        
    // Otherwise, go through and select a random status to set to    
    } else {
        const statusIndexes = data.statuses.filter((status) => status !== null);
        const randomize = statusIndexes[Math.floor(Math.random() * statusIndexes.length)];
        const randomStatus = randomize !== 'Phasmophobia' ? randomize : 'Playing Phasmophobia'; // default "Phasmophobia" no longer makes sense with user status

        try {
            client.user.setPresence({
                activities: [
                    { name: 'custom', type: ActivityType.Custom, state: randomStatus },
                ],
            });
        } catch (err) {
            return console.error(`Failed to change bot status: ${err}`);
        }
    }
}