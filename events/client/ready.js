const { ActivityType } = require('discord.js');
const STATUS = require('../../models/statuses.js');
const LCONFIG = require('../../models/logconfig.js');
const DELETES = require('../../models/deletes.js');
const EDITS = require('../../models/edits.js');
const cron = require('node-cron');
const wf = require('../../handlers/webhook_functions.js');

module.exports = (Discord, client) => {
    console.log(`${client.user.username} is online and running (in ${client.guilds.cache.size} servers).`);

    /*
        Change bot status upon start/restart, and schedule a status change every hour
    */
    searchAndChangeStatus(client);

    cron.schedule('1 * * * *', () => {
        searchAndChangeStatus(client);
    });

    /*
        Send message logs every 7.5 seconds
    */
    setInterval(async () => {
        LCONFIG.findOne({
            guildID: '435431947963990026'
        }, async (err, data) => {
            if (err) return;
            if (!data) return;

            DELETES.find({ guildID: '435431947963990026' }).then((deletelogs) => {
                deletelogs.forEach((d) => {
                    wf.useWebhookIfExisting(client, data.deletechannel, data.deletewebhook, d.embed)
                        .then(() => d.delete().catch((err) => console.log(err)));
                });
            });
            
            EDITS.find({ guildID: '435431947963990026' }).then((editlogs) => {
                editlogs.forEach((d) => {
                    wf.useWebhookIfExisting(client, data.editchannel, data.editwebhook, d.embed)
                        .then(() => d.delete().catch((err) => console.log(err)));
                });
            });
        });
    }, (7500));
};

function searchAndChangeStatus(client) {
    STATUS.findOne({
        guildID: '435431947963990026'
    }, (err, data) => {
        if (err) return console.log(err);

        if (!data) {
            client.user.setPresence({
                activities: [{
                    name: 'Phasmophobia',
                    type: ActivityType.Playing
                }],
                status: 'online'
            });
        } else if (data) {
            const statusIndexes = data.statuses.filter((status) => status !== null);
            const randomStatus = statusIndexes[Math.floor(Math.random() * statusIndexes.length)];

            client.user.setPresence({
                activities: [{
                    name: randomStatus || 'Phasmophobia',
                    type: ActivityType.Playing
                }],
                status: 'online'
            });
        }
    });
}