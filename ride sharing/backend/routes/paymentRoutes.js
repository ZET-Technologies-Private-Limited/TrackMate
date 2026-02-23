const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// Get payment history
router.get('/history', protect, async (req, res) => {
    try {
        // Simple implementation: Fetch bookings with payments
        const bookings = await Booking.find({
            $or: [{ passengerId: req.user._id }, { tripId: { $in: await getDriverTripIds(req.user._id) } }],
            paymentStatus: { $ne: 'PENDING' }
        }).populate('tripId', 'startPoint endPoint departureTime');

        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

async function getDriverTripIds(userId) {
    const Trip = require('../models/Trip');
    const trips = await Trip.find({ driverId: userId });
    return trips.map(t => t._id);
}

module.exports = router;
