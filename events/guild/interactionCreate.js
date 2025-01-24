const { ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const { MET } = require('bing-translate-api');

module.exports = async (Discord, client, interaction) => {
    const cData = await CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing configuration data
    const lData = await LCONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data

    ///////////////////////// Buttons
    if (interaction.isButton()) {
        switch (interaction.customId) {
            case "setup-reset": { // When data setup is confirmed to be reset to default
                if (cData) await CONFIG.findOneAndDelete({ guildID: interaction.guild.id }); // Delete configuration data
                if (lData) await LCONFIG.findOneAndDelete({ guildID: interaction.guild.id }); // Delete log configuration data

                // Create new configuration data
                const newConfigData = new CONFIG({
                    guildID: interaction.guild.id,
                    autopublish: false,
                    threadcreate: false,
                    tagapply: false,
                    pbvcid: '',
                    pbvclimit: 4,
                    pullcategoryid: '',
                    pullroleid: '',
                    pulllogid: '',
                    pullmsg: '',
                    mmcategoryid: '',
                    ammcategoryid: ''
                });

                // Create new log configuration data
                const newLogData = new LCONFIG({
                    guildID: interaction.guild.id,
                    deletechannel: '',
                    editchannel: '',
                    ignoredchannels: [],
                    ignoredcategories: [],
                    deletewebhook: '',
                    editwebhook: '',
                    usernamewebhook: '',
                    vcwebhook: '',
                    chanupwebhook: '',
                    usernamechannel: '',
                    vcchannel: '',
                    chanupchannel: ''
                });

                // Save data and confirm followup
                await newLogData.save().catch((err) => console.log(err));
                await newConfigData.save().catch((err) => console.log(err));

                await interaction.update({ content: 'Data has been set back up for the server. Use the `/config` and `/log-config` commands to view and edit these values.', components: [] });
                break;
            }
            case "setup-cancel": // If data setup is rejected
                await interaction.update({ content: 'Data will not be reset for the server.', components: [] });
                break;
            case "flag-delete": // When a flagged message is deleted with the button
                let flagEmbed = interaction.message.embeds[0];                           // The flag embed itself 
                const flagFields = flagEmbed.fields;                                     // Fetch the flag's fields
                const flagFooter = flagEmbed.footer.text;                                // Get the flag's footer text
                const flagMessageID = flagFooter.split(' ')[2];                          // Get the message ID (third word)
                const flagChannelID = flagFields[1].value.replace(/[<#>]/g, '');         // Purify the ID
                const flagChannel = interaction.guild.channels.cache.get(flagChannelID); // Fetch the channel it's in

                if (!flagChannel) return interaction.reply({ content: 'Unable to delete the message, the channel or post this message was sent in is no longer available.' });

                // Fetch the message, delete it, and set the embed to be handled
                await flagChannel.messages.fetch(flagMessageID).then(async (flagmsg) => {
                    const handledEmbed = EmbedBuilder.from(flagEmbed).setColor('#38DD86').setAuthor({ name: 'Flag Handled', iconURL: 'https://i.imgur.com/7WEoXUM.png' });

                    await flagmsg.delete();
                    await interaction.message.edit({ embeds: [handledEmbed], components: [] });
                    await interaction.reply({ content: 'Deleted the message.', ephemeral: true });
                }).catch(() => {
                    return interaction.reply({ content: 'Unable to delete the message, does it exist?', ephemeral: true })
                });

                break;
            case "flag-handle": // When a flagged message is set to handled
                let flagEmbed2 = interaction.message.embeds[0]; // The flag embed itself
                const handledEmbed = EmbedBuilder.from(flagEmbed2).setColor('#38DD86').setAuthor({ name: 'Flag Handled', iconURL: 'https://i.imgur.com/7WEoXUM.png' }); // Edited handled embed

                await interaction.message.edit({ embeds: [handledEmbed], components: [] });
                await interaction.reply({ content: 'Marked the flag as handled.', ephemeral: true });
                break;
            default:
                break;
        }
    }

    ///////////////////////// Modals
    else if (interaction.isModalSubmit()) {
        switch (interaction.customId) {
            case "say-modal":
                if (!lData) return interaction.reply({ content: 'Failed to mimic your message. There is no data for the server!' });

                const sayMessage = interaction.fields.getTextInputValue('say-msg'); // Get mimic value
                const sayEmbed = new EmbedBuilder()
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 512 }) })
                    .setDescription(`${interaction.user} ghostified a message in ${interaction.channel}`)
                    .addFields([
                        { name: 'Content', value: sayMessage.slice(0, 1020) }
                    ])
                    .setTimestamp()

                // Send the message, log that it has been sent, and reply with confirmation
                await interaction.channel.send({ content: sayMessage });
                await interaction.guild.channels.cache.get(lData.chanupchannel).send({ embeds: [sayEmbed] });

                await interaction.reply({ content: 'Your message has been ghostified.', ephemeral: true });
                break;
            default:
                break;
        }
    }

    ///////////////////////// Message Context Interactions
    else if (interaction.isMessageContextMenuCommand()) {
        switch (interaction.commandName) {
            case "Flag Message": // When a message is flagged
                const flaggedMessage = interaction.targetMessage; // The message itself
                const msgAuthor = flaggedMessage.author; // User who sent the message
                const msgContent0 = flaggedMessage.content; // Contents of the message
                const msgContent1 = msgContent0.length > 800 ? `${msgContent0.slice(0, 800)}...` : msgContent0; // Cut off content in case it's too lengthy
                const msgContent = msgContent1.replace(/[`]/g, ''); // Replace any conflicting characters
                const msgCreated = Math.round(flaggedMessage.createdAt / 1000); // When the message was created
                const flagCreated = Math.round(Date.now() / 1000); // When the flag was created (date just now)
                const msgAttachs = Array.from(flaggedMessage.attachments.values()); // The array of attachments in the message
                const msgAttachment = (msgAttachs.length > 0 ? msgAttachs[0].url : null); // Attachment URL if there is one

                const flagEmbed = new EmbedBuilder()
                    .setAuthor({ name: `Unhandled Flag`, iconURL: 'https://i.imgur.com/rSqII8d.png' })
                    .addFields([
                        { name: 'User', value: `${msgAuthor}\n(${msgAuthor.id})`, inline: true },
                        { name: 'Channel', value: `<#${interaction.channel.id}>`, inline: true },
                        { name: 'Message', value: `**[Jump](${flaggedMessage.url})**`, inline: true },
                        { name: 'Content', value: `\`\`\`${msgContent || 'No Content (File/Sticker)'}\`\`\``, inline: false },
                        { name: 'Posted', value: `<t:${msgCreated}:R>`, inline: true },
                        { name: 'Flagged', value: `<t:${flagCreated}:R>`, inline: true }
                    ])
                    .setFooter({ text: `Message ID: ${flaggedMessage.id}  •  Flagged by ${interaction.user.username}` })
                    .setThumbnail(msgAuthor.displayAvatarURL({ dynamic: true, size: 1024 }))
                    .setImage(msgAttachment)
                    .setColor('#FF756E')

                const flagRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('flag-handle')
                            .setLabel('Mark Handled')
                            .setStyle(ButtonStyle.Success),
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('flag-delete')
                            .setLabel('Delete Message')
                            .setStyle(ButtonStyle.Danger),
                    );

                // Send the flagged message to the reports channel, and confirm with a URL
                await interaction.guild.channels.cache.get('805795819722244148').send({ content: null, embeds: [flagEmbed], components: [flagRow], allowedMentions: { parse: ['roles'] } }).then((flag) => {
                    interaction.reply({ content: `Flagged the message: [jump to your report here](<${flag.url}>)!`, ephemeral: true });
                });
                break;
            case "Translate Message": // When a message is translated
                let translatedMessage = interaction.targetMessage.content; // Content of the message

                await interaction.deferReply({ ephemeral: true }); // Defer reply, as this will probably take a while

                // If there is an embed in the message, translate the value of its first field
                if (interaction.targetMessage.embeds.length > 0)  {
                    if (interaction.targetMessage.embeds[0].fields[0]) {
                        const fieldValue = interaction.targetMessage.embeds[0].fields[0].value;

                        if (fieldValue) translatedMessage = fieldValue;
                    }
                }

                // Ensure the message isn't empty
                if (!translatedMessage || translatedMessage === "") {
                    await interaction.followUp({ content: 'The selected message has no content to translate.', ephemeral: true });
                    return;
                }

                // Send a request to translate the message to English
                MET.translate(translatedMessage, null, 'en').then(async (res) => {
                    const detectedLanguage = res[0].detectedLanguage.language; // The language that the original message is in
                    const translatedContent = res[0].translations[0].text; // The translated content of the message selected

                    // Ensure not to translate any already-English messages
                    if (detectedLanguage === 'en') {
                        await interaction.followUp({ content: 'The selected message is already in English, and translations are only provided for messages in other languages.',  ephemeral: true });
                        return;
                    }

                    // Send the translated content
                    await interaction.followUp({ content: `**Detected Language**: \`${detectedLanguage.toUpperCase()}\`\n**Translated Content**: \`${translatedContent}\``, ephemeral: true });
                }).catch((err) => {
                    console.log(err);
                    return interaction.followUp({ content: `Failed to translate that message! If this continues, please forward this error: \`${err}\``, ephemeral: true });
                });

                break;
            default:
                break;
        }
    }
};