const { safeExecute } = require('../../utils/component-utils.js');
const fs = require('node:fs');
const path = require('node:path');

const buttons = new Map();
const modals = new Map();
const contexts = new Map();
const buttonFiles = fs.readdirSync(path.join(__dirname, '../../interactions/buttons')).filter((file) => file.endsWith('.js'));
const modalFiles = fs.readdirSync(path.join(__dirname, '../../interactions/modals')).filter((file) => file.endsWith('.js'));
const contextFiles = fs.readdirSync(path.join(__dirname, '../../interactions/context')).filter((file) => file.endsWith('.js'));

for (const file of buttonFiles) {
    const button = require(`../../interactions/buttons/${file}`);
    
    if (Array.isArray(button.customIds)) {
        button.customIds.forEach((id) => buttons.set(id, button));
    } else {
        buttons.set(button.customId, button);
    }
}

for (const file of modalFiles) {
    const modal = require(`../../interactions/modals/${file}`);

    if (Array.isArray(modal.customIds)) {
        modal.customIds.forEach((id) => modals.set(id, modal));
    } else {
        modals.set(modal.customId, modal);
    }
}

for (const file of contextFiles) {
    const context = require(`../../interactions/context/${file}`);

    if (Array.isArray(context.commandNames)) {
        context.commandNames.forEach((name) => contexts.set(name, context));
    } else {
        contexts.set(context.commandName, context);
    }
}

module.exports = async (Discord, client, interaction) => {
    ///////////////////////// Slash Commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (command)
            await safeExecute(interaction, command);
    }
    
    ///////////////////////// Button Interactions
    else if (interaction.isButton()) {
        let buttonHandler = buttons.get(interaction.customId);
        
        // If there is no handler, check for buttons that *start* with an existing
        // one (for one-offs such as subreport-dismisses)
        if (!buttonHandler) {
            for (const [k, v] of buttons.entries()) {
                if (interaction.customId.startsWith(k)) {
                    buttonHandler = v;
                    break;
                }
            }
        }

        if (buttonHandler)
            await safeExecute(interaction, buttonHandler);
    }

    ///////////////////////// Modal Interactions
    else if (interaction.isModalSubmit()) {
        const modalHandler = modals.get(interaction.customId);

        if (modalHandler)
            await safeExecute(interaction, modalHandler);
    }

    ///////////////////////// Context Menu Commands
    else if (interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) {
        const contextHandler = contexts.get(interaction.commandName);

        if (contextHandler)
            await safeExecute(interaction, contextHandler);
    }
}
