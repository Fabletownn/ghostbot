const { ActionRowBuilder, ButtonBuilder } = require("discord.js");

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
    toggleButtons
};
