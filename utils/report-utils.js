const { MessageFlags, ButtonBuilder, ButtonStyle, TextDisplayBuilder, SectionBuilder, ContainerBuilder, SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder } = require('discord.js');
const { getChannel, getMessage, getUser } = require('./fetch-utils.js');
const { escapeAllMarkdown, pluralize, truncate } = require('./message-utils.js');
const { getIndexOfSectionIncluding, getReportButtons } = require('./component-utils.js');
const SV = require('../models/server-values.json');

async function createReport(interaction, reportedinfo, isemergency) {
    const reportChannelID = reportedinfo.split('-')[0];
    const reportMessageID = reportedinfo.split('-')[1];
    const reportMessageURL = `https://discord.com/channels/${interaction.guild.id}/${reportChannelID}/${reportMessageID}`;

    const message = await getMessage(interaction.guild, reportChannelID, reportMessageID);
    if (!message) return null;

    const reportedUser = message.author;
    const reportedContent = escapeAllMarkdown(truncate(message.content, 70), true);
    const pingIfEmergency = isemergency ? `as an emergency\n<@&${SV.ROLES.TRIAL_MODERATOR}> <@&${SV.ROLES.MODERATOR}>` : '';
    const reportEmoji = isemergency ? '⚠️' : '📨';

    const headerText = new TextDisplayBuilder()
        .setContent(`### ${reportEmoji}  ${reportedUser.username}'s messages have been reported ${pingIfEmergency}`)

    const infoText = new TextDisplayBuilder()
        .setContent(`-# - ID: ${reportedUser.id}\n-# - Status: Unhandled`);

    const reportButtons = getReportButtons(true, false);

    const reportSection = createReportSectionBuilder(reportedContent, reportMessageURL, reportedinfo, isemergency);

    const infoContainer = new ContainerBuilder()
        .addTextDisplayComponents([headerText, infoText])
        .addActionRowComponents(reportButtons)

    const reportContainer = new ContainerBuilder()
        .setAccentColor(0xFF756E)
        .addSectionComponents(reportSection);

    const reportMessage = await getChannel(interaction.guild, SV.CHANNELS.USER_REPORTS).send({
        components: [infoContainer, reportContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: { parse: ['roles'] }
    });

    return reportMessage.id;
}

async function createProfileReport(interaction) {
    const reportedUser = await getUser(interaction.client, interaction.targetUser.id, true);
    const reportedAvatar = reportedUser.displayAvatarURL({ dynamic: true, size: 1024 });
    const reportedBanner = reportedUser.bannerURL({ dynamic: true, size: 1024 });
    const reportEmoji = '👤';

    const headerText = new TextDisplayBuilder()
        .setContent(`### ${reportEmoji}  ${reportedUser.username}'s profile has been reported`)

    const infoText = new TextDisplayBuilder()
        .setContent(`-# - ID: ${reportedUser.id}\n-# - Status: Unhandled`);

    const reportButtons = getReportButtons(false, true);
    
    const infoSection = new SectionBuilder()
        .addTextDisplayComponents((text) =>
            text.setContent(`- **Display Name**: ${reportedUser.displayName}\n` +
                                    `- **Username**: @${reportedUser.username}\n` +
                                    `- **Mention**: <@${reportedUser.id}>\n`)
        )
        .setThumbnailAccessory((thumb) =>
            thumb.setDescription('Profile picture of the reported user')
                 .setURL(reportedAvatar)
                 .setSpoiler(false)
        );

    const separatorComp = new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Small)
    
    // Don't create a banner component if the user doesn't have a banner, will error
    let bannerMedia = null;
    if (reportedBanner) {
        bannerMedia = new MediaGalleryBuilder().addItems((item) =>
            item.setDescription('Banner of the reported user')
                .setURL(reportedBanner)
                .setSpoiler(false)
        );
    }
    
    const infoContainer = new ContainerBuilder()
        .addTextDisplayComponents([headerText, infoText])
        .addActionRowComponents(reportButtons)
    
    const reportContainer = new ContainerBuilder()
        .setAccentColor(0xFF756E)
        .addSectionComponents(infoSection)
    
    // If the user has a banner, add a banner component
    if (bannerMedia) {
        reportContainer.addSeparatorComponents(separatorComp)
        reportContainer.addMediaGalleryComponents(bannerMedia);
    }

    const reportMessage = await getChannel(interaction.guild, SV.CHANNELS.USER_REPORTS).send({
        components: [infoContainer, reportContainer],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {}
    });

    return reportMessage.id;
}

async function editReport(interaction, data, reportedinfo, isemergency) {
    const reportData = data.reports;
    const reportChannelID = reportedinfo.split('-')[0];
    const reportMessageID = reportedinfo.split('-')[1];
    const reporters = reportData.get(reportedinfo);
    const reportMessageURL = `https://discord.com/channels/${interaction.guild.id}/${reportChannelID}/${reportMessageID}`;

    const message = await getMessage(interaction.guild, reportChannelID, reportMessageID);
    if (!message) return null;
    const reportedContent = escapeAllMarkdown(truncate(message.content, 70), true);

    // If the report message can't be found (accidentally deleted or the like), delete the data and have them try again
    const report = await getMessage(interaction.guild, SV.CHANNELS.USER_REPORTS, data.reportID);
    if (!report) {
        await data.deleteOne();
        return null;
    }

    const newComps = report.components.map((c) => c.toJSON());
    const reportComp = newComps[1];
    if (!reportComp) return null;
    
    // Check for multiple reports: Get the index of any section that has the message URL and update the counter if existing
    // + add a warning icon if it was an emergency
    const reportMatchIndex = getIndexOfSectionIncluding(reportComp, reportMessageURL);
    if (reportMatchIndex >= 0) {
        const reportSection = reportComp.components[reportMatchIndex].components[0];
        const isWasEmergency = isemergency || reportSection.content.includes('⚠️');
        const count = reporters.length;

        reportSection.content = `### ${count} ${pluralize('report', count)} ${isWasEmergency ? '⚠️' : ''}\n${reportedContent}`;
    } else {
        const separatorComp = new SeparatorBuilder()
            .setDivider(true)
            .setSpacing(SeparatorSpacingSize.Small)
        
        const newReportSection = createReportSectionBuilder(reportedContent, reportMessageURL, reportedinfo, isemergency);
        reportComp.components.push(separatorComp)
        reportComp.components.push(newReportSection);
    }

    await report.edit({ components: newComps });
    if (isemergency) await report.reply({ content: `<@&${SV.ROLES.TRIAL_MODERATOR}> <@&${SV.ROLES.MODERATOR}>: This report has been marked as an emergency!`, allowedMentions: { parse: ['roles'] } });
}

function createReportSectionBuilder(content, url, reportinfo, isemergency) {
    return new SectionBuilder()
        .addTextDisplayComponents((text) =>
            text.setContent(`### 1 report ${isemergency ? '⚠️' : ''}\n${content}`)
        )
        .setButtonAccessory(new ButtonBuilder()
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setLabel('Jump')
        );
}

module.exports = {
    createReport,
    createProfileReport,
    editReport
}