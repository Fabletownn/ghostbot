module.exports = async (Discord, client, thread, newlyCreated) => {

    const techSupport = '1027309663357767780';

    if (newlyCreated) {

        switch (thread.parentId) {

            case techSupport:
                thread.send('<@' + thread.ownerId + '> - Someone will assist as soon as anyone is available.\n\n• Please explain the issue you\'re experiencing in-depth, so we can fully assist.\n• Any screenshots, video, or media that can allow us to see the problem will also help, if any.\n• Post your player-log file, which will help us troubleshoot your issue: `%USERPROFILE%\\AppData\\LocalLow\\Kinetic Games\\Phasmophobia\\Player.log`');
                break;

            default:
                break;

        }

    }

};