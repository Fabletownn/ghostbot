const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Report Profile')
        .setType(ApplicationCommandType.User)
};