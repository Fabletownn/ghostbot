const { MessageFlags } = require('discord.js');
const { getMessage } = require('../../utils/fetch-utils.js');
const REPORTS = require('../../models/reports.js');
const SV = require('../../models/server-values.json');

module.exports = {
    customId: 'report-viewreps',

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id }); // Look for both handled and unhandled reports - no filter here
        if (!reportData) return interaction.reply({ content: 'Failed to view the reporters as no data was found.', flags: MessageFlags.Ephemeral });

        const isProfileReport = reportData.profile;
        const listMessage = isProfileReport ? '' : 'The following messages have been reported by users:';

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // For each reporter, list their mention and user ID out
        let reportedMessagesList = '';
        let reportCounter = 0;
        
        for (const [reportInfo, reporters] of reportData.reports) {
            const report = await getMessage(interaction.guild, SV.CHANNELS.USER_REPORTS, reportData.reportID);
            if (!report) throw new Error('Report not found!');

            const reportEmbed = report.embeds[0];
            if (!reportEmbed) throw new Error('Report not found!');

            let reportField = reportEmbed.fields[reportCounter];
            if (!isProfileReport) reportedMessagesList += `- ${reportField.value} **(${reportField.name})**\n`; // Don't add a field if it's a profile report

            for (let i = 0; i < reporters.length; i++)
                reportedMessagesList += `  - Reported by <@${reporters[i]}> (${reporters[i]})\n`;

            reportCounter++;
        }

        await interaction.followUp({ content: `${listMessage}\n${reportedMessagesList}`, allowedMentions: { parse: [] } });
    }
}