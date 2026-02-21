const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-force-change')
        .setDescription('(Admin) Forces a bot status change')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const sData = await STATUS.findOne({ guildID: interaction.guild.id }); // Get the existing status data

        // If there is no data, simply set the status to a standard one
        if (!sData) {
            await interaction.client.user.setPresence({
                activities: [{
                    name: 'Phasmophobia',
                    type: ActivityType.Playing
                }],
                status: 'online'
            });

            await interaction.reply({ content: 'Force reset the bot\'s status successfully (now `Phasmophobia`).' });
            
        // Cycle through existing data for another status, and set it to the one chosen
        } else if (sData) {
            const statusIndexes = sData.statuses.filter((status) => status !== null);          // Ensure not to grab any nullified values
            const randomize = statusIndexes[Math.floor(Math.random() * statusIndexes.length)];              // Get a random status
            const randomStatus = randomize !== 'Phasmophobia' ? randomize : 'Playing Phasmophobia';     // Default "Phasmophobia" no longer makes sense with user status

            await interaction.client.user.setPresence({
                activities: [
                    { name: 'custom', type: ActivityType.Custom, state: randomStatus },
                ],
            });

            await interaction.reply({ content: `Forcefully cycled the bot's status successfully (now \`${randomStatus}\`).` });
        }
    },
};