const mongoose = require('mongoose');

const kickSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    username: String
});

module.exports = mongoose.model('kicks', kickSchema);

// This model is meant to track members kicked for their inappropriate profile pictures, and alerts in a channel when they rejoin so staff can check if it's changed
// messageCreate.js & guildMemberAdd.js