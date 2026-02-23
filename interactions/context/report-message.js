const { MessageFlags } = require('discord.js');
const { getMember } = require('../../utils/fetch-utils.js');
const { createReport, editReport } = require('../../utils/report-utils.js');
const REPORTS = require('../../models/reports.js');
const COOLDOWNS = require('../../models/repcooldowns.js');
const SV = require('../../models/server-values.json');

module.exports = {
    commandNames: ['Report Message', 'Report Message (Emergency)'],

    async execute(interaction) {
        const newReportMap = new Map(); // Create a map ready for new data
        const isEmergency = interaction.commandName.toLowerCase().includes('emergency');
        const reportType = isEmergency ? 'emergency report' : 'report';
        
        const reportedUser = interaction.targetMessage.author;
        const reportedMember = await getMember(interaction.guild, reportedUser.id);
        let reportedMessage = interaction.targetMessage;
        let reportedMessageInfo = `${reportedMessage.channel.id}-${reportedMessage.id}`;

        const rData = await REPORTS.findOne({ userID: reportedUser?.id, profile: false, handled: false }); // Get existing unhandled reports data
        const cdData = await COOLDOWNS.findOne({ userID: interaction.user.id, $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }] }).sort({ expiresAt: -1 }); // Get existing report cooldown data, from non-expired & the most recent
        const immuneRoles = [SV.ROLES.KINETIC_GAMES, SV.ROLES.MODERATOR, SV.ROLES.TRIAL_MODERATOR];

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        // Don't allow them to report the member if they are no longer in the server, are a bot, or a staff member
        if (reportedUser?.bot || (reportedMember && immuneRoles?.some((role) => reportedMember?.roles.cache.has(role)))) return interaction.followUp({ content: 'This user cannot be reported.' });
        
        // Don't allow them to report if they are either blacklisted from the system, or on cooldown
        if (cdData) {
            if (cdData.blacklisted) return interaction.followUp({ content: 'You are blocked from using the user reporting system. Contact <@1043623513669513266> if you believe this is an error.' });

            if (cdData.expiresAt > new Date().getTime()) {
                return interaction.followUp({ content: `You are on cooldown and can report another message <t:${Math.round(cdData.expiresAt / 1000)}:R>.` });
            }
        }

        // If there is no report data
        if (!rData) {
            newReportMap.set(reportedMessageInfo, [interaction.user.id]); // Set the map key to message ID, value to an array of the reporter's ID

            const reportID = await createReport(interaction, reportedMessageInfo, isEmergency);
            if (!reportID) return interaction.followUp({ content: `An error occurred trying to send that ${reportType}.` });

            // Create a new set of data with the newly created report map
            const newReportData = new REPORTS({
                userID: reportedUser.id,
                reports: newReportMap,
                reportID: reportID,
                emergency: isEmergency,
                profile: false,
                handled: false,
                expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), // Automatically set to expire after 16 hours
            });

            // Save the data and confirm response
            await newReportData.save();
            await interaction.followUp({ content: `Thank you for your ${reportType}! This message will be handled by the staff team as soon as possible.` });

        } else {
            // If there already is report data for the User ID, stop them from making multiple emergency reports
            if (isEmergency && rData.emergency) return interaction.followUp({ content: 'This user\'s messages have already been marked as an emergency! It will be handled by the staff team as soon as possible.' });
            // If it's not an emergency and they already have more than 5 reports, stop them from reporting
            if (!isEmergency && (rData.reports.size >= 5)) return interaction.followUp({ content: 'You have exceeded the amount of reports on this user at the moment. It will be handled by the staff team as soon as possible.' });

            const reportMap = rData.reports;
            const reportArray = reportMap.get(reportedMessageInfo);

            // If the message has already been reported before
            if (reportArray) {
                if (reportArray.length >= 10) return interaction.followUp({ content: 'This user\'s messages have already been reported and is now limited! It will be handled by the staff team as soon as possible.' });
                if ((reportArray.includes(interaction.user.id)) && (!isEmergency)) return interaction.followUp({ content: `You already reported this message! The message will be handled by the staff team as soon as possible.` });

                // Push the reporter's UID into it; if they are rereporting as an emergency, don't however
                if (!reportArray.includes(interaction.user.id)) reportArray.push(interaction.user.id);

                // Push the new reporter's ID into the map value
                reportMap.set(reportedMessageInfo, reportArray);

                // Set the reports emergency value if necessary, then mark data as modified so Mongo is aware of it
                if (isEmergency) rData.emergency = isEmergency;
                rData.markModified('reports');

                // Save data, then edit the report
                await rData.save();

                const editedReport = await editReport(interaction, rData, reportedMessageInfo, isEmergency);
                if (editedReport === null) return interaction.followUp({ content: `An error occurred trying to ${reportType} that message, please try again.` });

                await interaction.followUp({ content: `Thank you for your ${reportType}! This message has already been reported, and your report has been added in addition.` });

            // If the message hasn't been reported but the user has
            } else {
                reportMap.set(reportedMessageInfo, [interaction.user.id]); // Create a new map for the newly reported message ID
                if (isEmergency) rData.emergency = isEmergency;

                // Save data, then edit the report
                await rData.save();

                const editedReport = await editReport(interaction, rData, reportedMessageInfo, isEmergency);
                if (editedReport === null) return interaction.followUp({ content: `An error occurred trying to ${reportType} that message, please try again.` });

                await interaction.followUp({ content: `Thank you for your additional ${reportType}! This message will be handled by the staff team as soon as possible.` });
            }
        }

        // Add a cooldown after reporting
        const newCooldownData = new COOLDOWNS({
            guildID: interaction.guild.id,
            userID: interaction.user.id,
            blacklisted: false,
            expiresAt: new Date(Date.now() + 10 * 1000) // Expire in 10 seconds automatically
        });

        await newCooldownData.save();
    }
}