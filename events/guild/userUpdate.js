const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const wf = require('../../handlers/webhook_functions.js');

module.exports = async (Discord, client, oldUser, newUser) => {
    if (oldUser.partial) return;
    if (oldUser.bot || newUser.bot) return;
    if (oldUser.username === newUser.username && oldUser.displayName === newUser.displayName) return;

    const cTimestamp = Math.round((Date.now()) / 1000);

    LCONFIG.findOne({
        guildID: newUser.guild.id
    }, async (err, data) => {
        if (err) return console.log(err);
        if (!data) return;
        if (!data.usernamechannel) return;

        ///////////////////////////// Display Name
        if (oldUser.displayName !== newUser.displayName) {
            const oldDisplay = oldUser.displayName;
            const newDisplay = newUser.displayName;

            if (oldDisplay === null) return;

            const displayNameEmbed = new EmbedBuilder()
                .setAuthor({ name: `${newUser.tag} updated their display name`, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newUser.id}>'s display name was updated`)
                .addFields([
                    { name: 'New', value: oldDisplay || 'Unknown', inline: true },
                    { name: 'Previous', value: newDisplay || 'Unknown', inline: true },
                    { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newUser.id}\`\`\`` }
                ])
                .setTimestamp()

            await wf.useWebhookIfExisting(client, data.usernamechannel, data.usernamewebhook, displayNameEmbed);
        }

        ///////////////////////////// Username
        if (oldUser.username !== newUser.username) {
            const oldUsername = oldUser.username;
            const newUsername = newUser.username;

            if (oldUsername === null) return;

            const usernameEmbed = new EmbedBuilder()
                .setAuthor({ name: `${newUser.tag} updated their username`, iconURL: newUser.displayAvatarURL({ size: 512, dynamic: true }) })
                .setDescription(`<@${newUser.id}>'s username was updated`)
                .addFields([
                    { name: 'New', value: newUsername || 'Unknown', inline: true },
                    { name: 'Previous', value: oldUsername || 'Unknown', inline: true },
                    { name: 'Date', value: `<t:${cTimestamp}:F>`, inline: false },
                    { name: 'ID', value: `\`\`\`ini\nUser = ${newUser.id}\`\`\`` }
                ])
                .setTimestamp()

            await wf.useWebhookIfExisting(client, data.usernamechannel, data.usernamewebhook, usernameEmbed);
        }
    });
};