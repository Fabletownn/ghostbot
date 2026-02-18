const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { getChannel, getMessage, getUser } = require('../utils/fetch-utils.js');
const { sanitizeMessage } = require('../utils/message-utils.js');
const SV = require('../models/server-values.json');

async function createReport(interaction, reportedinfo, isemergency) {
    const reportChannelID = reportedinfo.split('-')[0];
    const reportMessageID = reportedinfo.split('-')[1];
    const reportMessageURL = `https://discord.com/channels/${interaction.guild.id}/${reportChannelID}/${reportMessageID}`;

    const message = await getMessage(interaction.guild, reportChannelID, reportMessageID);
    if (!message) return null;

    const reportedUser = message.author;
    const reportedContent = sanitizeMessage(message.content, 70);
    const reportedUserAvatar = reportedUser.displayAvatarURL({ dynamic: true, size: 512 });

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

    const reportMessage = await interaction.guild.channels.cache.get(SV.CHANNELS.USER_REPORTS).send({
        content: isemergency ? '<@&759255791605383208> <@&756591038373691606>: This report has been marked as an emergency!' : null,
        embeds: [reportEmbed],
        components: [reportButtons],
        allowedMentions: { parse: ['roles'] }
    });

    return reportMessage.id;
}

async function createProfileReport(interaction) {
    const reportedUser = await getUser(interaction.client, interaction.targetUser.id, true);
    const reportedAvatar = reportedUser.displayAvatarURL({ dynamic: true, size: 1024 });
    const reportedBanner = reportedUser.bannerURL({ dynamic: true, size: 1024 });
    const reportEmbed = new EmbedBuilder()
        .setAuthor({ name: `@${reportedUser.username}'s profile has been reported`, iconURL: reportedAvatar })
        .addFields([
            { name: 'Display Name', value: reportedUser.displayName, inline: true },
            { name: 'Username', value: `@${reportedUser.username}`, inline: true },
            { name: 'Mention', value: `<@${reportedUser.id}>`, inline: true },
            { name: 'Other', value: '- **Pronouns** and **About Me** information is not available. Check their profile in full if nothing shown.\n- Hide **NSFW**/**NSFL** content with the eye button.', inline: false }
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

    const reportMessage = await getChannel(interaction.guild, SV.CHANNELS.USER_REPORTS).send({ embeds: [reportEmbed], components: [reportButtons] });
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

    // If the report message can't be found (accidentally deleted or the like), delete the data and have them try again
    const report = await getMessage(interaction.guild, SV.CHANNELS.USER_REPORTS, data.reportID);
    if (!report) {
        await data.deleteOne();
        return null;
    }

    const reportEmbed = report.embeds[0];
    if (!reportEmbed) return null;

    const reportedContent = sanitizeMessage(message.content, 70);
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

module.exports = {
    createReport,
    createProfileReport,
    editReport
}