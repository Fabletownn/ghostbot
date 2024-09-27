const { ActivityType } = require('discord.js');
const cron = require('node-cron');
const STATUS = require('../../models/statuses.js');
const LCONFIG = require('../../models/logconfig.js');
const DELETES = require('../../models/deletes.js');
const EDITS = require('../../models/edits.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = (Discord, client) => {
    console.log(`${client.user.username} is online and running (in ${client.guilds.cache.size} servers).`);

    /*
        Change bot status upon start/restart, and schedule a status change every hour
    */
    searchAndChangeStatus(client);

    cron.schedule('0 * * * *', () => {
        searchAndChangeStatus(client);
    });

    /*
        Send message logs every 7.5 seconds
    */
    setInterval(async () => {
        const data = await LCONFIG.findOne({
            guildID: '435431947963990026'
        });

        if (!data) return;

        const deletelogs = await DELETES.find({
            guildID: '435431947963990026'
        });

        await deletelogs.forEach((d) => {
            wf.useWebhookIfExisting(client, data.deletechannel, data.deletewebhook, d.embed)
                .then(() => d.delete().catch((err) => console.log(err)));
        });

        const editlogs = await EDITS.find({
            guildID: '435431947963990026'
        });

        await editlogs.forEach((d) => {
            wf.useWebhookIfExisting(client, data.editchannel, data.editwebhook, d.embed)
                .then(() => d.delete().catch((err) => console.log(err)));
        });
    }, (7500));
};

async function searchAndChangeStatus(client) {
    const data = await STATUS.findOne({
        guildID: '435431947963990026'
    });

    if (!data) {
        client.user.setPresence({
            activities: [
                { name: 'Phasmophobia', type: ActivityType.Playing },
            ],
        });
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