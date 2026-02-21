const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { cacheLogConfigData } = require('../utils/data-utils.js');
const { createWebhookButReuseIfPossible } = require('../utils/webhook-utils.js');
const LOG_CONFIG = require('../models/logconfig.js');

// List of log configuration options that will appear in the command list
const configOptions = ([
    { name: 'Ignore Message Logs in Category (Category)', value: 'ignorecategory' },
    { name: 'Ignore Message Logs in Channel (Channel)', value: 'ignorechannel' },
    { name: 'Unignore Message Logs in Category (Category)', value: 'unignorecategory' },
    { name: 'Unignore Message Logs in Channel (Channel)', value: 'unignorechannel' },
    { name: 'Set Deleted Logs Channel (Channel)', value: 'deletedchannel' },
    { name: 'Set Edited Logs Channel (Channel)', value: 'editedchannel' },
    { name: 'Set Username Logs Channel (Channel)', value: 'usernamechannel' },
    { name: 'Set Voice Channel Logs Channel (Channel)', value: 'vcchannel' },
    { name: 'Set Channel Update Logs Channel (Channel)', value: 'updatechannel' }
]);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('log-config-edit')
        .setDescription('(Admin) Edit bot logging configuration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option.setName('config')
                .setDescription('The configuration option that will be edited')
                .addChoices(...configOptions)
                .setRequired(true)
        )
        .addChannelOption((option) =>
            option.setName('category')
                .setDescription('(If configuration requires category) The category that it will be set to')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false)
        )
        .addChannelOption((option) =>
            option.setName('channel')
                .setDescription('(If configuration requires channel) The channel that it will be set to')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildAnnouncement, ChannelType.GuildVoice)
                .setRequired(false)
        ),
    async execute(interaction) {
        const configOption = interaction.options.getString('config');       // Get configuration value to change
        const categoryOption = interaction.options.getChannel('category');  // Category to change for configuration
        const channelOption = interaction.options.getChannel('channel');    // Channel to change for configuration

        if ((!categoryOption) && (!channelOption)) return interaction.reply({ content: 'Please fill out a configuration value depending on what it requires. The option is labeled in parenthesis after the configuration option (e.g. "Ignore Message Logs in Category (Category)" requires "category" option filled out).' });

        const lData = await LOG_CONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data
        if (!lData) return interaction.reply({ content: 'There is no data set up for the server. Use `/config-setup` first!' });

        await interaction.deferReply();

        switch (configOption) {
            case "ignorecategory": // Ignore Message Logs in Category (Category); ignores a category from getting logged for message logs
                if (!categoryOption) return interaction.followUp({ content: 'This configuration value requires a `category` option to be filled out.' });
                if (lData.ignoredcategories.includes(categoryOption.id)) return interaction.followUp({ content: 'That category is already being ignored.' });

                lData.ignoredcategories.push(categoryOption.id);
                await lData.save();
                await interaction.followUp({ content: `Set the <#${categoryOption.id}> category to be omitted from message logs.` });
                break;
            case "ignorechannel": // Ignore Message Logs in Channel (Channel); ignores a channel from getting logged for message logs
                if (!channelOption) return interaction.followUp({ content: 'This configuration value requires a `channel` option to be filled out.' });
                if (lData.ignoredchannels.includes(channelOption.id)) return interaction.followUp({ content: 'That channel is already being ignored.' });

                lData.ignoredchannels.push(channelOption.id);
                await lData.save();
                await interaction.followUp({ content: `Set the <#${channelOption.id}> channel to be omitted from message logs.` });
                break;
            case "unignorecategory": // Unignore Message Logs in Category (Category); unignore a category that is ignored from message logs
                if (!categoryOption) return interaction.followUp({ content: 'This configuration value requires a `category` option to be filled out.' });
                if (!lData.ignoredcategories.includes(categoryOption.id)) return interaction.followUp({ content: 'That category is not being ignored.' });

                const ignoredCategoryIndex = lData.ignoredcategories.indexOf(categoryOption.id);

                if (!lData.ignoredcategories[ignoredCategoryIndex]) return interaction.followUp({ content: 'That category is not being ignored.' });

                lData.ignoredcategories.splice(ignoredCategoryIndex, 1);
                await lData.save();
                await interaction.followUp({ content: `The <#${categoryOption.id}> category will no longer be omitted from message logs.` });
                break;
            case "unignorechannel": // Unignore Message Logs in Channel (Channel); unignore a channel that is ignored from message logs
                if (!channelOption) return interaction.followUp({ content: 'This configuration value requires a `channel` option to be filled out.' });
                if (!lData.ignoredchannels.includes(channelOption.id)) return interaction.followUp({ content: 'That channel is not being ignored.' });

                const ignoredChannelIndex = lData.ignoredchannels.indexOf(channelOption.id);

                if (!lData.ignoredchannels[ignoredChannelIndex]) return interaction.followUp({ content: 'That channel is not being ignored.' });

                lData.ignoredchannels.splice(ignoredChannelIndex, 1);
                await lData.save();
                await interaction.followUp({ content: `The <#${channelOption.id}> channel will no longer be omitted from message logs.` });
                break;
            default:
                if (!channelOption) return interaction.followUp({ content: 'This configuration value requires a `channel` option to be filled out.' });

                const isReused = await createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                await interaction.followUp({ content: `The \`${configOption.toUpperCase()}\` setting is now set to log to the <#${channelOption.id}> channel.\n\n${isReused ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` });
                break;
        }

        // Cache and update the newly updated data everywhere that it's used
        await cacheLogConfigData(interaction.client);
    },
};