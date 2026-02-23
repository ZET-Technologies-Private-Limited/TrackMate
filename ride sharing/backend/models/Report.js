const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    accusedId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['HARASSMENT', 'NO_SHOW', 'FRAUD', 'OTHER'], required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'REVIEWED', 'CLOSED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
