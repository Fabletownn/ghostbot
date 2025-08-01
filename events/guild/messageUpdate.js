const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const EDITS = require('../../models/edits.js');

module.exports = async (Discord, client, oldMessage, newMessage) => {
    // Do not log if either messages are partial or from bots
    if (oldMessage.partial || newMessage.partial) return;
    if (oldMessage.author.bot || newMessage.author.bot) return;

    const data = await LCONFIG.findOne({ guildID: newMessage.guild.id }); // Get existing log configuration data

    // Don't log if there is no data, no ignored channels or categories, or webhooks ready to send it
    if (!data) return;
    if (!(newMessage.guild.channels.cache.get(data.editchannel))) return;
    if (data.ignoredchannels == null) return;
    if (data.ignoredcategories == null) return;
    if (data.editwebhook == null) return;
    
    // In a forum post, the parent of the forum post is the forum channel; in these cases, check to make sure that
    // the parent of the forum channel - the actual category - isn't ignored before logging it
    // ===========================================================================
    // #bug-reports > Bug Report Post > parent: #bug-reports, not "QA Category" > parent of #bug-reports: "QA Category"
    const singleParent = newMessage?.channel?.parent?.id;
    const doubleParent = newMessage?.channel?.parent?.parent?.id;
    const categoryID = doubleParent ? doubleParent : singleParent;

    // Don't log if the channel or category of the channel is set to be ignored
    if (data.ignoredchannels.some((ignored_channel) => newMessage?.channel?.id === ignored_channel)) return;
    if (data.ignoredcategories.some((ignored_cat) => categoryID === ignored_cat)) return;

    const oldContent = oldMessage.content; // Pre-edited message's content
    const newContent = newMessage.content; // Edited message's content
    const editedOldContent = oldContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>');
    const editedNewContent = newContent.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_').replace(/</g, '\\<').replace(/>/g, '\\>');
    const editedID = newMessage.id; // Message ID
    const editedChannelID = newMessage.channel.id; // Channel that the edited message is in
    const editedAuthorID = newMessage.author.id; // User ID of the person who edited their message
    const editedNewTime = Math.round((Date.now()) / 1000); // Timestamp of the current day and time
    const editedAuthorTag = client.users.cache.get(editedAuthorID).tag; // Tag of the author who edited their message
    const editedLink = newMessage.url; // URL to the edited message

    // Do not log if both contents are the same (possible if edited with just a space)
    if (editedOldContent === editedNewContent) return;
    if (!editedNewContent) return;

    const embedCharacterLimit = 1000; // Character limit for each embed field
    let largerContent; // Prepare a variable for which content was larger

    // Set the variable to whichever content was larger
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

    // If there is only one field needed for the information, simply set it
    if (contentFieldsNeeded <= 1) {
        editedEmbed.setFields(
            { name: `Now`, value: editedNewContent.slice(0, 1020) || 'None' },
            { name: `Previous`, value: editedOldContent.slice(0, 1020) || 'None' },
            { name: `Date`, value: `<t:${editedNewTime}:F> (<t:${editedNewTime}:R>)` },
            { name: `ID`, value: `\`\`\`ini\nUser = ${editedAuthorID}\nMessage = ${editedID}\`\`\`` }
        )
        
    // Otherwise if the message is too large for a field, set the message as its description as it has a larger character limit    
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
        
        // Set the amount of overloaded embed fields needed
        overloadedEmbed = contentFieldsNeeded;
    }

    const eData = await EDITS.findOne({ guildID: newMessage.guild.id }); // Get existing edited log data

    // If there is an overloaded embed, add it to the message logs - can only be 1 as a message can only be so long
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

        await newEditedData.save().catch((err) => trailError(err));
        await newContinuedData.save().catch((err) => trailError(err));

        return;
    }

    // If there is edited data already existing
    if (eData) {
        const editdata = await EDITS.find({ guildID: newMessage.guild.id }); // Get existing edited log data

        let addedData = 0;

        // Iterate through every edited log that has yet to be sent out
        await editdata.forEach((d) => {
            // If there is more than 1 message log waiting to be sent out, push every embed into 1 message
            if (d.embed.length < 10 && d.overload < 1) {
                // So long as it hasn't hit the Discord limitation of 10 embeds, push it and any other overloaded embed into the next message to be sent out
                d.embed.push(editedEmbed.toJSON());
                if (overloadedEmbed >= 1) d.overload += overloadedEmbed;
                d.save().catch((err) => trailError(err));

                // Increment the amount of data to be sent out
                addedData++;
            }
        });

        // If there is only 1 message log waiting to be sent out, add it alone to edit data
        if (addedData === 0) {
            const newEditedData = new EDITS({
                guildID: newMessage.guild.id,
                overload: overloadedEmbed,
                embed: editedEmbed.toJSON()
            });

            newEditedData.save().catch((err) => trailError(err));
        }

    // If there is not yet other edit logs to be sent out, create data and add the embed        
    } else {
        const newEditedData = new EDITS({
            guildID: newMessage.guild.id,
            overload: overloadedEmbed,
            embed: editedEmbed.toJSON()
        });

        newEditedData.save().catch((err) => trailError(err));
    }
}