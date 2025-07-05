const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const LCONFIG = require('../models/logconfig.js');

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

        const data = await LCONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data
        if (!data) return interaction.reply({ content: 'There is no data set up for the server. Use `/config-setup` first!' });

        switch (configOption) {
            case "ignorecategory": // Ignore Message Logs in Category (Category); ignores a category from getting logged for message logs
                if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                if (data.ignoredcategories.includes(categoryOption.id)) return interaction.reply({ content: 'That category is already being ignored.' });

                data.ignoredcategories.push(categoryOption.id);
                data.save().catch((err) => trailError(err)).then(() => interaction.reply({ content: `Set the <#${categoryOption.id}> category to be omitted from message logs.` }));
                break;
            case "ignorechannel": // Ignore Message Logs in Channel (Channel); ignores a channel from getting logged for message logs
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });
                if (data.ignoredchannels.includes(channelOption.id)) return interaction.reply({ content: 'That channel is already being ignored.' });

                data.ignoredchannels.push(channelOption.id);
                data.save().catch((err) => trailError(err)).then(() => interaction.reply({ content: `Set the <#${channelOption.id}> channel to be omitted from message logs.` }));
                break;
            case "unignorecategory": { // Unignore Message Logs in Category (Category); unignore a category that is ignored from message logs
                if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                if (!data.ignoredcategories.includes(categoryOption.id)) return interaction.reply({ content: 'That category is not being ignored.' });

                const ignoredCategoryIndex = data.ignoredcategories.indexOf(categoryOption.id);

                if (!data.ignoredcategories[ignoredCategoryIndex]) return interaction.reply({ content: 'That category is not being ignored.' });

                data.ignoredcategories.splice(ignoredCategoryIndex, 1);
                data.save().catch((err) => trailError(err)).then(() => interaction.reply({ content: `The <#${categoryOption.id}> category will no longer be omitted from message logs.` }));
                break;
            }
            case "unignorechannel": { // Unignore Message Logs in Channel (Channel); unignore a channel that is ignored from message logs
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });
                if (!data.ignoredchannels.includes(channelOption.id)) return interaction.reply({ content: 'That channel is not being ignored.' });

                const ignoredChannelIndex = data.ignoredchannels.indexOf(channelOption.id);

                if (!data.ignoredchannels[ignoredChannelIndex]) return interaction.reply({ content: 'That channel is not being ignored.' });

                data.ignoredchannels.splice(ignoredChannelIndex, 1);
                data.save().catch((err) => trailError(err)).then(() => interaction.reply({ content: `The <#${channelOption.id}> channel will no longer be omitted from message logs.` }));
                break;
            }
            case "deletedchannel": // Set Deleted Logs Channel (Channel); sets the channel to log deleted messages
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "editedchannel": // Set Edited Logs Channel (Channel); sets the channel to log edited messages
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "usernamechannel": // Set Username Logs Channel (Channel); sets the channel to log username changes
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "vcchannel": // Set Voice Channel Logs Channel (Channel); sets the channel to log VC join/move/leaves
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "updatechannel": // Set Channel Update Logs Channel (Channel); sets the channel to log channel name/perm changes
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            default: // If none of the options were selected, somehow
                interaction.reply({ content: 'That is not a configuration value.' });
                
                break;
        }
    },
};

async function createWebhookButReuseIfPossible(interaction, config, channel) {
    const data = await LCONFIG.findOne({ guildID: interaction.guild.id }); // Get existing log configuration data
    const logChannels = [data.deletechannel, data.editchannel, data.usernamechannel, data.vcchannel, data.chanupchannel]; // Array of log channels
    const logWebhooks = [data.deletewebhook, data.editwebhook, data.usernamewebhook, data.vcwebhook, data.chanupwebhook]; // Array of log webhooks

    let webhookUrl; // URL of a webhook, to be set
    let reused;     // Whether a webhook should be reused

    // If there is no data or existing webhook for the channel yet
    if ((!data) || (!(logChannels.some((lc) => lc === channel.id)))) {
        // Create the webhook and set variables, set to not reused
        await channel.createWebhook({
            name: 'G.H.O.S.T',
            avatar: 'https://i.imgur.com/ejOuza0.png'
        }).then(async (wh) => {
            webhookUrl = wh.url;
            reused = false;
        });
    }

    // Loop through all log channels and check if there is an already existing webhook being used
    logChannels.some((lc) => {
        if (lc === channel.id) {
            const lcIndex = logChannels.indexOf(lc);
            if (lcIndex < 0) return interaction.reply({ content: 'Failed to set the webhook as something went wrong.' });

            const indexedWebhook = logWebhooks[lcIndex];
            if (indexedWebhook === null) return interaction.reply({ content: 'Failed to set the webhook as something went wrong.' });

            // Set the webhook to be reused
            webhookUrl = indexedWebhook;
            reused = true;
        }
    });
    
    await interaction.deferReply();

    switch (config) {
        case "deletedchannel": // Set Deleted Logs Channel (Channel); sets the channel to log deleted messages
            data.deletechannel = channel.id;
            data.deletewebhook = webhookUrl;
            data.save().catch((err) => trailError(err)).then(() => interaction.followUp({ content: `Deleted messages will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "editedchannel": // Set Edited Logs Channel (Channel); sets the channel to log edited messages
            data.editchannel = channel.id;
            data.editwebhook = webhookUrl;
            data.save().catch((err) => trailError(err)).then(() => interaction.followUp({ content: `Edited messages will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "usernamechannel": // Set Username Logs Channel (Channel); sets the channel to log username changes
            data.usernamechannel = channel.id;
            data.usernamewebhook = webhookUrl;
            data.save().catch((err) => trailError(err)).then(() => interaction.followUp({ content: `Username updates will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "vcchannel": // Set Voice Channel Logs Channel (Channel); sets the channel to log VC join/move/leaves
            data.vcchannel = channel.id;
            data.vcwebhook = webhookUrl;
            data.save().catch((err) => trailError(err)).then(() => interaction.followUp({ content: `Voice channel updates will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "updatechannel": // Set Channel Update Logs Channel (Channel); sets the channel to log channel name/perm changes
            data.chanupchannel = channel.id;
            data.chanupwebhook = webhookUrl;
            data.save().catch((err) => trailError(err)).then(() => interaction.followUp({ content: `Channel changes will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        default: // None of the above
            interaction.followUp({ content: 'Failed to save settings as something went wrong.' });
            break;
    }
}