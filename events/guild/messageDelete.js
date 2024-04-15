const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const DELETES = require('../../models/deletes.js');

module.exports = async (Discord, client, message) => {
    if (message.partial) return;
    if (message.author.bot) return;

    LCONFIG.findOne({
        guildID: message.guild.id
    }, async (err, data) => {
        if (err) return console.log(err);
        if (!data) return;

        if (!(message.guild.channels.cache.get(data.deletechannel))) return;
        if (data.ignoredchannels == null) return;
        if (data.ignoredcategories == null) return;
        if (data.deletewebhook == null) return;

        if (data.ignoredchannels.some((ignored_channel) => message.channel.id === ignored_channel)) return;
        if (data.ignoredcategories.some((ignored_cat) => message.channel.parent.id === ignored_cat)) return;

        const deletedContent = message.content ? message.content : '<No Message Content>';
        const deletedEditedContent = deletedContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>').replace(/\//g, '\\/');
        const deletedID = message.id;
        const deletedChannelID = message.channel.id;
        const deletedAuthorID = message.author.id;
        const deletedTime = Math.round((message.createdTimestamp) / 1000);
        const deletedAuthorTag = client.users.cache.get(deletedAuthorID).tag;

        const embedCharacterLimit = 1000;
        const contentFieldsNeeded = Math.ceil(deletedEditedContent.length / embedCharacterLimit);
        let overloadedEmbed = 0;

        const deletedEmbed = new EmbedBuilder()
            .setAuthor({ name: deletedAuthorTag, iconURL: client.users.cache.get(deletedAuthorID).displayAvatarURL({ dynamic: true }) || 'https://i.imgur.com/NZzCLrw.png' })
            .setDescription(`Message deleted in <#${deletedChannelID}>`)
            .setTimestamp()
            .setColor('#822AED');

        if (contentFieldsNeeded <= 1) {
            deletedEmbed.setFields(
                { name: `Content`, value: deletedEditedContent || 'None' },
                { name: `Date`, value: `<t:${deletedTime}:F> (<t:${deletedTime}:R>)` },
                { name: `ID`, value: `\`\`\`ini\nUser = ${deletedAuthorID}\nMessage = ${deletedID}\`\`\`` }
            )
        } else {
            for (let i = 1; i <= contentFieldsNeeded; i++) {
                deletedEmbed.addFields(
                    { name: (i > 1 ? 'Continued' : 'Content'), value: (i > 1 ? (deletedEditedContent.slice(((i - 1) * embedCharacterLimit), embedCharacterLimit * i)) : (deletedEditedContent.slice(0, embedCharacterLimit))) }
                )
            }

            deletedEmbed.addFields(
                { name: `Date`, value: `<t:${deletedTime}:F> (<t:${deletedTime}:R>)` },
                { name: `ID`, value: `\`\`\`ini\nUser = ${deletedAuthorID}\nMessage = ${deletedID}\`\`\`` }
            );

            overloadedEmbed = contentFieldsNeeded;
        }

        DELETES.findOne({
            guildID: message.guild.id
        }, (err, data) => {
            if (err) return console.log(err);

            if (data) {
                DELETES.find({ guildID: message.guild.id }).then(async (deletedata) => {
                    var addedData = 0;

                    await deletedata.forEach((d) => {
                        if (d.embed.length < 10 && d.overload < 5) {
                            d.embed.push(deletedEmbed.toJSON());
                            if (overloadedEmbed >= 1) d.overload += overloadedEmbed;
                            d.save().catch((err) => console.log(err));

                            addedData++;
                        }
                    });

                    if (addedData == 0) {
                        const newDeletedData = new DELETES({
                            guildID: message.guild.id,
                            overload: overloadedEmbed,
                            embed: deletedEmbed.toJSON()
                        });

                        newDeletedData.save().catch((err) => console.log(err));
                    }
                });
            } else {
                const newDeletedData = new DELETES({
                    guildID: message.guild.id,
                    overload: overloadedEmbed,
                    embed: deletedEmbed.toJSON()
                });

                newDeletedData.save().catch((err) => console.log(err));
            }
        });
    });
}