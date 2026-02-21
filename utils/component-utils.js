const { ActionRowBuilder, ButtonBuilder, MessageFlags } = require('discord.js');

async function safeExecute(interaction, handler) {
    try {
        await handler.execute(interaction);
    } catch (error) {
        trailError(error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred trying to execute that command.', flags: MessageFlags.Ephemeral });
        } else {
            await interaction.followUp({ content: 'An error occurred trying to execute that command.', flags: MessageFlags.Ephemeral });
        }
    }
}

function toggleButtons(components, options = {}) {
    const {
        keep = [],
        disableAll = false
    } = options; 
    
    return components.map((row) => {
        const newRow = new ActionRowBuilder();
        const updatedRow = row.components.map((comp) => {
            const disabled = disableAll ? true : !keep.includes(comp.customId);
            
            return ButtonBuilder.from(comp).setDisabled(disabled);
        });
        
        return newRow.addComponents(...updatedRow);
    });
}

module.exports = {
    safeExecute,
    toggleButtons
};
