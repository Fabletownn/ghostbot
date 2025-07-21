const { WebhookClient } = require('discord.js');
const winston = require('winston'); require('winston-syslog');

const papertrail = new winston.transports.Syslog({
    host: process.env.PT_HOST,
    port: process.env.PT_PORT,
    protocol: 'tls4',
    localhost: 'GHOST',
    eol: '\n',
});

const logger = winston.createLogger({
    format: winston.format.simple(),
    levels: winston.config.syslog.levels,
    transports: [papertrail]
});

async function useWebhookIfExisting(client, channel, webhook, embed) {
    const useChannel = client.channels.cache.get(channel);

    if (!useChannel || !channel) return;
    if (!webhook) return;

    const webhookID = webhook.split(/\//)[5];
    const webhookToken = webhook.split(/\//)[6];

    const tryFetchWebhook = await useChannel.fetchWebhooks();
    const fetchedWebhook = tryFetchWebhook.find((wh) => wh.id === webhookID);

    if (!fetchedWebhook) return;

    const webhookClient = new WebhookClient({ id: webhookID, token: webhookToken });

    if (Array.isArray(embed)) {
        webhookClient.send({ embeds: embed }).catch((err) => { trailError('Error uploading log:\n' + err) });
    } else {
        webhookClient.send({ embeds: [embed] }).catch((err) => { trailError('Error uploading log:\n' + err) });
    }
}

async function deleteWebhookIfExisting(client, channel) {
    const deleteChannel = client.channels.cache.get(channel);

    if (!deleteChannel || !channel) return;

    const fetchWebhooks = await deleteChannel.fetchWebhooks();
    const fetchedWebhook = fetchWebhooks.filter((wh) => wh.owner.id === client.user.id && wh.name.toLowerCase().includes('g.h.o.s.t'));

    if (!fetchedWebhook) return;

    for (const webhook of fetchedWebhook.values()) await webhook.delete();
}

global.trailInfo = function (error) {
    try {
        logger.info(error);
    } catch (err) {
        console.log(err);
    }
}

global.trailError = function (error) {
    try {
        const err_message = error.message || error;
        const stack = error.stack || 'no stack available';
        
        logger.error(`${err_message}\n${stack}`);
        console.log(error);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { useWebhookIfExisting };