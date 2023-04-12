const mongoose = require('mongoose');

const statusSchema = mongoose.Schema({
    guildID: String,
    statuses: Array
});

module.exports = mongoose.model('statuses', statusSchema);

// This model is meant to keep all staff fun bot statuses in one place, and randomly pick from them every hour
// ready.js & c_status.js