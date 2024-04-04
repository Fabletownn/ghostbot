const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('(Moderator) Locks a channel with optional reasoning')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers)
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
        const channelOption = interaction.options.getChannel('channel');
        const reasonOption = interaction.options.getString('reason');

        await channelOption.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: false
        });

        await channelOption.send({ content: `This channel **has been locked** by a moderator. Please stand by while any issues are being handled.\n\n${(reasonOption !== null) ? `Reason: **${reasonOption}**` : `Expect a message from a staff member soon.`}` });

        await interaction.reply({ content: `The <#${channelOption.id}> channel has been locked successfully (with reason: ${(reasonOption !== null) ? reasonOption : 'None'}).` });
    },
};