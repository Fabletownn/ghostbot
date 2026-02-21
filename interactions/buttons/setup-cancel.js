module.exports = {
    customId: 'setup-cancel',

    async execute(interaction) {
        await interaction.update({ content: 'Data will not be reset for the server.', components: [] });
    }
}