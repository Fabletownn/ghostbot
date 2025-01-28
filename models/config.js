const mongoose = require('mongoose');

const configSchema = mongoose.Schema({
    guildID: String,
    autopublish: Boolean,
    threadcreate: Boolean,
    tagapply: Boolean,
    pbvcid: String,
    pbvclimit: Number,
    pullcategoryid: String,
    pullroleid: String,
    pulllogid: String,
    pullmsg: String
});

module.exports = mongoose.model('config', configSchema);

// This model is meant for bot configuration or turning specific features off, will be updated everytime a new config is added
// config-setup.js, config-edit.js, interactionCreate.js