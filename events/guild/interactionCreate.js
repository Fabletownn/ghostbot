const { MessageFlags, ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const REPORTS = require('../../models/reports.js');
const COOLDOWNS = require('../../models/repcooldowns.js');
const { MET } = require('bing-translate-api');

const USER_REPORTS_CHANNEL = '805795819722244148';

module.exports = async (Discord, client, interaction) => {
    const cData = await CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing configuration data
    const lData = await LCONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data

    ///////////////////////// Buttons
    if (interaction.isButton()) {
        // For report handling, dismissing, deleting, these are the buttons unanimously used to stay
        const keepButtons = ['report-viewreps', 'report-hidedetails'];
        const updatedReportButtons = interaction.message.components.map((row) => {
            const newRow = new ActionRowBuilder();
            const updButtons = row.components.map((comp) => {
                return ButtonBuilder.from(comp).setDisabled(!keepButtons.includes(comp.customId));
            });
            
            newRow.addComponents(...updButtons);
            return newRow;
        });
        
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
                    pullmsg: ''
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
                await newLogData.save().catch((err) => trailError(err));
                await newConfigData.save().catch((err) => trailError(err));

                await interaction.update({ content: 'Data has been set back up for the server. Use the `/config` and `/log-config` commands to view and edit these values.', components: [] });
                break;
            }
            case "setup-cancel": // If data setup is rejected
                await interaction.update({ content: 'Data will not be reset for the server.', components: [] });
                break;
            case "report-handle":
            case "report-dismiss": {
                const reportData = await REPORTS.findOne({ reportID: interaction.message.id, handled: false });
                const oldEmbed = interaction.message.embeds[0];
                const isHandled = interaction.customId === "report-handle";
                const handleColor = isHandled ? '#38DD86' : '#757D8D';

                const newEmbed = EmbedBuilder.from(oldEmbed)
                    .setColor(handleColor)
                    .setFooter({ text: oldEmbed.footer.text.replace('Unhandled', isHandled ? 'Handled' : 'Dismissed') });

                // If there is data, mark it as handled to be filtered out for future reports
                if (reportData) {
                    reportData.handled = true;
                    reportData.save().catch((err) => trailError(err));
                }
                
                // Edit the embed to reflect whether it was handled or dismissed and respond to the user
                await interaction.message.edit({ embeds: [newEmbed], components: updatedReportButtons });
                await interaction.reply({ content: `Marked the report as ${isHandled ? 'handled' : 'dismissed'}.`, flags: MessageFlags.Ephemeral });
                break;
            }
            case "report-delete": {
                const reportData = await REPORTS.findOne({ reportID: interaction.message.id, handled: false });
                const oldEmbed = interaction.message.embeds[0];
                let deletionCount = 0;

                if (!reportData || !oldEmbed) return interaction.reply({ content: 'Failed to delete the reported messages as no data was found.', flags: MessageFlags.Ephemeral });
                
                const newEmbed = EmbedBuilder.from(oldEmbed)
                    .setColor('#38DD86')
                    .setFooter({ text: oldEmbed.footer.text.replace('Unhandled', 'Handled') });

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // For each report, get the message ID of it and delete them individually, if existing
                for (const [reportInfo, reporters] of reportData.reports) {
                    const reportChannelID = reportInfo.split('-')[0];
                    const reportMessageID = reportInfo.split('-')[1];

                    try {
                        const message = await interaction.guild.channels.cache.get(reportChannelID).messages.fetch(reportMessageID);
                        if (!message) continue;

                        await message.delete();
                        deletionCount++;
                    } catch (e) {}
                }

                // If there is data, mark it as handled to be filtered out for future reports
                if (reportData) {
                    reportData.handled = true;
                    reportData.save().catch((err) => trailError(err));
                }

                // Edit the embed to reflect it being handled and respond to the user
                await interaction.message.edit({ embeds: [newEmbed], components: updatedReportButtons });
                await interaction.followUp({ content: `Deleted **${deletionCount} message${deletionCount > 1 ? 's' : ''}** existing.` });
                break;
            }
            case "report-viewreps": {
                const reportData = await REPORTS.findOne({ reportID: interaction.message.id }); // Look for both handled and unhandled reports - no filter here
                if (!reportData) return interaction.reply({ content: 'Failed to view the reporters as no data was found.', flags: MessageFlags.Ephemeral });
                
                const isProfileReport = reportData.profile;
                const listMessage = isProfileReport ? '' : 'The following messages have been reported by users:';
                let reportedMessagesList = '';
                let reportCounter = 0;

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                for (const [reportInfo, reporters] of reportData.reports) {
                    const report = await interaction.guild.channels.cache.get(USER_REPORTS_CHANNEL).messages.fetch(reportData.reportID);
                    if (!report) return null;

                    const reportEmbed = report.embeds[0];
                    if (!reportEmbed) return null;

                    let reportField = reportEmbed.fields[reportCounter];
                    if (!isProfileReport) reportedMessagesList += `- ${reportField.value} **(${reportField.name})**\n`; // Don't add a field if it's a profile report

                    for (let i = 0; i < reporters.length; i++)
                        reportedMessagesList += `  - Reported by <@${reporters[i]}> (${reporters[i]})\n`;

                    reportCounter++;
                }

                await interaction.followUp({ content: `${listMessage}\n${reportedMessagesList}`, allowedMentions: { parse: [] } });
                break;
            }
            case "report-hidedetails": {
                const oldEmbed = interaction.message.embeds[0];
                const newEmbed = EmbedBuilder.from(oldEmbed)
                    .setAuthor({ name: oldEmbed.author.name, iconURL: 'https://i.imgur.com/8XDdiH1.png' })
                    .setThumbnail(null)
                    .setImage(null)
                    .setFooter({ text: `${oldEmbed.footer.text}  •  Hidden`})

                const updatedProfileButtons = interaction.message.components.map((row) => {
                    const profileRow = new ActionRowBuilder();
                    const keptButtons = row.components.filter((comp) => comp.customId !== interaction.customId); // Remove itself from the button list
                    profileRow.addComponents(...keptButtons);
                    return profileRow;
                });

                await interaction.message.edit({ embeds: [newEmbed], components: updatedProfileButtons });
                await interaction.reply({ content: 'Hid the profile picture and banner information for this profile report.', flags: MessageFlags.Ephemeral });
                break;
            }
            default:
                await interaction.reply({ content: 'There is no functionality for this button!', flags: MessageFlags.Ephemeral });
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

                await interaction.reply({ content: 'Your message has been ghostified.', flags: MessageFlags.Ephemeral });
                break;
            default:
                break;
        }
    }

    ///////////////////////// Message Context Interactions
    else if (interaction.isMessageContextMenuCommand()) {
        switch (interaction.commandName) {
            case "Report Message":
            case "Report Message (Emergency)":
                const isEmergency = interaction.commandName.toLowerCase().includes('emergency');
                const reportType = isEmergency ? 'emergency report' : 'report';
                const immuneRoles = ['749029859048816651', '756591038373691606', '759255791605383208'];
                const newReportMap = new Map(); // Create a new map ready for new data
                const reportedUser = interaction.targetMessage.author;
                const reportedMember = interaction.guild.members.cache.get(reportedUser?.id);
                const rData = await REPORTS.findOne({ userID: reportedUser?.id, profile: false, handled: false }); // Get existing unhandled reports data
                const cdData = await COOLDOWNS.findOne({ userID: interaction.user.id, expiresAt: { $gt: new Date() } }).sort({ expiresAt: -1 }); // Get existing report cooldown data, from non-expired & the most recent
                let reportedMessage = interaction.targetMessage; // Reported message
                let reportedMessageInfo = `${reportedMessage.channel.id}-${reportedMessage.id}`;

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                // Don't allow them to report the member if they are no longer in the server, are a bot, or a staff member
                if ((!reportedUser) && (!reportedMember)) return interaction.followUp({ content: 'An error occurred trying to report that user.' });
                if (reportedUser?.bot || immuneRoles?.some((role) => reportedMember?.roles.cache.has(role))) return interaction.followUp({ content: 'This user cannot be reported.' });

                // Don't allow them to report if they are either blacklisted from the system, or on cooldown
                if (cdData) {
                    if (cdData.blacklisted) return interaction.followUp({ content: 'You are blocked from using the user reporting system. Contact <@1043623513669513266> if you believe this is an error.' });

                    if (cdData.expiresAt > new Date().getTime()) {
                        return interaction.followUp({ content: `You are on cooldown and can report another message <t:${Math.round(cdData.expiresAt / 1000)}:R>.` });
                    }
                }

                // If there is no report data
                if (!rData) {
                    newReportMap.set(reportedMessageInfo, [interaction.user.id]); // Set the map key to message ID, value to an array of the reporter's ID

                    const reportID = await createReport(interaction, interaction.user.id, reportedMessageInfo, isEmergency);
                    if (reportID === null) return interaction.followUp({ content: `An error occurred trying to send that ${reportType}.` });

                    // Create a new set of data with the newly created report map
                    const newReportData = new REPORTS({
                        userID: reportedUser.id,
                        reports: newReportMap,
                        reportID: reportID,
                        emergency: isEmergency,
                        profile: false,
                        handled: false,
                        expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), // Automatically set to expire after 16 hours
                    });

                    // Save the data and confirm response
                    await newReportData.save();
                    await interaction.followUp({ content: `Thank you for your ${reportType}! This message will be handled by the staff team as soon as possible.` });
                    
                } else {
                    // If there already is report data for the User ID 
                    if (isEmergency && rData.emergency) return interaction.followUp({ content: 'This user\'s messages have already been marked as an emergency! It will be handled by the staff team as soon as possible.' });

                    const reportMap = rData.reports;
                    const reportArray = reportMap.get(reportedMessageInfo);

                    // If the message has already been reported before
                    if (reportArray) {
                        if (reportArray.length >= 10) return interaction.followUp({ content: 'This user\'s messages have already been reported and is now limited! It will be handled by the staff team as soon as possible.' });
                        if ((reportArray.includes(interaction.user.id)) && (!isEmergency)) return interaction.followUp({ content: `You already reported this message! The message will be handled by the staff team as soon as possible.` });

                        // Push the reporter's UID into it; if they are rereporting as an emergency, don't however
                        if (!reportArray.includes(interaction.user.id)) reportArray.push(interaction.user.id);

                        // Push the new reporter's ID into the map value
                        reportMap.set(reportedMessageInfo, reportArray);

                        // Set the reports emergency value if necessary, then mark data as modified so Mongo is aware of it
                        if (isEmergency) rData.emergency = isEmergency;
                        rData.markModified('reports');

                        // Save data, then edit the report
                        await rData.save();

                        const editedReport = await editReport(interaction, rData, reportedMessageInfo, isEmergency);
                        if (editedReport === null) return interaction.followUp({ content: `An error occurred trying to ${reportType} that message, please try again.` });

                        await interaction.followUp({ content: `Thank you for your ${reportType}! This message has already been reported, and your report has been added in addition.` });

                        // If the message hasn't been reported but the user has
                    } else {
                        reportMap.set(reportedMessageInfo, [interaction.user.id]); // Create a new map for the newly reported message ID
                        if (isEmergency) rData.emergency = isEmergency;

                        // Save data, then edit the report
                        await rData.save();

                        const editedReport = await editReport(interaction, rData, reportedMessageInfo, isEmergency);
                        if (editedReport === null) return interaction.followUp({ content: `An error occurred trying to ${reportType} that message, please try again.` });

                        await interaction.followUp({ content: `Thank you for your additional ${reportType}! This message will be handled by the staff team as soon as possible.` });
                    }
                }

                // Add a cooldown after reporting
                const newCooldownData = new COOLDOWNS({
                    guildID: interaction.guild.id,
                    userID: interaction.user.id,
                    blacklisted: false,
                    expiresAt: new Date(Date.now() + 10 * 1000) // Expire in 10 seconds automatically
                });

                await newCooldownData.save();
                break;
            case "Translate Message": // When a message is translated
                let translatedMessage = interaction.targetMessage.content; // Content of the message

                await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Defer reply, as this will probably take a while

                // If there is an embed in the message, translate the value of its first field
                if (interaction.targetMessage.embeds.length > 0)  {
                    if (interaction.targetMessage.embeds[0].fields[0]) {
                        const fieldValue = interaction.targetMessage.embeds[0].fields[0].value;

                        if (fieldValue) translatedMessage = fieldValue;
                    } else if (interaction.targetMessage.embeds[0].description) {
                        const descValue = interaction.targetMessage.embeds[0].description;
                        
                        if (descValue) translatedMessage = descValue;
                    }
                }

                // Ensure the message isn't empty
                if (!translatedMessage || translatedMessage === "") {
                    await interaction.followUp({ content: 'The selected message has no content to translate.', flags: MessageFlags.Ephemeral });
                    return;
                }

                // Send a request to translate the message to English
                MET.translate(translatedMessage, null, 'en').then(async (res) => {
                    const detectedLanguage = res[0].detectedLanguage.language; // The language that the original message is in
                    const translatedContent = res[0].translations[0].text; // The translated content of the message selected

                    // Ensure not to translate any already-English messages
                    if (detectedLanguage === 'en') {
                        await interaction.followUp({ content: 'The selected message is already in English, and translations are only provided for messages in other languages.',  flags: MessageFlags.Ephemeral });
                        return;
                    }

                    // Send the translated content
                    await interaction.followUp({ content: `**Detected Language**: \`${detectedLanguage.toUpperCase()}\`\n**Translated Content**: \`${translatedContent}\``, flags: MessageFlags.Ephemeral });
                }).catch((err) => {
                    trailError(err);
                    return interaction.followUp({ content: `Failed to translate that message! If this continues, please forward this error: \`${err}\``, flags: MessageFlags.Ephemeral });
                });

                break;
            default:
                break;
        }
    }

    ///////////////////////// User Context Interactions
    else if (interaction.isUserContextMenuCommand()) {
        switch (interaction.commandName) {
            case "Report Profile":
                const reportedUser = interaction.targetUser;
                const reportedMember = interaction.guild.members.cache.get(reportedUser?.id);
                const immuneRoles = ['749029859048816651', '756591038373691606', '759255791605383208'];
                const newReportMap = new Map([[reportedUser.id, [interaction.user.id]]]); // Create a map for the sake of being able to view who reported it
                const rData = await REPORTS.findOne({ userID: reportedUser?.id, profile: true, handled: false }); // Fetch unhandled profile data for that user ID

                if (reportedUser?.bot || immuneRoles?.some((role) => reportedMember?.roles.cache.has(role))) return interaction.reply({ content: 'This user cannot be reported.', flags: MessageFlags.Ephemeral });
                
                if (rData)
                    return interaction.reply({ content: 'Thank you for your profile report! This profile was already reported and will be handled by the staff team as soon as possible.', flags: MessageFlags.Ephemeral });
                
                const reportID = await createProfileReport(interaction);
                if (!reportID) return interaction.reply({ content: 'Something went wrong trying to report that profile, please try again.', flags: MessageFlags.Ephemeral });
                
                const newReportData = new REPORTS({
                    userID: reportedUser.id,
                    reports: newReportMap,
                    reportID: reportID,
                    emergency: false,
                    profile: true,
                    handled: false,
                    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), // Automatically expire after 16 hours
                });

                // Save the data and confirm response
                await newReportData.save();
                await interaction.reply({ content: 'Thank you for your profile report! This will be handled by the staff team as soon as possible.', flags: MessageFlags.Ephemeral });
                break;
        }
    }
};

async function createReport(interaction, reporterid, reportedinfo, isemergency) {
    const reportChannelID = reportedinfo.split('-')[0];
    const reportMessageID = reportedinfo.split('-')[1];
    const reportMessageURL = `https://discord.com/channels/${interaction.guild.id}/${reportChannelID}/${reportMessageID}`;

    const message = await interaction.guild.channels.cache.get(reportChannelID).messages.fetch(reportMessageID);
    if (!message) return null;

    const reportedUser = message.author;
    const reportedContent = await sanitizeMessage(message.content, 70);
    const reportedUserAvatar = reportedUser.displayAvatarURL({ dynamic: true, size: 512 })

    const reportEmbed = new EmbedBuilder()
        .setAuthor({ name: `@${reportedUser.username}'s messages have been reported`, iconURL: reportedUserAvatar })
        .addFields([
            { name: `1 report ${isemergency ? '(Emergency)' : ''}`, value: `[${reportedContent}](${reportMessageURL})` }
        ])
        .setFooter({ text: `Unhandled  •  User ID: ${reportedUser.id}` })
        .setColor('#FF756E')

    const reportButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-handle')
                .setLabel('Handled')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-delete')
                .setLabel('Delete')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️'),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-dismiss')
                .setLabel('Dismiss')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('509606903903551490'),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-viewreps')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('1332851977507307550'),
        );

    const reportMessage = await interaction.guild.channels.cache.get(USER_REPORTS_CHANNEL).send({
        content: isemergency ? '<@&759255791605383208> <@&756591038373691606>: This report has been marked as an emergency!' : '',
        embeds: [reportEmbed],
        components: [reportButtons],
        allowedMentions: { parse: ['roles'] }
    });

    return reportMessage.id;
}

async function createProfileReport(interaction) {
    const reportedUser = await interaction.client.users.fetch(interaction?.targetUser?.id, { force: true });
    const reportedAvatar = reportedUser.displayAvatarURL({ dynamic: true, size: 1024 });
    const reportedBanner = reportedUser.bannerURL({ dynamic: true, size: 1024 });
    const reportEmbed = new EmbedBuilder()
        .setAuthor({ name: `@${reportedUser.username}'s profile has been reported`, iconURL: reportedAvatar })
        .addFields([
            { name: 'Display Name', value: reportedUser.displayName, inline: true },
            { name: 'Username', value: `@${reportedUser.username}`, inline: true },
            { name: 'Mention', value: `<@${reportedUser.id}>`, inline: true },
            { name: 'Other', value: '⚠️ **Pronouns** and **About Me** aren\'t available for bots - check their profile in full if nothing shown.\n👁️ Hide **NSFW**/**NSFL** content with the eye button.', inline: false }
        ])
        .setFooter({ text: `Unhandled  •  User ID: ${reportedUser.id}` })
        .setThumbnail(reportedAvatar)
        .setImage(reportedBanner)
        .setColor('#FF756E')
    const reportButtons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-handle')
                .setLabel('Handled')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅'),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-dismiss')
                .setLabel('Dismiss')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('509606903903551490'),
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-hidedetails')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('1396669210834505920')
        )
        .addComponents(
            new ButtonBuilder()
                .setCustomId('report-viewreps')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('1332851977507307550'),
        );
    
    const reportMessage = await interaction.guild.channels.cache.get(USER_REPORTS_CHANNEL).send({ embeds: [reportEmbed], components: [reportButtons] });
    return reportMessage.id;
}

async function editReport(interaction, data, reportedinfo, isemergency) {
    const reportData = data.reports;
    const reportChannelID = reportedinfo.split('-')[0];
    const reportMessageID = reportedinfo.split('-')[1];
    const reporters = reportData.get(reportedinfo);
    const reportMessageURL = `https://discord.com/channels/${interaction.guild.id}/${reportChannelID}/${reportMessageID}`;

    const message = await interaction.guild.channels.cache.get(reportChannelID).messages.fetch(reportMessageID).catch(() => null);
    if (!message) return null;

    // If the report message can't be found (accidentally deleted or the like), delete the data and have them try again
    const report = await interaction.guild.channels.cache.get(USER_REPORTS_CHANNEL).messages.fetch(data.reportID).catch(() => null);
    if (!report) {
        await data.deleteOne();
        return null;
    }

    const reportEmbed = report.embeds[0];
    if (!reportEmbed) return null;

    const reportedContent = await sanitizeMessage(message.content, 70);
    let foundPreviousReport = false;

    for (let i = 0; i < reportEmbed.fields.length; i++) {
        let reportField = reportEmbed.fields[i];

        if (reportField.value.includes(reportMessageURL)) {
            reportField.name = `${reporters.length} report${reporters.length > 1 ? 's' : ''} ${reportField.name.includes('emergency') || isemergency ? '(Emergency)' : ''}`;

            reportEmbed.fields[i] = reportField;

            foundPreviousReport = true;
            break;
        }
    }

    if (!foundPreviousReport) {
        reportEmbed.fields.push(
            { name: `1 report ${isemergency ? '(Emergency)' : ''}`, value: `[${reportedContent}](${reportMessageURL})` }
        );
    }

    await report.edit({ embeds: [reportEmbed] });
    if (isemergency) await report.reply({ content: '<@&759255791605383208> <@&756591038373691606>: This report has been marked as an emergency!', allowedMentions: { parse: ['roles'] } });
}

async function sanitizeMessage(content, limit = 0) {
    if (limit === 0) limit = content.length; // If there is no set limit, make it however long the message is
    if (!content) return '(No Content)';

    return content.replace(/`/g, '\\`').replace(/\*/g, '\\*').replace(/-/g, '\\-').replace(/_/g, '\\_')
        .replace(/</g, '\\<').replace(/>/g, '\\>').replace(/\//g, '\\/')
        .replace(/\n/g, '...')
        .slice(0, limit);
}
