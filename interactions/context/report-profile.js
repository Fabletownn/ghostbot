const { MessageFlags } = require('discord.js');
const { createProfileReport } = require('../../utils/report-utils.js');
const { getMember } = require('../../utils/fetch-utils.js');
const REPORTS = require('../../models/reports.js');

module.exports = {
    commandName: 'Report Profile',

    async execute(interaction) {
        try {
            const reportedUser = interaction.targetUser;
            const reportedMember = await getMember(interaction.guild, reportedUser.id);
            const immuneRoles = ['749029859048816651', '756591038373691606', '759255791605383208'];
            const newReportMap = new Map([[reportedUser.id, [interaction.user.id]]]); // Create a map for the sake of being able to view who reported it
            const rData = await REPORTS.findOne({ userID: reportedUser?.id, profile: true, handled: false }); // Fetch unhandled profile data for that user ID

            if (reportedUser?.bot || (reportedMember && immuneRoles?.some((role) => reportedMember?.roles.cache.has(role)))) return interaction.reply({ content: 'This user cannot be reported.' });
            if (rData) return interaction.reply({ content: 'Thank you for your profile report! This profile was already reported and will be handled by the staff team as soon as possible.', flags: MessageFlags.Ephemeral });
            
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const reportID = await createProfileReport(interaction);
            if (!reportID) throw new Error('Failed to create profile report');

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
        } catch (error) {
            trailError(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred trying to report that profile.', flags: MessageFlags.Ephemeral });
            } else {
                await interaction.followUp({ content: 'An error occurred trying to report that profile.', flags: MessageFlags.Ephemeral });
            }
        }
    }
}