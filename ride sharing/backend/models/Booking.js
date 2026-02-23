const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pickupPoint: {
        address: { type: String },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    dropPoint: {
        address: { type: String },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    seatsBooked: { type: Number, required: true, default: 1 },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'], default: 'PENDING' },
    fare: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['ONLINE', 'CASH'], default: 'ONLINE' },
    paymentStatus: { type: String, enum: ['PENDING', 'HELD', 'PAID', 'REFUNDED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
