const { ButtonStyle, ActionRowBuilder, ButtonBuilder, EmbedBuilder } = require('discord.js');
const CONFIG = require('../../models/config.js');
const LCONFIG = require('../../models/logconfig.js');
const REPORTS = require('../../models/reports.js');
const COOLDOWNS = require('../../models/repcooldowns.js');
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
                await newLogData.save().catch((err) => console.log(err));
                await newConfigData.save().catch((err) => console.log(err));

                await interaction.update({ content: 'Data has been set back up for the server. Use the `/config` and `/log-config` commands to view and edit these values.', components: [] });
                break;
            }
            case "setup-cancel": // If data setup is rejected
                await interaction.update({ content: 'Data will not be reset for the server.', components: [] });
                break;
            case "report-handle":
            case "report-dismiss": {
                const reportData = await REPORTS.findOne({ reportID: interaction.message.id });
                const oldEmbed = interaction.message.embeds[0];
                const isHandled = interaction.customId === "report-handle";
                const handleColor = isHandled ? '#38DD86' : '#757D8D';

                const newEmbed = EmbedBuilder.from(oldEmbed)
                    .setColor(handleColor)
                    .setFooter({ text: oldEmbed.footer.text.replace('Unhandled', isHandled ? 'Handled' : 'Dismissed') });

                // If there is no data (by the off chance it got deleted), still mark the report as handled/dismised, otherwise delete it
                if (reportData) await REPORTS.findOneAndDelete({ reportID: interaction.message.id });
                
                await interaction.message.edit({ embeds: [newEmbed], components: [] });
                await interaction.reply({ content: `Marked the report as ${isHandled ? 'handled' : 'dismissed'}.`, ephemeral: true });
                break;
            }
            case "report-delete": {
                const reportData = await REPORTS.findOne({ reportID: interaction.message.id });
                const oldEmbed = interaction.message.embeds[0];
                let deleteCount = 0;

                if (!reportData || !oldEmbed) return interaction.reply({ content: 'Failed to delete the reported messages as no data was found.', ephemeral: true });

                const newEmbed = EmbedBuilder.from(oldEmbed)
                    .setColor('#38DD86')
                    .setFooter({ text: oldEmbed.footer.text.replace('Unhandled', 'Handled') });

                await interaction.deferReply({ ephemeral: true });

                for (const [reportInfo, reporters] of reportData.reports) {
                    const reportChannelID = reportInfo.split('-')[0];
                    const reportMessageID = reportInfo.split('-')[1];

                    try {
                        const message = await interaction.guild.channels.cache.get(reportChannelID).messages.fetch(reportMessageID);
                        if (!message) continue;

                        await message.delete();
                        deleteCount++;
                    } catch (e) {}
                }

                await REPORTS.findOneAndDelete({ reportID: interaction.message.id });
                await interaction.message.edit({ embeds: [newEmbed], components: [] });
                await interaction.followUp({ content: `Deleted **${deleteCount} message${deleteCount > 1 ? 's' : ''}** existing.` });
                break;
            }
            case "report-viewreps":
                const reportData = await REPORTS.findOne({ reportID: interaction.message.id });
                let reportedMessagesList = "";
                let reportCounter = 0;

                if (!reportData) return interaction.reply({ content: 'Failed to view the reporters as no data was found.', ephemeral: true });

                await interaction.deferReply({ ephemeral: true });

                for (const [reportInfo, reporters] of reportData.reports) {
                    const report = await interaction.guild.channels.cache.get('805795819722244148').messages.fetch(reportData.reportID);
                    if (!report) return null;

                    const reportEmbed = report.embeds[0];
                    if (!reportEmbed) return null;

                    let reportField = reportEmbed.fields[reportCounter];

                    reportedMessagesList += `- ${reportField.value} **(${reportField.name})**\n`;

                    for (let i = 0; i < reporters.length; i++) {
                        reportedMessagesList += `  - Reported by <@${reporters[i]}> (${reporters[i]})\n`;
                    }

                    reportCounter++;
                }

                await interaction.followUp({ content: `The following messages have been reported by users:\n${reportedMessagesList}`, allowedMentions: { parse: [] } });
                break;
            default:
                await interaction.reply({ content: 'There is no functionality for this button!', ephemeral: true });
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
            case "Report Message":
            case "Report Message (Emergency)":
                const isEmergency = interaction.commandName.toLowerCase().includes('emergency');
                const reportType = isEmergency ? 'emergency report' : 'report';
                const immuneRoles = ['749029859048816651', '756591038373691606', '759255791605383208'];
                const newReportMap = new Map(); // Create a new map ready for new data
                const reportedUser = interaction.targetMessage.author;
                const reportedMember = interaction.guild.members.cache.get(reportedUser?.id);
                const rData = await REPORTS.findOne({ userID: reportedUser?.id }); // Get existing reports data
                const cdData = await COOLDOWNS.findOne({ userID: interaction.user.id }); // Get existing report cooldown data
                let reportedMessage = interaction.targetMessage; // Reported message
                let reportedMessageInfo = `${reportedMessage.channel.id}-${reportedMessage.id}`;

                await interaction.deferReply({ ephemeral: true });

                // Don't allow them to report the member if they are no longer in the server, are a bot, or a staff member
                if ((!reportedUser) && (!reportedMember)) return interaction.followUp({ content: 'An error occurred trying to report that user.' });
                if (reportedUser.bot || immuneRoles.some((role) => reportedMember.roles.cache.has(role))) return interaction.followUp({ content: 'This user cannot be reported.' });

                // Don't allow them to report if they are either blacklisted from the system, or on cooldown
                if (cdData) {
                    if (cdData.blacklisted) return interaction.followUp({ content: 'You are blocked from using the user reporting system. Contact <@1043623513669513266> if you believe this is an error.' });
                    if (cdData.expires > Date.now()) {
                        const cooldownRemaining = Math.round(cdData.expires / 1000);
                        return interaction.followUp({ content: `You are on cooldown and can report another message <t:${cooldownRemaining}:R>.` });
                    } else {
                        await COOLDOWNS.findOneAndDelete({ userID: interaction.user.id });
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
                        emergency: isEmergency
                    });

                    // Save the data and confirm response
                    await newReportData.save();
                    await interaction.followUp({ content: `Thank you for your ${reportType}! This message will be handled by the staff team as soon as possible.` });

                    // If there already is report data for the User ID 
                } else {
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
                    expires: Date.now() + 10000 // 10 second cooldown
                });

                await newCooldownData.save();
                break;
            case "Translate Message": // When a message is translated
                let translatedMessage = interaction.targetMessage.content; // Content of the message

                await interaction.deferReply({ ephemeral: true }); // Defer reply, as this will probably take a while

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

    const reportMessage = await interaction.guild.channels.cache.get('805795819722244148').send({
        content: isemergency ? '<@&759255791605383208> <@&756591038373691606>: This report has been marked as an emergency!' : '',
        embeds: [reportEmbed],
        components: [reportButtons],
        allowedMentions: { parse: ['roles'] }
    });

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
    const report = await interaction.guild.channels.cache.get('805795819722244148').messages.fetch(data.reportID).catch(() => null);
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
