const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: [String],
        enum: ['TRAVELLER', 'PASSENGER', 'ADMIN'],
        default: ['PASSENGER']
    },

    // Additional Profile Info
    phone: { type: String },
    profileImage: { type: String },
    googleId: { type: String },
    upiId: { type: String },

    // Performance & Gamification
    ratingAvg: { type: Number, default: 5.0 },
    trustScore: { type: Number, default: 100 },

    carbonSaved: { type: Number, default: 0 }, // in grams
    rideCredits: { type: Number, default: 0 }, // Internal Currency
    loyaltyPoints: { type: Number, default: 0 },
    level: { type: String, default: 'Green Newbie' }, // Eco-Level

    // Verification & Vehicle Info (Mainly for Travellers)
    isVerified: { type: Boolean, default: false },
    verificationStatus: {
        type: String,
        enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
        default: 'UNVERIFIED'
    },
    verificationDetails: {
        licenseNumber: String,
        vehiclePlate: String,
        vehicleModel: String,
        documentUrl: String // URL to uploaded image/PDF
    }
}, { timestamps: true });

// Hash password
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
