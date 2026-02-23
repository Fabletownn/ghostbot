const { MessageFlags } = require('discord.js');

module.exports = {
    customId: 'subreport-dismiss',

    async execute(interaction) {
        const newComps = interaction.message.components.map((c) => c.toJSON());
        const reportComp = newComps[1];
        
        for (const component of reportComp.components) {
            const accessory = component.accessory;
            if (!accessory) continue; // ignore separator components
            
            if (accessory.custom_id === interaction.component.customId) {
                const reportContent = component.components[0].content;

                // Cross out the content (ensure not to double cross-out)
                // Simply crossing out the report and checking for the markdown for ignoring works fine
                if (!reportContent.startsWith('~~')) {
                    component.components[0].content = `~~${reportContent}~~`;
                }
                
                // Disable the dismiss button
                accessory.disabled = true;
                break;
            }
        }
        
        await interaction.message.edit({ components: newComps, allowedMentions: {} });
        await interaction.reply({ content: 'Dismissed the individual report and it will not be included under Delete actions.', flags: MessageFlags.Ephemeral });
    }
}