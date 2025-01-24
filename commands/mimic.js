const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mimic')
        .setDescription('(In the channel executed) Prompt a message mimic')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    async execute(interaction) {
        // Array of random first and last names for the placeholder value
        const firstNames = ['Karen', 'Mary', 'Heather', 'Shannon', 'Marcia', 'Robin', 'Tim', 'Donald', 'William', 'Charles', 'Anthony', 'Gregory'];
        const lastNames = ['Brown', 'Williams', 'White', 'Jackson', 'Thompson', 'Garcia', 'Martinez', 'Clarke'];

        const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)]; // Random first name value
        const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];    // Random last name value

        const possiblePlaceholders = ['I like long walks on the beach', 'The Tanglewood mailbox really intrigues me', 'Revenants don\'t scare me', `I got killed by ${randomFirstName} ${randomLastName}`, 'I got killed by Dk\'s pet rock'];
        const randomPlaceholder = possiblePlaceholders[Math.floor(Math.random() * possiblePlaceholders.length)];

        const sayModal = new ModalBuilder()
            .setCustomId('say-modal')
            .setTitle('Mimic Message')
            .addComponents([
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('say-msg')
                        .setLabel('Message Content')
                        .setPlaceholder(randomPlaceholder)
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                        .setMaxLength(1500)
                )
            ]);

        await interaction.showModal(sayModal);
    },
};