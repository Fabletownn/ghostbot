const { MessageFlags } = require('discord.js');
const { toggleButtons } = require('../../utils/component-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customId: 'report-hidedetails',

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id });
        const isHandled = reportData.handled;
        const keptButtons = isHandled ? ['report-viewreps'] : ['report-handle', 'report-dismiss', 'report-viewreps'];

        const newComps = interaction.message.components.map((c) => c.toJSON());
        const handleComp = newComps[0];
        const reportComp = newComps[1];
        const statusRow = handleComp.components[1];
        const buttonsRow = handleComp.components[2];
        
        // Set the status text to include 'hidden'
        statusRow.content = statusRow.content + '  •  Hidden';
        
        // Set the report content to a spoiler
        reportComp.components[0].accessory.spoiler = true; // profile picture
        reportComp.components[2].items[0].spoiler = true;  // banner
        
        // Modify the buttons
        buttonsRow.components = toggleButtons(buttonsRow, { keep: keptButtons });

        await interaction.message.edit({ components: newComps, allowedMentions: {} });
        await interaction.reply({ content: 'Hid the profile picture and banner information for this profile report.', flags: MessageFlags.Ephemeral });
    }
}