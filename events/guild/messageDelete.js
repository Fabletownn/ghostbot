const { EmbedBuilder } = require('discord.js');
const LCONFIG = require('../../models/logconfig.js');
const DELETES = require('../../models/deletes.js');

module.exports = async (Discord, client, message) => {
    // Do not log if the message is a partial, or the author is a bot
    if (message.partial) return;
    if (message.author.bot) return;

    const data = await LCONFIG.findOne({ guildID: message.guild.id }); // Get existing log configuration data
    if (!data) return;

    // Do not log if there is no log channel, no ignored channels or categories, or no log webhook
    if (!(message.guild.channels.cache.get(data.deletechannel))) return;
    if (data.ignoredchannels == null) return;
    if (data.ignoredcategories == null) return;
    if (data.deletewebhook == null) return;

    // Do not log if the channel or category the channel is in is being ignored
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

    // If the content is small enough to only need 1 embed, set the embed with its information
    if (contentFieldsNeeded <= 1) {
        deletedEmbed.setFields(
            { name: `Content`, value: deletedEditedContent || 'None' },
            { name: `Date`, value: `<t:${deletedTime}:F> (<t:${deletedTime}:R>)` },
            { name: `ID`, value: `\`\`\`ini\nUser = ${deletedAuthorID}\nMessage = ${deletedID}\`\`\`` }
        )
        
    // If the content is too large and needs more than 1 embed, for every embed it needs, add a "Continued" embed for each    
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

        // Set how many "overload" or "Continued" embeds there will be
        overloadedEmbed = contentFieldsNeeded;
    }

    const dData = DELETES.findOne({ guildID: message.guild.id }); // Find already existing delete data

    // If there is already existing delete logs waiting to be sent out
    if (dData) {
        const deletedata = await DELETES.find({ guildID: message.guild.id }); // Find existing delete data

        let addedData = 0;

        // Iterate through every deleted log that has yet to be sent out
        await deletedata.forEach((d) => {
            // If there is more than 1 message log waiting to be sent out, push every embed into 1 message
            if (d.embed.length < 10 && d.overload < 5) {
                // So long as it hasn't hit the Discord limitation of 10 embeds, push it and any other overloaded embed into the next message to be sent out
                d.embed.push(deletedEmbed.toJSON());
                if (overloadedEmbed >= 1) d.overload += overloadedEmbed;
                
                d.save().catch((err) => console.log(err));

                // Increment added delete data counter
                addedData++;
            }
        });

        // If there is only 1 message log waiting to be sent out, add it alone to delete data
        if (addedData === 0) {
            const newDeletedData = new DELETES({
                guildID: message.guild.id,
                overload: overloadedEmbed,
                embed: deletedEmbed.toJSON()
            });

            newDeletedData.save().catch((err) => console.log(err));
        }
        
    // If there is not yet other delete logs to be sent out, create data and add the embed    
    } else {
        const newDeletedData = new DELETES({
            guildID: message.guild.id,
            overload: overloadedEmbed,
            embed: deletedEmbed.toJSON()
        });

        newDeletedData.save().catch((err) => console.log(err));
    }
}