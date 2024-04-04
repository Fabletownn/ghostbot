const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const EDITS = require('../../models/edits.js');

module.exports = async (Discord, client, oldMessage, newMessage) => {
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author.bot || newMessage.author.bot) return;

    LCONFIG.findOne({
        guildID: newMessage.guild.id
    }, (err, data) => {
        if (err) return console.log(err);
        if (!data) return;
        if (!(newMessage.guild.channels.cache.get(data.editchannel))) return;
        if (data.ignoredchannels == null) return;
        if (data.ignoredcategories == null) return;
        if (data.editwebhook == null) return;

        if (data.ignoredchannels.some((ignored_channel) => newMessage.channel.id === ignored_channel)) return;
        if (data.ignoredcategories.some((ignored_cat) => newMessage.channel.parent.id === ignored_cat)) return;

        const editedOldContent = oldMessage.content;
        const editedNewContent = newMessage.content;
        const editedEditedOldContent = editedOldContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>');
        const editedEditedNewContent = editedNewContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>');
        const editedID = newMessage.id;
        const editedChannelID = newMessage.channel.id;
        const editedAuthorID = newMessage.author.id;
        const editedNewTime = Math.round((Date.now()) / 1000);
        const editedAuthorTag = client.users.cache.get(editedAuthorID).discriminator;
        const editedLink = newMessage.url;

        const embedCharacterLimit = 1000;
        const contentFieldsNeeded = Math.ceil(editedEditedNewContent.length / embedCharacterLimit);
        let overloadedEmbed = 0;

        if (editedEditedOldContent == editedEditedNewContent) return;

        const editedEmbed = new EmbedBuilder()
            .setAuthor({ name: `${client.users.cache.get(editedAuthorID).username}#${editedAuthorTag}`, iconURL: newMessage.guild.members.cache.get(editedAuthorID).displayAvatarURL({ dynamic: true }) })
            .setDescription(`Message updated in <#${editedChannelID}> ([jump to message](${editedLink}))`)
            .setTimestamp()
            .setColor('#E62AED');

        const editedEmbedContinued = new EmbedBuilder()
            .setTimestamp()
            .setColor('#E62AED');

        if (contentFieldsNeeded <= 1) {
            editedEmbed.setFields(
                { name: `Now`, value: editedEditedNewContent },
                { name: `Previous`, value: editedEditedOldContent },
                { name: `Date`, value: `<t:${editedNewTime}:F> (<t:${editedNewTime}:R>)` },
                { name: `ID`, value: `\`\`\`ini\nUser = ${editedAuthorID}\nMessage = ${editedID}\`\`\`` }
            )
        } else {
            editedEmbed.setDescription(`Message updated in <#${editedChannelID}> ([jump to message](${editedLink}))\n\n**Now**:\n${(editedEditedNewContent.length > 3800 ? `${editedEditedNewContent.slice(0, 3700)}...` : editedEditedNewContent)}`);
            editedEmbedContinued.setDescription(`**Previous**:\n${(editedEditedOldContent.length > 3800 ? `${editedEditedOldContent.slice(0, 3700)}...` : editedEditedNewContent)}`);

            editedEmbed.setFields(
                { name: `Date`, value: `<t:${editedNewTime}:F> (<t:${editedNewTime}:R>)` },
                { name: `ID`, value: `\`\`\`ini\nUser = ${editedAuthorID}\nMessage = ${editedID}\`\`\`` }
            )

            editedEmbedContinued.setFields(
                { name: `Date`, value: `<t:${editedNewTime}:F> (<t:${editedNewTime}:R>)` },
                { name: `ID`, value: `\`\`\`ini\nUser = ${editedAuthorID}\nMessage = ${editedID}\`\`\`` }
            )

            overloadedEmbed = contentFieldsNeeded;
        }

        EDITS.findOne({
            guildID: newMessage.guild.id
        }, async (err, data) => {
            if (err) return console.log(err);

            if (overloadedEmbed >= 1) {
                const newEditedData = new EDITS({
                    guildID: newMessage.guild.id,
                    overload: overloadedEmbed,
                    embed: editedEmbed.toJSON()
                });

                const newContinuedData = new EDITS({
                    guildID: newMessage.guild.id,
                    overload: overloadedEmbed,
                    embed: editedEmbedContinued.toJSON()
                });

                await newEditedData.save().catch((err) => console.log(err));
                await newContinuedData.save().catch((err) => console.log(err));

                return;
            }

            if (data) {
                EDITS.find({ guildID: newMessage.guild.id }).then(async (editdata) => {
                    var addedData = 0;

                    await editdata.forEach((d) => {
                        if (d.embed.length < 10 && d.overload < 1) {
                            d.embed.push(editedEmbed.toJSON());
                            if (overloadedEmbed >= 1) d.overload += overloadedEmbed;
                            d.save().catch((err) => console.log(err));

                            addedData++;
                        }
                    });

                    if (addedData == 0) {
                        const newEditedData = new EDITS({
                            guildID: newMessage.guild.id,
                            overload: overloadedEmbed,
                            embed: editedEmbed.toJSON()
                        });

                        newEditedData.save().catch((err) => console.log(err));
                    }
                });
            } else {
                const newEditedData = new EDITS({
                    guildID: newMessage.guild.id,
                    overload: overloadedEmbed,
                    embed: editedEmbed.toJSON()
                });

                newEditedData.save().catch((err) => console.log(err));
            }
        });
    });
}