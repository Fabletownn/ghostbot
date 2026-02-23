const {
    MessageFlags,
    ButtonBuilder, ButtonStyle,
    TextDisplayBuilder,
    SectionBuilder,
    ContainerBuilder,
    SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder
} = require('discord.js');
const { getChannel, getMessage, getUser } = require('./fetch-utils.js');
const { sanitizeMessage, pluralize } = require('./message-utils.js');
const { getIndexOfSectionIncluding, getReportButtons } = require('./component-utils.js');
const SV = require('../models/server-values.json');

async function createReport(interaction, reportedinfo, isemergency) {
    const reportChannelID = reportedinfo.split('-')[0];
    const reportMessageID = reportedinfo.split('-')[1];
    const reportMessageURL = `https://discord.com/channels/${interaction.guild.id}/${reportChannelID}/${reportMessageID}`;

    const message = await getMessage(interaction.guild, reportChannelID, reportMessageID);
    if (!message) return null;

    const reportedUser = message.author;
    const reportedContent = sanitizeMessage(message.content, 70);
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
    
    const bannerMedia = new MediaGalleryBuilder().addItems((item) =>
        item.setDescription('Banner of the reported user')
            .setURL(reportedBanner)
            .setSpoiler(false)
        );
    
    const infoContainer = new ContainerBuilder()
        .addTextDisplayComponents([headerText, infoText])
        .addActionRowComponents(reportButtons)
    
    const reportContainer = new ContainerBuilder()
        .setAccentColor(0xFF756E)
        .addSectionComponents(infoSection)
        .addSeparatorComponents(separatorComp)
        .addMediaGalleryComponents(bannerMedia)

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
    const reportedContent = sanitizeMessage(message.content, 70);

    // If the report message can't be found (accidentally deleted or the like), delete the data and have them try again
    const report = await getMessage(interaction.guild, SV.CHANNELS.USER_REPORTS, data.reportID);
    if (!report) {
        await data.deleteOne();
        return null;
    }

    const newComps = report.components.map((c) => c.toJSON());
    const reportComp = newComps[1];
    if (!reportComp) return null;
    
    // Get the index of whichever section has the content and update the counter + add an emergency icon if it was
    const reportMatchIndex = getIndexOfSectionIncluding(reportComp, reportMessageURL);
    if (reportMatchIndex >= 0) {
        const reportSection = reportComp.components[reportMatchIndex].components[0];
        const isWasEmergency = isemergency || reportSection.content.includes('⚠️');
        const dismissMarkers = reportSection.content.includes('~~') ? '~~' : '';
        const count = reporters.length;

        reportSection.content = `${dismissMarkers}### ${count} ${pluralize('report', count)} ${isWasEmergency ? '⚠️' : ''}\n` +
                                `[${reportedContent}](${reportMessageURL})${dismissMarkers}`;
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
            text.setContent(`### 1 report ${isemergency ? '⚠️' : ''}\n[${content}](${url})`)
        )
        .setButtonAccessory(new ButtonBuilder()
            .setCustomId(`subreport-dismiss-${reportinfo}`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('1474554168235655349')
        );
}

module.exports = {
    createReport,
    createProfileReport,
    editReport
}