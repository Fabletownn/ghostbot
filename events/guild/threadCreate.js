/*
    Automatically posts an opening message to created tech support posts
*/
module.exports = async (Discord, client, thread, newlyCreated) => {
    if (newlyCreated) {
        const techSupport = '1082421799578521620';
        const vrTechSupport = '1020011442205900870';
        const techStarter = '- Check if your issue is already listed in our <#1041125607599243364> threads!\n- Explain your issue in-depth so we can fully assist.\n- Post screenshots, video, or any kind of media that will help us see the problem you\'re experiencing.\n- Post your player-log file, which will help troubleshoot your issue: `%USERPROFILE%\\AppData\\LocalLow\\Kinetic Games\\Phasmophobia\\Player.log`\\n- Having save file corruption issues? DM <@1043623513669513266>!';

        switch (thread.parentId) {
            case techSupport:
                postStarter(thread, techStarter, 1500, 3);
                break;
            case vrTechSupport:
                postStarter(thread, techStarter, 1500, 3);
                break;
            default:
                break;
        }
    }
};

// Attempts to post a thread starter message; if it's too fast and tries to post before the author
// can, it'll retry X amount of times before not trying again
async function postStarter(thread, starter, delay, retry) {
    try {
        await new Promise((resolve) => setTimeout(resolve, delay));
        await thread.send({ content: starter });
    } catch (err) {
        if (retry > 0) {
            postStarter(thread, starter, (delay + 1500), (retry - 1));
        }
    }
}