const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Locks a channel with optional reasoning')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('The channel that will be locked')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addStringOption((option) =>
            option.setName('reason')
                .setDescription('The announced reason for the lock')
                .setRequired(false)
                .setMinLength(1)
                .setMaxLength(1500)
        ),
    async execute(interaction) {
        const channelOption = interaction.options.getChannel('channel'); // Get channel value to be locked
        const reasonOption = interaction.options.getString('reason');    // Get lock reason if provided

        // Set permission overwrites to disable "Send Messages" permission
        await channelOption.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
        
        // Send messages to confirm the channel lock, and command response
        await channelOption.send({ content: `This channel **has been locked** by a moderator. Please stand by while any issues are being handled.\n\n${(reasonOption !== null) ? `Reason: **${reasonOption}**` : `Expect a message from a staff member soon.`}` });
        await interaction.reply({ content: `The <#${channelOption.id}> channel has been locked successfully (with reason: ${(reasonOption !== null) ? reasonOption : 'None'}).` });
    },
};