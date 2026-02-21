const { EmbedBuilder, MessageFlags } = require('discord.js');
const { toggleButtons } = require('../../utils/component-utils.js');
const { getMessage } = require('../../utils/fetch-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customId: 'report-delete',

    async execute(interaction) {
        const reportData = await REPORTS.findOne({ reportID: interaction.message.id, handled: false });
        const oldEmbed = interaction.message.embeds[0];

        if (!reportData || !oldEmbed) return interaction.reply({ content: 'Failed to delete the reported messages as no data was found.', flags: MessageFlags.Ephemeral });

        const newEmbed = EmbedBuilder.from(oldEmbed)
            .setColor('#38DD86')
            .setFooter({ text: oldEmbed.footer.text.replace('Unhandled', 'Handled') });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // For each report, get the message ID of it and delete them individually, if existing
        let deletionCount = 0;
        
        for (const [reportInfo, reporters] of reportData.reports) {
            const reportChannelID = reportInfo.split('-')[0];
            const reportMessageID = reportInfo.split('-')[1];

            try {
                const message = await getMessage(interaction.guild, reportChannelID, reportMessageID);
                if (!message) continue;

                await message.delete();
                deletionCount++;
            } catch {}
        }

        // If there is data, mark it as handled to be filtered out for future reports
        if (reportData) {
            reportData.handled = true;
            await reportData.save();
        }

        // Edit the embed to reflect it being handled and respond to the user
        await interaction.message.edit({ embeds: [newEmbed], components: toggleButtons(interaction.message.components, { keep: ['report-viewreps'] }) });
        await interaction.followUp({ content: `Deleted **${deletionCount} message${deletionCount > 1 ? 's' : ''}** existing.` });
    }
}