/*
    Automatically posts an opening message to created tech support posts
*/
module.exports = async (Discord, client, thread, newlyCreated) => {
    const techSupport = '1082421799578521620';

    const techStarter = '- Check if your issue is already listed in our <#1041125607599243364> threads!\n- Explain your issue in-depth so we can fully assist.\n- Post screenshots, video, or any kind of media that will help us see the problem you\'re experiencing.\n- Post your player-log file, which will help troubleshoot your issue: `%USERPROFILE%\AppData\LocalLow\Kinetic Games\Phasmophobia\Player.log`\n- Having save file corruption issues? DM <@1043623513669513266>!';

    if (newlyCreated) {
        switch (thread.parentId) {
            case techSupport:
                postStarter(thread, techStarter, 1500);
                break;
            default:
                break;
        }
    }
};

function postStarter(thread, starter, delay) {
    setTimeout(() => {
        thread.send({ content: starter }).catch(() => { // If the bot is faster than the author can post the message, retry
            setTimeout(() => thread.send({ content: starter }), (delay + 1500));
        });
    }, delay);
}