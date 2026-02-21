const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mimic') // It was difficult to put the pieces together
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

        const mimicModal = new ModalBuilder()
            .setCustomId('mimic-modal')
            .setTitle('Mimic Message')
        
        const messageInput = new TextInputBuilder()
            .setCustomId('mimic-msg')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(randomPlaceholder)
            .setRequired(true)
        
        const messageLabel = new LabelBuilder()
            .setLabel('Message')
            .setDescription('The message to send through the bot')
            .setTextInputComponent(messageInput)

        mimicModal.addLabelComponents(messageLabel);
        await interaction.showModal(mimicModal);
    },
};