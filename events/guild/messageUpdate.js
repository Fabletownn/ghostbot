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

        const oldContent = oldMessage.content;
        const newContent = newMessage.content;
        const editedOldContent = oldContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>');
        const editedNewContent = newContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>');
        const editedID = newMessage.id;
        const editedChannelID = newMessage.channel.id;
        const editedAuthorID = newMessage.author.id;
        const editedNewTime = Math.round((Date.now()) / 1000);
        const editedAuthorTag = client.users.cache.get(editedAuthorID).tag;
        const editedLink = newMessage.url;

        if (editedOldContent === editedNewContent) return;
        if (!editedNewContent) return;

        const embedCharacterLimit = 1000;
        let largerContent = editedNewContent;

        if (editedNewContent.length > editedOldContent.length) {
            largerContent = editedNewContent;
        } else {
            largerContent = editedOldContent;
        }

        const contentFieldsNeeded = Math.ceil(largerContent.length / embedCharacterLimit);
        let overloadedEmbed = 0;

        const editedEmbed = new EmbedBuilder()
            .setAuthor({ name: editedAuthorTag, iconURL: client.users.cache.get(editedAuthorID).displayAvatarURL({ dynamic: true }) || 'https://i.imgur.com/NZzCLrw.png' })
            .setDescription(`Message updated in <#${editedChannelID}> ([jump to message](${editedLink}))`)
            .setTimestamp()
            .setColor('#E62AED');

        const editedEmbedContinued = new EmbedBuilder()
            .setTimestamp()
            .setColor('#E62AED');

        if (contentFieldsNeeded <= 1) {
            editedEmbed.setFields(
                { name: `Now`, value: editedNewContent.slice(0, 1020) || 'None' },
                { name: `Previous`, value: editedOldContent.slice(0, 1020) || 'None' },
                { name: `Date`, value: `<t:${editedNewTime}:F> (<t:${editedNewTime}:R>)` },
                { name: `ID`, value: `\`\`\`ini\nUser = ${editedAuthorID}\nMessage = ${editedID}\`\`\`` }
            )
        } else {
            editedEmbed.setDescription(`Message updated in <#${editedChannelID}> ([jump to message](${editedLink}))\n\n**Now**:\n${(editedNewContent.length > 3800 ? `${editedNewContent.slice(0, 3700)}...` : editedNewContent)}`);
            editedEmbedContinued.setDescription(`**Previous**:\n${(editedOldContent.length > 3800 ? `${editedOldContent.slice(0, 3700)}...` : editedOldContent)}`);

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

                    if (addedData === 0) {
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