const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = async (Discord, client, oldMember, newMember) => {
    // Don't log if the user is a partial, bot, or if both nicknames are the same
    if (oldMember.user.partial) return;
    if (oldMember.user.bot || newMember.user.bot) return;
    if (oldMember.displayName === newMember.displayName) return;
    
    const cTimestamp = Math.round((Date.now()) / 1000);           // Timestamp of the current day and time
    const data = await LCONFIG.findOne({ guildID: newMember.guild.id }); // Get existing log configuration data

    // Don't log if there is no data, log channel, or log webhook
    if (!data) return;
    if (!data.usernamechannel) return;
    if (!data.usernamewebhook) return;

    ///////////////////////////// Nickname
    const oldNick = oldMember.displayName;
    const newNick = newMember.displayName;

    if (oldNick === null) return;

    const nickNameEmbed = new EmbedBuilder()
        .setAuthor({ name: newMember.user.tag, iconURL: newMember.user.displayAvatarURL({ size: 512, dynamic: true }) })
        .setDescription(`<@${newMember.user.id}>'s server nickname was updated`)
        .addFields([
            { name: 'New', value: (newNick === newMember.user.displayName) ? 'None' : newNick, inline: true },
            { name: 'Previous', value: (oldNick === oldMember.user.displayName) ? 'None' : oldNick, inline: true },
            { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
            { name: 'ID', value: `\`\`\`ini\nUser = ${newMember.user.id}\`\`\`` }
        ])
        .setTimestamp()

    await wf.useWebhookIfExisting(client, data.usernamechannel, data.usernamewebhook, nickNameEmbed);
};