const { SlashCommandBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const STATUS = require('../models/statuses.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot-status-force-change')
        .setDescription('(Admin) Forces a bot status change')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        STATUS.findOne({
            guildID: interaction.guild.id
        }, async (err, data) => {
            if (err) return console.log(err);

            if (!data) {
                await interaction.client.user.setPresence({
                    activities: [{
                        name: 'Phasmophobia',
                        type: ActivityType.Playing
                    }],
                    status: 'online'
                });

                await interaction.reply({ content: 'Force reset the bot\'s status successfully (now `Phasmophobia`).' });
            } else if (data) {
                const statusIndexes = data.statuses.filter((status) => status !== null);
                const randomStatus = statusIndexes[Math.floor(Math.random() * statusIndexes.length)];

                await interaction.client.user.setPresence({
                    activities: [{
                        name: randomStatus || 'Phasmophobia',
                        type: ActivityType.Playing
                    }],
                    status: 'online'
                });

                await interaction.reply({ content: `Force recycled the bot's status successfully (now \`${randomStatus || 'Phasmophobia'}\`).` });
            }
        });
    },
};