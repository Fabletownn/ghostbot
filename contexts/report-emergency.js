const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Report Message (Emergency)')
        .setType(ApplicationCommandType.Message)
};