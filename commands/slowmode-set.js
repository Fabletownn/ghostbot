const sf = require('seconds-formater');
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode-set')
        .setDescription('Sets the slowmode of a channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('The channel that the slowmode will be set for')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildForum)
        )
        .addIntegerOption((option) =>
            option.setName('seconds')
                .setDescription('The slowmode to be set in seconds')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600)
        ),
    async execute(interaction) {
        const channelOption = interaction.options.getChannel('channel');
        const secondsOption = interaction.options.getInteger('seconds');

        await channelOption.setRateLimitPerUser(secondsOption);
        await interaction.reply({ content: `Successfully ${(secondsOption === 0) ? `disabled <#${channelOption.id}>'s slowmode` : `set <#${channelOption.id}>'s slowmode`} (${sf.convert(secondsOption || 0).format('MM:SS')}).` });
    },
};