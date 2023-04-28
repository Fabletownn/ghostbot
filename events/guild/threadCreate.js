module.exports = async (Discord, client, thread, newlyCreated) => {

    const techSupport = '1082421799578521620';

    if (newlyCreated) {

        switch (thread.parentId) {

            case techSupport:

                setTimeout(() => thread.send('<@' + thread.ownerId + '> - Someone will assist as soon as anyone is available.\n\n• Please explain the issue you\'re experiencing in-depth, so we can fully assist.\n• Any screenshots, video, or media that can allow us to see the problem will also help, if any.\n• Post your player-log file, which will help us troubleshoot your issue: `%USERPROFILE%\\AppData\\LocalLow\\Kinetic Games\\Phasmophobia\\Player.log`'), 1500);
                
                break;

            default:
                break;

        }

    }

};