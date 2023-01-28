const mongoose = require('mongoose');

const statusSchema = mongoose.Schema({
    guildID: String,
    statuses: Array
});

module.exports = mongoose.model('statuses', statusSchema);