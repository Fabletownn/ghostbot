const { EmbedBuilder, MessageFlags } = require('discord.js');
const { toggleButtons } = require('../../utils/component-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    customId: 'report-hidedetails',

    async execute(interaction) {
        try {
            const reportData = await REPORTS.findOne({ reportID: interaction.message.id });
            const isHandled = reportData.handled;
            const keptButtons = isHandled ? ['report-viewreps'] : ['report-handle', 'report-dismiss', 'report-viewreps'];
            
            const oldEmbed = interaction.message.embeds[0];
            const newEmbed = EmbedBuilder.from(oldEmbed)
                .setAuthor({ name: oldEmbed.author.name, iconURL: 'https://i.imgur.com/8XDdiH1.png' })
                .setThumbnail(null)
                .setImage(null)
                .setFooter({ text: `${oldEmbed.footer.text}  •  Hidden`})

            await interaction.message.edit({ embeds: [newEmbed], components: toggleButtons(interaction.message.components, { keep: keptButtons }) });
            await interaction.reply({ content: 'Hid the profile picture and banner information for this profile report.', flags: MessageFlags.Ephemeral });
        } catch (error) {
            trailError(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred trying to hide details for this report', flags: MessageFlags.Ephemeral });
            }
        }
    }
}