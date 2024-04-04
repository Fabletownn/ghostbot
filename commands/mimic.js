const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mimic')
        .setDescription('(Staff) (In the channel executed) Prompt a message mimic')
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionFlagsBits.DeafenMembers),
    async execute(interaction) {
        const sayModal = new ModalBuilder()
            .setCustomId('say-modal')
            .setTitle('Mimic Message')
            .addComponents([
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('say-msg')
                        .setLabel('Message Content')
                        .setPlaceholder('Jace\'s microwave will soon take over')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(1500)
                )
            ]);

        await interaction.showModal(sayModal);
    },
};