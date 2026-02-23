const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startPoint: {
        address: { type: String, required: true },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    endPoint: {
        address: { type: String, required: true },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    departureTime: { type: Date, required: true },
    availableSeats: { type: Number, required: true, min: 0 },
    totalSeats: { type: Number, default: 0 },
    pricePerSeat: { type: Number, required: true },

    // Route Meta
    distance: { type: Number }, // in meters
    duration: { type: Number }, // in seconds
    routePolyline: { type: String },

    status: {
        type: String,
        enum: ['OPEN', 'FULL', 'ongoing', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN'
    },

    // Expenses logic
    expenses: [{
        description: String,
        amount: Number
    }],
    totalExpenses: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
