const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks a locked channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('The channel that will be unlocked')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),
    async execute(interaction) {
        const channelOption = interaction.options.getChannel('channel');

        await channelOption.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: true
        });

        await channelOption.send({ content: `This channel **has been unlocked**. Thank you for your patience.` });

        await interaction.reply({ content: `The <#${channelOption.id}> channel has been unlocked successfully.` });
    },
};