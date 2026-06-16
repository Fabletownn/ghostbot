const { AttachmentBuilder, MessageFlags } = require('discord.js');
const BULKS = require('../../models/bulkdeletes.js');

module.exports = {
    customId: 'log-viewbulk',

    async execute(interaction) {
        const bulkData = await BULKS.findOne({ messageID: interaction.message.id });
        if (!bulkData) return interaction.reply({ content: 'Data for this bulk delete log has expired.', flags: MessageFlags.Ephemeral });
        
        // Defer while creating the text file
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        // Create a text file with information from the log, do not risk sending it raw for character limit
        const logFile = new AttachmentBuilder(
            Buffer.from(bulkData.log, 'utf8'),{
                name: `bulk-delete-${bulkData.messageID}.txt`
            }
        );
        
        // Reply with the text file once created
        await interaction.followUp({ files: [logFile] });
    }
}