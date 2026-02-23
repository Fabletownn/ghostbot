const { MessageFlags } = require('discord.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customId: 'report-viewreps',

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id }); // Look for both handled and unhandled reports - no filter here
        if (!reportData) return interaction.reply({ content: 'Failed to view the reporters as no data was found.', flags: MessageFlags.Ephemeral });

        const isProfileReport = reportData.profile;
        const listMessage = isProfileReport ? '' : '## Reports Submitted';

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // For each reporter, list their mention and user ID out
        let reportedMessagesList = '';
        let reportCounter = 0;

        const newComps = interaction.message.components.map((c) => c.toJSON());
        const reportComp = newComps[1];
        const reports = reportComp.components.filter((c) => c.accessory);
        
        for (const [reportInfo, reporters] of reportData.reports) {
            const report = reports[reportCounter].components;
            if (!report) throw new Error('Report not found!');
            
            const reportContent = report[0].content;
            if (!reportContent) throw new Error('Report content not found!');
            
            const content = reportContent.split('\n')[1].replace('~~', ' *(Dismissed)*');

            // Add the report if it's a non-profile report
            if (!isProfileReport)
                reportedMessagesList += `- ${content}\n`; // Don't add a field if it's a profile report
            else 
                reportedMessagesList += '- Profile Report\n';

            for (let i = 0; i < reporters.length; i++)
                reportedMessagesList += `  - by <@${reporters[i]}> (${reporters[i]})\n`;

            reportCounter++;
        }

        await interaction.followUp({ content: `${listMessage}\n${reportedMessagesList}`, allowedMentions: { parse: [] } });
    }
}