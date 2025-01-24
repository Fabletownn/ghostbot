const { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits } = require('discord.js');

/*
* Message context command for flagging messages; to be repurposed
*/
module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Flag Message')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
};