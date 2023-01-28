const mongoose = require('mongoose');

const configSchema = mongoose.Schema({
    guildID: String,
    prefix: String,
    autopublish: Boolean,
    pbvcid: String,
    pbvclimit: Number
});

module.exports = mongoose.model('config', configSchema);