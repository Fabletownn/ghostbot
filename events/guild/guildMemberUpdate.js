const { EmbedBuilder } = require('discord.js');
const { useWebhookIfExisting } = require('../../utils/webhook-utils.js');

module.exports = async (Discord, client, oldMember, newMember) => {
    // Don't log if the user is a partial, bot, or if both nicknames are the same
    if (oldMember.user.partial) return;
    if (oldMember.user.bot || newMember.user.bot) return;
    if (oldMember.displayName === newMember.displayName) return;
    
    const cTimestamp = Math.round((Date.now()) / 1000); // Timestamp of the current day and time
    const lData = client.cachedLogConfig; // Get existing log configuration data

    // Don't log if there is no data, log channel, or log webhook
    if (!lData) return;
    if (!lData.usernamechannel) return;
    if (!lData.usernamewebhook) return;

    ///////////////////////////// Nickname
    const oldNick = oldMember.displayName;
    const newNick = newMember.displayName;

    if (oldNick === null) return;

    const nicknameEmbed = new EmbedBuilder()
        .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL({ size: 512, dynamic: true }) })
        .setDescription(`<@${newMember.user.id}>'s server nickname was updated`)
        .addFields([
            { name: 'New', value: (newNick === newMember.user.displayName) ? 'None' : newNick, inline: true },
            { name: 'Previous', value: (oldNick === oldMember.user.displayName) ? 'None' : oldNick, inline: true },
            { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
            { name: 'ID', value: `\`\`\`ini\nUser = ${newMember.user.id}\`\`\`` }
        ])
        .setTimestamp()

    await useWebhookIfExisting(client, lData.usernamechannel, lData.usernamewebhook, nicknameEmbed);
};