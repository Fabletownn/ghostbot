const mongoose = require('mongoose');

const configSchema = mongoose.Schema({
    guildID: String,
    prefix: String,
    autopublish: Boolean,
    pbvcid: String,
    pbvclimit: Number,
    pullcategoryid: String,
    pullroleid: String,
    pulllogid: String,
    pullmsg: String
});

module.exports = mongoose.model('config', configSchema);

// This model is meant for bot configuration or turning specific features off, will be updated everytime a new config is added
// config.js