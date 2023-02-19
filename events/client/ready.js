const { Discord, ActivityType } = require('discord.js');
const STATUS = require('../../models/statuses.js');
const UNAME = require('../../models/username.js');

const cron = require('node-cron');

module.exports = (Discord, client) => {

    const currentTime = new Date().toLocaleTimeString();
    const clientUsername = client.user.username;

    console.log(`[${currentTime}] ${clientUsername} - Online and running (in ${client.guilds.cache.size} servers).`);

    searchAndChangeStatus(client);

    cron.schedule('1 * * * *', () => {

        searchAndChangeStatus(client);

    });

    /*
        Username history, added interval so the bot can check and clear name histories over 1 week old
        Checks every hour, unlike cron this gets reset everytime the bot restarts so it's unreliable
    */
    setInterval(() => {

        UNAME.find({

            guildID: '435431947963990026'

        }, (err, data) => {

            if (err) return console.log(err);

            if (data) {

                data.forEach((d) => {

                    let expiryTime = d.expireOn;

                    if (Date.now() > expiryTime) d.delete().catch((err) => console.log(err));

                });

            }

        });

    }, (1000 * 60 * 60));

};

/*
    Staff fun command, they're able to put phrases for the bot to use as a status
    Searches through and changes it every hour if there is one
*/
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

            let statusIndexes = data.statuses.filter((status) => status !== null);
            let randomStatus = statusIndexes[Math.floor(Math.random() * statusIndexes.length)];

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