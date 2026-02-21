const { MessageFlags } = require('discord.js');
const { getMember } = require('../../utils/fetch-utils.js');
const { createProfileReport } = require('../../utils/report-utils.js');
const REPORTS = require('../../models/reports.js');
const SV = require('../../models/server-values.json');
const COOLDOWNS = require('../../models/repcooldowns.js');

module.exports = {
    commandName: 'Report Profile',

    async execute(interaction) {
        const reportedUser = interaction.targetUser;
        const reportedMember = await getMember(interaction.guild, reportedUser.id);
        const immuneRoles = [SV.ROLES.KINETIC_GAMES, SV.ROLES.MODERATOR, SV.ROLES.TRIAL_MODERATOR];

        const rData = await REPORTS.findOne({ userID: reportedUser?.id, profile: true, handled: false }); // Fetch unhandled profile data for that user ID
        const cdData = await COOLDOWNS.findOne({ userID: interaction.user.id, blacklisted: true }); // Get existing report cooldown data, from non-expired & the most recent
        if (rData) return interaction.reply({ content: 'Thank you for your profile report! This profile was already reported and will be handled by the staff team as soon as possible.', flags: MessageFlags.Ephemeral });
        if (cdData) return interaction.reply({ content: 'You are blocked from using the user reporting system. Contact <@1043623513669513266> if you believe this is an error.', flags: MessageFlags.Ephemeral })

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        if (reportedUser?.bot || (reportedMember && immuneRoles?.some((role) => reportedMember?.roles.cache.has(role)))) return interaction.followUp({ content: 'This user cannot be reported.' });

        const reportID = await createProfileReport(interaction);
        if (!reportID) throw new Error('Failed to create profile report');

        const newReportMap = new Map([[reportedUser.id, [interaction.user.id]]]); // Create a map for the sake of being able to view who reported it
        const newReportData = new REPORTS({
            userID: reportedUser.id,
            reports: newReportMap,
            reportID: reportID,
            emergency: false,
            profile: true,
            handled: false,
            expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), // Automatically expire after 16 hours
        });

        // Save the data and confirm response
        await newReportData.save();
        await interaction.followUp({ content: 'Thank you for your profile report! This will be handled by the staff team as soon as possible.', flags: MessageFlags.Ephemeral });
    }
}