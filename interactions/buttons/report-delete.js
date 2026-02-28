const { MessageFlags } = require('discord.js');
const { toggleButtons } = require('../../utils/component-utils.js');
const { getMessage } = require('../../utils/fetch-utils.js');
const { pluralize } = require('../../utils/message-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customId: 'report-delete',

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id, handled: false });
        if (!reportData) return interaction.reply({ content: 'Failed to delete the reported messages as no data was found.', flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        let reportCount = 0;    // Counter for the for loop
        let deletionCount = 0;  // Counter for how many messages are deleted
        let dismissalCount = 0; // Counter for how many messages are dismissed

        const newComps = interaction.message.components.map((c) => c.toJSON());
        const infoContainer = newComps[0];
        const infoContent = infoContainer.components[1].content;
        const buttonsRow = infoContainer.components[2];
        const reportComp = newComps[1];
        const keptButtons = ['report-viewreps'];
        const reports = reportComp.components.filter((c) => c.accessory);

        // For each report, get the message ID of it and delete them individually, if existing and undismissed
        for (const [reportInfo, reporters] of reportData.reports) {
            const report = reports[reportCount].components;
            if (!report) throw new Error('Report not found!');

            const reportContent = report[0].content;
            if (!reportContent) throw new Error('Report content not found!');
            
            // Don't delete dismissed reports (only check for strike-through markdown)
            if (reportContent.startsWith('~~')) {
                reportCount++;
                dismissalCount++;
                continue;
            }

            const reportChannelID = reportInfo.split('-')[0];
            const reportMessageID = reportInfo.split('-')[1];

            try {
                const message = await getMessage(interaction.guild, reportChannelID, reportMessageID);
                if (!message) continue;

                await message.delete();
                deletionCount++;
            } catch {}
            
            reportCount++;
        }

        // If there is data, mark it as handled to be filtered out for future reports
        if (reportData) {
            reportData.handled = true;
            await reportData.save();
        }

        // Modify the buttons
        buttonsRow.components = toggleButtons(buttonsRow, { keep: keptButtons });
        infoContainer.components[1].content = infoContent.replace('Unhandled', 'Handled');
        reportComp.accent_color = parseInt('38DD86', 16);

        // Edit the embed to reflect it being handled and respond to the user
        await interaction.message.edit({ components: newComps });
        await interaction.followUp({ content: `Deleted **${deletionCount} ${pluralize('message', deletionCount)}** total *(${dismissalCount} dismissed)*.` });
    }
}