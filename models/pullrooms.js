const mongoose = require('mongoose');

const pullSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    userTag: String,
    channelID: String,
    roomName: String,
    transcript: String
});

module.exports = mongoose.model('pullroom', pullSchema);

// This model is meant to keep information on pullrooms, such as who opened one, and the channel so the bot knows which one to delete when it is closed
// pull.js, unpull.js, messageCreate.js