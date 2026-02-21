const { MessageFlags, EmbedBuilder } = require('discord.js');
const { toggleButtons } = require('../../utils/component-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customIds: ['report-handle', 'report-dismiss'],

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id, handled: false });
        const oldEmbed = interaction.message.embeds[0];
        const isHandled = interaction.customId === 'report-handle';
        const isHidden = oldEmbed?.footer.text.includes('Hidden');
        const handleColor = isHandled ? '#38DD86' : '#757D8D';
        const handleStatus = isHandled ? 'Handled' : 'Dismissed';
        const keptButtons = isHidden ? ['report-viewreps'] : ['report-hidedetails', 'report-viewreps'];

        const newEmbed = EmbedBuilder.from(oldEmbed)
            .setColor(handleColor)
            .setFooter({ text: oldEmbed.footer.text.replace('Unhandled', handleStatus) });

        // If there is data, mark it as handled to be filtered out for future reports
        if (reportData) {
            reportData.handled = true;
            await reportData.save();
        }

        // Edit the embed to reflect whether it was handled or dismissed and respond to the user
        await interaction.message.edit({ embeds: [newEmbed], components: toggleButtons(interaction.message.components, { keep: keptButtons }) });
        await interaction.reply({ content: `Marked the report as ${isHandled ? 'handled' : 'dismissed'}.`, flags: MessageFlags.Ephemeral });
    }
}