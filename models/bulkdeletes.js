const mongoose = require('mongoose');

const bulkdeletelogSchema = mongoose.Schema({
    messageID: String,
    log: String,
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // Delete the entry automatically once expired
    }
});

module.exports = mongoose.model('bulkdeletes', bulkdeletelogSchema);

// This model is meant to store every bulk delete that happens in the server so that it can be fetched
// through a logging channel. Each document should expire after 3 months and should be no bigger than 5KB.

// messageDeleteBulk.js