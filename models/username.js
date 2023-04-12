const mongoose = require('mongoose');

const usernameSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    usernames: Array,
    expireOn: String
});

module.exports = mongoose.model('username', usernameSchema);

// This model is meant to members changing their username for moderation purposes, and removes it after 1 week
// messageCreate.js, d_names.js