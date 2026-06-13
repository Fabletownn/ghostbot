const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, LabelBuilder, StringSelectMenuBuilder } = require('discord.js');
const { randomize } = require('../utils/message-utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forum-post')
        .setDescription('(Admin) Creates a post in the specified forum channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('The forum that this post will be created in')
                .addChannelTypes(ChannelType.GuildForum)
                .setRequired(true)
        ),
    async execute(interaction) {
        const forumChannel = interaction.options.getChannel('channel');
        const forumTags = forumChannel.availableTags ?? []; // Return empty array if forum has no tags
        
        // Map out all tags of the forum, if any - otherwise, only give them a 'none' option as
        // posts sometimes cannot be created if a certain forum requires a tag
        const possibleForumTags = [...forumTags.slice(0, 24).map((tag) => ({
                label: tag.name,
                value: tag.id,
                emoji: '🏷️'
            }))]
        
        // Title placeholders
        const titlePlaceholders = ['The Avengers', 'Avengers: Infinity War', 'Avengers: Endgame', 'Avengers: Age of Ultron', 'Captain America: Civil War', 'Thunderbolts*', 'Guardians of the Galaxy', 'The Fantastic 4: First Steps'];
        const randomTitlePlaceholder = randomize(titlePlaceholders);
        
        // Body placeholders
        const rating = Math.floor(Math.random() * 11);
        const reviews = {
            positive: ['This movie was fantastic!', 'Absolutely loved this movie.', 'Absolute cinema!', 'This was a great watch.'],
            negative: ['This movie stunk!', 'DC is better!! (and I stink)', 'Absolute disaster.', 'This movie was a waste of my time.']
        };
        const review = randomize((rating <= 5) ? reviews.negative : reviews.positive);
        const bodyPlaceholder = `${rating}/10 - ${review}`;

        /* Modal Body */
        const postModal = new ModalBuilder()
            .setCustomId(`forum-post-modal:${forumChannel.id}`)
            .setTitle('Create Forum Post')

        /* Post Title */
        const postTitleInput = new TextInputBuilder()
            .setCustomId('forum-post-title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(randomTitlePlaceholder)
            .setMaxLength(100)
            .setRequired(true)

        const postTitleLabel = new LabelBuilder()
            .setLabel('Title')
            .setDescription('The title of the forum post')
            .setTextInputComponent(postTitleInput)

        /* Post Body */
        const postBodyInput = new TextInputBuilder()
            .setCustomId('forum-post-body')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder(bodyPlaceholder)
            .setMaxLength(2000)
            .setRequired(true)

        const postBodyLabel = new LabelBuilder()
            .setLabel('Body')
            .setDescription('The contents of the forum post')
            .setTextInputComponent(postBodyInput)

        /* Post Tags */
        const postTagsInput = new StringSelectMenuBuilder()
            .setCustomId('forum-post-tags')
            .setPlaceholder('Select Tag(s)')
            .addOptions(possibleForumTags)
            .setMinValues(0)
            .setMaxValues(Math.min(forumTags.length, 5))
            .setRequired(false)
        
        const postTagsLabel = new LabelBuilder()
            .setLabel('Forum Tags')
            .setStringSelectMenuComponent(postTagsInput)
        
        // Add modal labels; only add the tags label if the forum selected has tags
        postModal.addLabelComponents(
            postTitleLabel,
            postBodyLabel,
            ...(forumTags.length > 0 ? [postTagsLabel] : [])
        );
        
        await interaction.showModal(postModal);
    },
};