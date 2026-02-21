const { ChannelType } = require('discord.js');
const PULL = require('../../models/pullrooms.js');

module.exports = async (Discord, client, message) => {
    if (message.author.bot || !message.guild || !message.channel?.parent) return;

    const cData = client.cachedConfig;
    if (!cData) return;

    /*
        Automatically publishes messages posted in announcement channels
        "/config-edit value:Autopublishing (Boolean) boolean:False" disables this
    */
    if (message.channel.type === ChannelType.GuildAnnouncement) {
        if ((message.crosspostable) && (cData.autopublish === true)) {
            await message.crosspost();
        }
    }

    /*
        Used for logging messages sent in pullroom sessions
        "/config-edit value:Pullroom Logs channel:X" changes where this gets sent
    */
    if (message.channel.parent.id === cData.pullcategoryid) {
        const pData = await PULL.findOne({ guildID: message.guild.id, channelID: message.channel.id }); // Get existing pullroom data
        
        // If there is no pullroom with the channel ID existing, don't log anything
        if (!pData) return;

        // Otherwise, save the message sent and send it into the pullroom transcript
        pData.transcript += `[${new Date().toLocaleString().replace(',', '')}] ${message.author.username} (${message.author.id}): ${message.content || '<No Content - File/Sticker>'}\n`;
        pData.save().catch((err) => trailError(err));
    }

    /*
        Automatically creates a thread under messages in suggestion channels
        suggestion-voting, staff-candidate-voting
    */
    const suggestionChannels = ['771924501645754408', '762935209377005569'];

    let threadTitle = message.author.username;
    if (cData.threadcreate === true) {
        if (suggestionChannels.some((chID) => message.channel.id === chID)) {
            switch (message.channel.id) {
                case '771924501645754408':
                    threadTitle += ' - Suggestion Discussion';

                    await createThread(message, threadTitle);
                    break;

                case '762935209377005569':
                    threadTitle += ' - Staff Candidate Discussion';

                    await createThread(message, threadTitle);
                    break;

                default:
                    threadTitle += ' - Discussion';

                    await createThread(message, threadTitle);
                    break;
            }
        }
    }
}

async function createThread(message, title) {
    await message.channel.threads.create({
        startMessage: message.id,
        name: title,
        autoArchiveDuration: 10080,
        reason: 'Created thread automatically as member posted in a suggestion channel (#' + message.channel.name + ')'
    });
}