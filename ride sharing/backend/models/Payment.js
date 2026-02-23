const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    provider: { type: String, enum: ['STRIPE', 'RAZORPAY'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['HELD', 'PAID', 'REFUNDED', 'FAILED'], default: 'HELD' },
    transactionId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
