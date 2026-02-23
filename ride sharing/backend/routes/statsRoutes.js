const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Report = require('../models/Report');
const { protect } = require('../middleware/auth');

router.get('/impact', protect, async (req, res) => {
    try {
        const user = req.user;

        let rideCount = 0;
        if (user.role.includes('TRAVELLER')) {
            rideCount = await Trip.countDocuments({ driverId: user._id, status: 'COMPLETED' });
        } else {
            rideCount = await Booking.countDocuments({ passengerId: user._id, status: 'COMPLETED' });
        }

        res.json({
            carbonSaved: user.carbonSaved || 0,
            loyaltyPoints: user.loyaltyPoints || 0,
            rideCredits: user.rideCredits || 0,
            rideCount,
            level: user.level || 'Green Newbie'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Dashboard Stats
router.get('/admin', protect, async (req, res) => {
    try {
        if (!req.user.role.includes('ADMIN')) {
            return res.status(403).json({ message: 'Access denied: Admin only.' });
        }

        const stats = {
            totalTrips: await Trip.countDocuments(),
            totalTravellers: await User.countDocuments({ role: 'TRAVELLER' }),
            totalPassengers: await User.countDocuments({ role: 'PASSENGER' }),
            totalBookings: await Booking.countDocuments({ status: { $in: ['ACCEPTED', 'COMPLETED'] } }),
            activeTrips: await Trip.countDocuments({ status: { $in: ['OPEN', 'ongoing'] } }),
            pendingVerifications: await User.countDocuments({ verificationStatus: 'PENDING' }),
            totalRevenue: 0 // Will calculate if needed
        };

        // Calculate simple total revenue from completed bookings
        const completedBookings = await Booking.find({ status: 'COMPLETED' });
        stats.totalRevenue = completedBookings.reduce((sum, b) => sum + (b.fare || 0), 0);

        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(50);
        const recentTrips = await Trip.find()
            .populate('driverId', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        const recentBookings = await Booking.find()
            .populate('passengerId', 'name email')
            .populate('tripId', 'startPoint endPoint status')
            .sort({ createdAt: -1 })
            .limit(50);

        const recentReports = await Report.find()
            .populate('reporterId', 'name email')
            .populate('accusedId', 'name email')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ stats, recentUsers, recentTrips, recentBookings, recentReports });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
