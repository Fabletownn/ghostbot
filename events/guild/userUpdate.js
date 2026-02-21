const { EmbedBuilder } = require('discord.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');

module.exports = async (Discord, client, oldUser, newUser) => {
    // Don't log if the user is a partial, bot, or if both display names are the same
    if (oldUser.partial || newUser.partial) return;
    if (oldUser.bot || newUser.bot) return;
    if ((oldUser.username === newUser.username) && (oldUser.displayName === newUser.displayName)) return;

    const cTimestamp = Math.round((Date.now()) / 1000);

    const lData = client.cachedLogConfig; // Get existing log configuration data
    if (!lData) return;
    if (!lData.usernamechannel) return;

    ///////////////////////////// Display Name
    if (oldUser.displayName !== newUser.displayName) {
        const oldDisplay = oldUser.displayName; // Old display name
        const newDisplay = newUser.displayName; // New display name

        if (oldDisplay === null) return;

        const displayNameEmbed = new EmbedBuilder()
            .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
            .setDescription(`<@${newUser.id}>'s display name was updated`)
            .addFields([
                { name: 'New', value: newDisplay || 'Unknown', inline: true },
                { name: 'Previous', value: oldDisplay || 'Unknown', inline: true },
                { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
                { name: 'ID', value: `\`\`\`ini\nUser = ${newUser.id}\`\`\`` }
            ])
            .setTimestamp()

        await useWebhookIfExisting(client, lData.usernamechannel, lData.usernamewebhook, displayNameEmbed);
    }

    ///////////////////////////// Username
    if (oldUser.username !== newUser.username) {
        const oldUsername = oldUser.username; // Old username
        const newUsername = newUser.username; // New username

        if (oldUsername === null) return;

        const usernameEmbed = new EmbedBuilder()
            .setAuthor({ name: newUser.tag, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
            .setDescription(`<@${newUser.id}>'s username was updated`)
            .addFields([
                { name: 'New', value: newUsername || 'Unknown', inline: true },
                { name: 'Previous', value: oldUsername || 'Unknown', inline: true },
                { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
                { name: 'ID', value: `\`\`\`ini\nUser = ${newUser.id}\`\`\`` }
            ])
            .setTimestamp()

        await useWebhookIfExisting(client, lData.usernamechannel, lData.usernamewebhook, usernameEmbed);
    }
};