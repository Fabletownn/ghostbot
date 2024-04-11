const { WebhookClient } = require('discord.js');

async function useWebhookIfExisting(client, channel, webhook, embed) {
    const useChannel = client.channels.cache.get(channel);

    if (!useChannel || !channel || channel == null) return;
    if (!webhook) return;

    const webhookID = webhook.split(/\//)[5];
    const webhookToken = webhook.split(/\//)[6];
    const tryFetchWebhook = await useChannel.fetchWebhooks();
    const fetchedWebhook = tryFetchWebhook.find((wh) => wh.id === webhookID);

    if (!fetchedWebhook) return;

    const webhookClient = new WebhookClient({ id: webhookID, token: webhookToken });

    if (Array.isArray(embed)) {
        webhookClient.send({ embeds: embed }).catch((err) => { console.log('Error uploading log:\n' + err) });
    } else {
        webhookClient.send({ embeds: [embed] }).catch((err) => { console.log('Error uploading log:\n' + err) });
    }
}

async function deleteWebhookIfExisting(client, channel) {
    const deleteChannel = client.channels.cache.get(channel);

    if (!deleteChannel || !channel || channel == null) return;

    const fetchWebhooks = await deleteChannel.fetchWebhooks();
    const fetchedWebhook = fetchWebhooks.filter((wh) => wh.owner.id === client.user.id && wh.name.toLowerCase().includes('g.h.o.s.t'));

    if (!fetchedWebhook) return;

    for (const webhook of fetchedWebhook.values()) await webhook.delete();
}

module.exports = { useWebhookIfExisting, deleteWebhookIfExisting };