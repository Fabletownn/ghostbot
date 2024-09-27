const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const LCONFIG = require('../models/logconfig.js');

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
        const configOption = interaction.options.getString('config');

        const categoryOption = interaction.options.getChannel('category');
        const channelOption = interaction.options.getChannel('channel');

        if (!categoryOption && !channelOption) return interaction.reply({ content: 'Please fill out a configuration value depending on what it requires. The option is labeled in parenthesis after the configuration option (e.g. "Ignore Message Logs in Category (Category)" requires "category" option filled out).' });

        const data = await LCONFIG.findOne({
            guildID: interaction.guild.id
        });

        if (!data) return interaction.reply({ content: 'There is no data set up for the server. Use `/config-setup` first!' });

        switch (configOption) {
            case "ignorecategory":
                if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                if (data.ignoredcategories.includes(categoryOption.id)) return interaction.reply({ content: 'That category is already being ignored.' });

                data.ignoredcategories.push(categoryOption.id);
                data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Set the <#${categoryOption.id}> category to be omitted from message logs.` }));
                break;
            case "ignorechannel":
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });
                if (data.ignoredchannels.includes(channelOption.id)) return interaction.reply({ content: 'That channel is already being ignored.' });

                data.ignoredchannels.push(channelOption.id);
                data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `Set the <#${channelOption.id}> channel to be omitted from message logs.` }));
                break;
            case "unignorecategory": {
                if (!categoryOption) return interaction.reply({ content: 'This configuration value requires a `category` option to be filled out.' });
                if (!data.ignoredcategories.includes(categoryOption.id)) return interaction.reply({ content: 'That category is not being ignored.' });

                const ignoredCategoryIndex = data.ignoredcategories.indexOf(categoryOption.id);

                if (!data.ignoredcategories[ignoredCategoryIndex]) return interaction.reply({ content: 'That category is not being ignored.' });

                data.ignoredcategories.splice(ignoredCategoryIndex, 1);
                data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `The <#${categoryOption.id}> category will no longer be omitted from message logs.` }));
                break;
            }
            case "unignorechannel": {
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });
                if (!data.ignoredchannels.includes(channelOption.id)) return interaction.reply({ content: 'That channel is not being ignored.' });

                const ignoredChannelIndex = data.ignoredchannels.indexOf(channelOption.id);

                if (!data.ignoredchannels[ignoredChannelIndex]) return interaction.reply({ content: 'That channel is not being ignored.' });

                data.ignoredchannels.splice(ignoredChannelIndex, 1);
                data.save().catch((err) => console.log(err)).then(() => interaction.reply({ content: `The <#${channelOption.id}> channel will no longer be omitted from message logs.` }));
                break;
            }
            case "deletedchannel":
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "editedchannel":
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "usernamechannel":
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "vcchannel":
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            case "updatechannel":
                if (!channelOption) return interaction.reply({ content: 'This configuration value requires a `channel` option to be filled out.' });

                createWebhookButReuseIfPossible(interaction, configOption, channelOption);
                break;
            default:
                break;
        }
    },
};

async function createWebhookButReuseIfPossible(interaction, config, channel) {
    const data = await LCONFIG.findOne({
        guildID: interaction.guild.id
    });

    const logChannels = [data.deletechannel, data.editchannel, data.usernamechannel, data.vcchannel, data.chanupchannel];
    const logWebhooks = [data.deletewebhook, data.editwebhook, data.usernamewebhook, data.vcwebhook, data.chanupwebhook];

    let webhookUrl;
    let reused;

    if ((!data) || (!(logChannels.some((lc) => lc === channel.id)))) {
        await channel.createWebhook({
            name: 'G.H.O.S.T',
            avatar: 'https://i.imgur.com/ejOuza0.png'
        }).then(async (wh) => {
            webhookUrl = wh.url;
            reused = false;
        });
    }

    logChannels.some((lc) => {
        if (lc === channel.id) {
            const lcIndex = logChannels.indexOf(lc);
            if (lcIndex < 0) return interaction.reply({ content: 'Failed to set the webhook as something went wrong.' });

            const indexedWebhook = logWebhooks[lcIndex];
            if (indexedWebhook === null) return interaction.reply({ content: 'Failed to set the webhook as something went wrong.' });

            webhookUrl = indexedWebhook;
            reused = true;
        }
    });

    await interaction.deferReply();

    switch (config) {
        case "deletedchannel":
            data.deletechannel = channel.id;
            data.deletewebhook = webhookUrl;
            data.save().catch((err) => console.log(err)).then(() => interaction.followUp({ content: `Deleted messages will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "editedchannel":
            data.editchannel = channel.id;
            data.editwebhook = webhookUrl;
            data.save().catch((err) => console.log(err)).then(() => interaction.followUp({ content: `Edited messages will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "usernamechannel":
            data.usernamechannel = channel.id;
            data.usernamewebhook = webhookUrl;
            data.save().catch((err) => console.log(err)).then(() => interaction.followUp({ content: `Username updates will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "vcchannel":
            data.vcchannel = channel.id;
            data.vcwebhook = webhookUrl;
            data.save().catch((err) => console.log(err)).then(() => interaction.followUp({ content: `Voice channel updates will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        case "updatechannel":
            data.chanupchannel = channel.id;
            data.chanupwebhook = webhookUrl;
            data.save().catch((err) => console.log(err)).then(() => interaction.followUp({ content: `Channel changes will now log to the <#${channel.id}> channel.\n\n${(reused === true) ? 'This channel is occupied by another logged event, therefore the webhook used to post these will be reused.' : 'A new webhook has been created to post the logs for this event.'}` }));
            break;
        default:
            interaction.followUp({ content: 'Failed to save settings as something went wrong.' });
            break;
    }
}