const { ActionRowBuilder, ButtonBuilder, MessageFlags, ButtonStyle} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

function loadInteractions(dir, properties) {
    const interaction_map = new Map();
    const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'));
    
    for (const file of files) {
        const interaction = require(path.join(dir, file));

        for (const property of properties) {
            if (!interaction[property]) continue;

            const keys = Array.isArray(interaction[property]) ? interaction[property] : [interaction[property]];
            keys.forEach((k) => interaction_map.set(k, interaction));
        }
    }
    
    return interaction_map;
}

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

function toggleButtons(button_row, options = {}) {
    const {
        keep = [],
        disableAll = false
    } = options;

    return button_row.components.map((bcomp) => {
        const disabled = !keep.includes(bcomp.custom_id) || disableAll;

        return { ...bcomp, disabled };
    });
}

function getIndexOfSectionIncluding(container, content) {
    return container.components.findIndex((sect) => {
        if (!sect.components || !sect.components[0]) return false;

        return sect.components[0].content?.includes(content);
    });
}

function getReportButtons(deleteoption = true, hidedetailsoption = false) {
    let actionRow = new ActionRowBuilder();
    const handleButton = new ButtonBuilder()
        .setCustomId('report-handle')
        .setLabel('Resolve')
        .setStyle(ButtonStyle.Success)
        .setEmoji('1187528830378852564');
    const deleteButton = new ButtonBuilder()
        .setCustomId('report-delete')
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('1187528832043974716');
    const dismissButton = new ButtonBuilder()
        .setCustomId('report-dismiss')
        .setLabel('Dismiss')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('1474554168235655349');
    const hideDetailsButton = new ButtonBuilder()
        .setCustomId('report-hidedetails')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('1396669210834505920');
    const viewRepsButton = new ButtonBuilder()
        .setCustomId('report-viewreps')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('1332851977507307550');
    
    // Guaranteed buttons for each type of report
    const buttonArray = [handleButton, dismissButton, viewRepsButton];
    // Push in buttons depending on if it's wanted in their correct positions
    if (hidedetailsoption)
        buttonArray.splice(2, 0, hideDetailsButton);
    if (deleteoption)
        buttonArray.splice(1, 0, deleteButton);
    
    actionRow.addComponents(buttonArray);
    
    return actionRow;
}

module.exports = {
    loadInteractions,
    safeExecute,
    toggleButtons,
    getIndexOfSectionIncluding,
    getReportButtons
};
