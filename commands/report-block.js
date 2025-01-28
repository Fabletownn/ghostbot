const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const COOLDOWNS = require('../models/repcooldowns.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report-block')
        .setDescription('Blocks a user from using the user reporting system')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addStringOption((option) =>
            option.setName('user-id')
                .setDescription('The user ID that will be blocked')
                .setRequired(true)
        ),
    async execute(interaction) {
        const userOption = interaction.options.getString('user-id');
        const user = interaction.guild.members.cache.get(userOption);
        const data = await COOLDOWNS.findOne({ userID: userOption });

        if (data) {
            if (data.blacklisted) {
                return interaction.reply({ content: 'That user ID is already blocked from the user reporting system. To undo this action, use the `/report-unblock` command instead.', ephemeral: true });
            } else {
                data.blacklisted = true;
                data.save();
            }
        } else {
            const newBlockData = new COOLDOWNS({
                userID: userOption,
                expires: 0,
                blacklisted: true
            });

            await newBlockData.save();
        }

        await interaction.reply({ content: `Blocked ${user ? `<@${userOption}> (${userOption})` : `ID \`${userOption}\``} from being able to utilize the user reporting system.`, allowedMentions: { parse: [] } });
    },
};