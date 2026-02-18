const { MessageFlags } = require('discord.js');
const { MET } = require('bing-translate-api');

module.exports = {
    commandName: 'Translate Message',

    async execute(interaction) {
        try {
            let translatedMessage = interaction.targetMessage.content;
            if (!translatedMessage) return interaction.reply({ content: 'The selected message has no content to translate.', flags: MessageFlags.Ephemeral });

            await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // Defer reply, as this will probably take a while

            // If there is an embed in the message, translate the value of its first field
            if (interaction.targetMessage.embeds.length > 0)  {
                if (interaction.targetMessage.embeds[0].fields[0]) {
                    const fieldValue = interaction.targetMessage.embeds[0].fields[0].value;

                    if (fieldValue) translatedMessage = fieldValue;
                } else if (interaction.targetMessage.embeds[0].description) {
                    const descValue = interaction.targetMessage.embeds[0].description;

                    if (descValue) translatedMessage = descValue;
                }
            }

            // Send a request to translate the message to English
            const translation = await MET.translate(translatedMessage, null, 'en');
            const detectedLanguage = translation[0].detectedLanguage.language; // The language that the original message is in
            const translatedContent = translation[0].translations[0].text;     // The translated content of the message selected
            
            // Check to see if the message is already in English
            if (detectedLanguage === 'en') return interaction.followUp({ content: 'The selected message is already in English. Translations are only provided for messages in other languages.',  flags: MessageFlags.Ephemeral });
            
            // Return the translated content
            await interaction.followUp({ content: `**Detected Language**: \`${detectedLanguage.toUpperCase()}\`\n**Translated Content**: \`${translatedContent}\``, flags: MessageFlags.Ephemeral });
        } catch (error) {
            trailError(error);

            if (!interaction.replied && !interaction.deferred)
                await interaction.reply({ content: 'An error occurred trying to translate that message.', flags: MessageFlags.Ephemeral });
            else
                await interaction.followUp({ content: 'An error occurred trying to translate that message.', flags: MessageFlags.Ephemeral });
        }
    }
}