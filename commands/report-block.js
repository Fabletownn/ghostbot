const { SlashCommandBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { getMember } = require('../utils/fetch-utils.js');
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
        const user = await getMember(interaction.guild, userOption);
        const cdData = await COOLDOWNS.findOne({ userID: userOption });

        if (cdData) {
            if (cdData.blacklisted) {
                return interaction.reply({ content: 'That user ID is already blocked from the user reporting system. To undo this action, use the `/report-unblock` command instead.', flags: MessageFlags.Ephemeral });
            } else {
                cdData.blacklisted = true;
                await cdData.save();
            }
        } else {
            const newBlockData = new COOLDOWNS({
                guildID: interaction.guild.id,
                userID: userOption,
                blacklisted: true,
                expiresAt: null
            });

            await newBlockData.save();
        }

        await interaction.reply({ content: `Blocked ${user ? `<@${userOption}> (${userOption})` : `ID \`${userOption}\``} from being able to utilize the user reporting system.`, allowedMentions: { parse: [] } });
    },
};