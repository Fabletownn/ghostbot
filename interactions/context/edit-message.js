const { MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder} = require('discord.js');

module.exports = {
    commandName: 'Edit Ghost Message',

    async execute(interaction) {
        // Prevent this from going through if they try and edit a message not made by the bot
        const messageAuthor = interaction.targetMessage.author;
        if (messageAuthor.id !== interaction.client.user.id) return interaction.reply({ content: 'I cannot edit messages not authored by me!', flags: MessageFlags.Ephemeral });
        
        const messageContent = interaction.targetMessage.content;
        const messageID = interaction.targetMessage.id;
        const channelID = interaction.channel.id;

        /* Modal Body */
        const editModal = new ModalBuilder()
            .setCustomId(`edit-message-modal:${channelID}-${messageID}`)
            .setTitle('Edit Ghost Message')

        /* Message Body */
        const editMessageInput = new TextInputBuilder()
            .setCustomId('edit-message-body')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(messageContent)
            .setMaxLength(2000)
            .setRequired(true)

        const editMessageLabel = new LabelBuilder()
            .setLabel('Message')
            .setDescription('The new content of the message')
            .setTextInputComponent(editMessageInput)
        
        editModal.addLabelComponents(editMessageLabel);
        await interaction.showModal(editModal);
    }
}