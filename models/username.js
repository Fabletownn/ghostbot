const mongoose = require('mongoose');

const usernameSchema = mongoose.Schema({
    guildID: String,
    userID: String,
    usernames: Array,
    expireOn: String
});

module.exports = mongoose.model('username', usernameSchema);