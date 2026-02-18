const { MessageFlags } = require('discord.js');

module.exports = {
    customId: 'setup-cancel',

    async execute(interaction) {
        try {
            await interaction.update({ content: 'Data will not be reset for the server.', components: [] });
        } catch (error) {
            trailError(error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred trying to cancel server data reset.', flags: MessageFlags.Ephemeral });
            }
        }
    }
}