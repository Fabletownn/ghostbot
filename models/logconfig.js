const mongoose = require('mongoose');

const logConfigSchema = mongoose.Schema({
    guildID: String,
    deletechannel: String,
    editchannel: String,
    usernamechannel: String,
    vcchannel: String,
    chanupchannel: String,
    ignoredchannels: Array,
    ignoredcategories: Array,
    deletewebhook: String,
    editwebhook: String,
    usernamewebhook: String,
    vcwebhook: String,
    chanupwebhook: String
});

module.exports = mongoose.model('logconfig', logConfigSchema);

// This model is meant for bot configuration or turning specific log features off, will be updated everytime a new config is added
// config.js