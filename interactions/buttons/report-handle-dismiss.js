const { MessageFlags, EmbedBuilder } = require('discord.js');
const { toggleButtons } = require('../../utils/component-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customIds: ['report-handle', 'report-dismiss'],

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id, handled: false });
        const newComps = interaction.message.components.map((c) => c.toJSON());
        const infoContainer = newComps[0];
        const infoContent = infoContainer.components[1].content;
        const buttonsRow = infoContainer.components[2];
        const reportContainer = newComps[1];
        const isHandled = interaction.customId === 'report-handle';
        const isHidden = infoContent.includes('Hidden');
        const handleColor = isHandled ? '38DD86' : '757D8D';
        const handleStatus = isHandled ? 'Handled' : 'Dismissed';
        const keptButtons = isHidden ? ['report-viewreps'] : ['report-hidedetails', 'report-viewreps'];

        // Modify the buttons
        buttonsRow.components = toggleButtons(buttonsRow, { keep: keptButtons });
        infoContainer.components[1].content = infoContent.replace('Unhandled', handleStatus);
        reportContainer.accent_color = parseInt(handleColor, 16);

        // If there is data, mark it as handled to be filtered out for future reports
        if (reportData) {
            reportData.handled = true;
            await reportData.save();
        }

        // Edit the embed to reflect whether it was handled or dismissed and respond to the user
        await interaction.message.edit({ components: newComps, allowedMentions: {} });
        await interaction.reply({ content: `Marked the report as ${isHandled ? 'handled' : 'dismissed'}.`, flags: MessageFlags.Ephemeral });
    }
}