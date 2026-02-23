const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['match', 'payment', 'impact', 'system', 'message'],
        default: 'system'
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    refId: { type: mongoose.Schema.Types.ObjectId }, // e.g., Trip ID or Booking ID
    refType: { type: String, enum: ['TRIP', 'BOOKING'] },
    time: { type: String, default: Date.now } // or use createdAt
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
