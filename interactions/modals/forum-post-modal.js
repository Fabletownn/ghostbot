const { MessageFlags } = require('discord.js');
const { getChannel } = require('../../utils/fetch-utils.js');
const { pluralize } = require('../../utils/message-utils.js');

module.exports = {
    customId: 'forum-post-modal',

    async execute(interaction) {
        const forumChannelID = interaction.customId.split(':')[1];
        const forumChannel = await getChannel(interaction.guild, forumChannelID);
        
        const forumTitle = interaction.fields.getTextInputValue('forum-post-title');
        const forumBody = interaction.fields.getTextInputValue('forum-post-body');
        let forumTags = [];
        
        // If the modal did not include the tags component (if the forum has no tags), prevent an error
        try {
            forumTags = interaction.fields.getStringSelectValues('forum-post-tags');
        } catch {}
        
        // Attempt to create the forum post
        try {
            const forumPost = await forumChannel?.threads.create({
                name: forumTitle,
                message: {
                    content: forumBody
                },
                appliedTags: forumTags
            });

            await interaction.reply({ content: `Forum post **[${forumTitle}](${forumPost.url})** has been created with ${forumTags.length} applied ${pluralize('tag', forumTags.length)}.`, flags: MessageFlags.Ephemeral });
        
        // Reply with the error if any, as some forums might require 1 tag to be posted and errors are descriptive here
        } catch (err) {
            return interaction.reply({ content: `Something went wrong trying to create that post: **${err.message}**`, flags: MessageFlags.Ephemeral });
        }
    }
}