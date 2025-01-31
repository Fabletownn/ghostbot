const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const COOLDOWNS = require('../models/repcooldowns.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report-unblock')
        .setDescription('Unblocks a user and allows them to use the user reporting system')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('user-id')
                .setDescription('The user ID that will be unblocked')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userOption = interaction.options.getString('user-id');
        const user = interaction.guild.members.cache.get(userOption);
        const data = await COOLDOWNS.findOne({ userID: userOption });

        if ((!data) || (data && !data.blacklisted)) return interaction.reply({ content: 'That user ID is not blocked from the user reporting system. To block a member from the system, use the `/report-block` command instead.', ephemeral: true });

        await COOLDOWNS.findOneAndDelete({ userID: userOption });
        await interaction.reply({ content: `Unblocked ${user ? `<@${userOption}> (${userOption})` : `ID \`${userOption}\``} to be able to utilize the user reporting system.`, allowedMentions: { parse: [] } });
    },
};