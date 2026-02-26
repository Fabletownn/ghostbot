const { loadInteractions, safeExecute } = require('../../utils/component-utils.js');
const path = require('node:path');

const buttons = loadInteractions(path.join(__dirname, '../../interactions/buttons'), ['customIds', 'customId']);
const modals = loadInteractions(path.join(__dirname, '../../interactions/modals'), ['customIds', 'customId']);
const contexts = loadInteractions(path.join(__dirname, '../../interactions/context'), ['commandNames', 'commandName']);

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
        
        // If there is no handler, check for buttons that *start* with an existing one
        // (for IDs such as subreport-dismiss-12345; check for subreport-dismiss)
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
