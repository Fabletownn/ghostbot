const { WebhookClient } = require('discord.js');
const Sentry = require('@sentry/node');
const LOG_CONFIG = require('../models/logconfig.js');

async function createWebhookButReuseIfPossible(interaction, config, channel) {
    const lData = await LOG_CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data
    const logChannels = [lData.deletechannel, lData.editchannel, lData.usernamechannel, lData.vcchannel, lData.chanupchannel]; // Array of log channels
    const logWebhooks = [lData.deletewebhook, lData.editwebhook, lData.usernamewebhook, lData.vcwebhook, lData.chanupwebhook]; // Array of log webhooks

    let webhookUrl; // URL of a webhook, to be set
    let reused;     // Whether a webhook should be reused

    // If there is no data or existing webhook for the channel yet
    if ((!lData) || (!(logChannels.some((lc) => lc === channel.id)))) {
        // Create the webhook and set variables, set to not reused
        await channel.createWebhook({
            name: 'G.H.O.S.T',
            avatar: 'https://i.imgur.com/ejOuza0.png'
        }).then(async (wh) => {
            webhookUrl = wh.url;
            reused = false;
        });
    }

    // Loop through all log channels and check if there is an already existing webhook being used
    logChannels.some((lc) => {
        if (lc === channel.id) {
            const lcIndex = logChannels.indexOf(lc);
            if (lcIndex < 0) return interaction.reply({ content: 'Failed to set the webhook as something went wrong.' });

            const indexedWebhook = logWebhooks[lcIndex];
            if (indexedWebhook === null) return interaction.reply({ content: 'Failed to set the webhook as something went wrong.' });

            // Set the webhook to be reused
            webhookUrl = indexedWebhook;
            reused = true;
        }
    });

    switch (config) {
        case "deletedchannel": // Set Deleted Logs Channel (Channel); sets the channel to log deleted messages
            lData.deletechannel = channel.id;
            lData.deletewebhook = webhookUrl;
            await lData.save();
            break;
        case "editedchannel": // Set Edited Logs Channel (Channel); sets the channel to log edited messages
            lData.editchannel = channel.id;
            lData.editwebhook = webhookUrl;
            await lData.save();
            break;
        case "usernamechannel": // Set Username Logs Channel (Channel); sets the channel to log username changes
            lData.usernamechannel = channel.id;
            lData.usernamewebhook = webhookUrl;
            await lData.save();
            break;
        case "vcchannel": // Set Voice Channel Logs Channel (Channel); sets the channel to log VC join/move/leaves
            lData.vcchannel = channel.id;
            lData.vcwebhook = webhookUrl;
            await lData.save();
            break;
        case "updatechannel": // Set Channel Update Logs Channel (Channel); sets the channel to log channel name/perm changes
            lData.chanupchannel = channel.id;
            lData.chanupwebhook = webhookUrl;
            await lData.save();
            break;
        default: // None of the above
            await interaction.followUp({ content: 'Failed to save settings as something went wrong.' });
            break;
    }
    
    return reused;
}

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

global.trailInfo = function (error) {
    try {
        Sentry.captureMessage(error);
    } catch (err) {
        console.log(err);
    }
}

global.trailError = function (error) {
    try {
        Sentry.captureException(error);
        console.log(error);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    createWebhookButReuseIfPossible,
    useWebhookIfExisting
};