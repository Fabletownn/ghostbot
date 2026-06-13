const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Edit Ghost Message')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
};