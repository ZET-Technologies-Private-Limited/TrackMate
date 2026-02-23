const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

console.log('BOOKING_ROUTES: Initializing...');

// 1. Primary Versioned Route
router.get('/active-requests-v1', protect, async (req, res) => {
    res.setHeader('X-Route-Version', 'V1-Active');
    try {
        const trips = await Trip.find({ driverId: req.user._id });
        const tripIds = trips.map(t => t._id);
        const bookings = await Booking.find({ tripId: { $in: tripIds }, status: 'PENDING' })
            .populate('passengerId', 'name ratingAvg profileImage phone carbonSaved')
            .populate('tripId', 'startPoint endPoint departureTime status')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. Compatibility Aliases
const legacyHandler = async (req, res) => {
    try {
        const trips = await Trip.find({ driverId: req.user._id });
        const tripIds = trips.map(t => t._id);
        const bookings = await Booking.find({ tripId: { $in: tripIds }, status: 'PENDING' })
            .populate('passengerId', 'name ratingAvg profileImage phone carbonSaved')
            .populate('tripId', 'startPoint endPoint departureTime status')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

router.get('/pending-requests', protect, legacyHandler);
router.get('/requests', protect, legacyHandler);

// Request to join a trip
router.post('/request', protect, async (req, res) => {
    try {
        const { tripId, pickupPoint, dropPoint, seatsBooked, fare, paymentMethod, paymentStatus } = req.body;

        const trip = await Trip.findById(tripId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.availableSeats < seatsBooked) return res.status(400).json({ message: 'Not enough seats' });

        const booking = await Booking.create({
            tripId,
            passengerId: req.user._id,
            pickupPoint,
            dropPoint,
            seatsBooked,
            fare,
            paymentMethod: paymentMethod || 'ONLINE',
            paymentStatus: paymentStatus || 'PENDING',
            status: 'PENDING'
        });

        // Populate Driver details for email
        await trip.populate('driverId', 'name email');

        // Notify Driver via Email
        const { sendRideRequestEmail } = require('../utils/emailService');
        sendRideRequestEmail(trip.driverId.email, trip.driverId.name, req.user.name, { ...req.body, endPoint: trip.endPoint });

        // Notify Driver via Socket/DB
        const notificationData = {
            userId: trip.driverId._id,
            type: 'match',
            title: 'New Join Request',
            body: `${req.user.name} wants to join your trip to ${trip.endPoint.address}`,
            refId: trip._id,
            refType: 'TRIP',
            time: 'Just now'
        };
        await Notification.create(notificationData);
        req.io.to(trip.driverId._id.toString()).emit('newNotification', notificationData);

        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Driver accepts/rejects request
router.patch('/:id/status', protect, async (req, res) => {
    const { status } = req.body; // ACCEPTED or REJECTED
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        const trip = await Trip.findById(booking.tripId);
        if (trip.driverId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        booking.status = status;
        await booking.save();

        if (status === 'ACCEPTED') {
            trip.availableSeats -= booking.seatsBooked;
            if (trip.availableSeats === 0) trip.status = 'FULL';
            await trip.save();

            // Populate passenger details for email
            await booking.populate('passengerId', 'name email');

            // Notify Passenger via Email
            const { sendRideAcceptedEmail } = require('../utils/emailService');
            sendRideAcceptedEmail(booking.passengerId.email, booking.passengerId.name, trip);

            // Notify Passenger via Socket/DB
            const notificationData = {
                userId: booking.passengerId._id,
                type: 'match',
                title: 'Ride Accepted!',
                body: `Your request for the ride to ${trip.endPoint.address} was accepted!`,
                refId: trip._id,
                refType: 'TRIP',
                time: 'Just now'
            };
            await Notification.create(notificationData);
            req.io.to(booking.passengerId._id.toString()).emit('newNotification', notificationData);
        } else if (status === 'REJECTED') {
            // Notify Passenger
            const notificationData = {
                userId: booking.passengerId,
                type: 'system',
                title: 'Request Declined',
                body: `Unfortunately, the driver declined your request for the trip to ${trip.endPoint.address}.`,
                refId: trip._id,
                refType: 'TRIP',
                time: 'Just now'
            };
            await Notification.create(notificationData);
            req.io.to(booking.passengerId.toString()).emit('newNotification', notificationData);
        }

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Get my bookings (for Passenger)
router.get('/my-bookings', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ passengerId: req.user._id })
            .populate({
                path: 'tripId',
                populate: { path: 'driverId', select: 'name ratingAvg profileImage phone' }
            })
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all bookings for a specific trip (Driver view)
router.get('/trip/:tripId', protect, async (req, res) => {
    try {
        const bookings = await Booking.find({ tripId: req.params.tripId })
            .populate('passengerId', 'name ratingAvg profileImage phone')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update payment status (Driver collects cash or confirms payment)
router.patch('/:id/payment', protect, async (req, res) => {
    try {
        const { paymentStatus, paymentMethod } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });

        if (paymentStatus) booking.paymentStatus = paymentStatus;
        if (paymentMethod) booking.paymentMethod = paymentMethod;
        await booking.save();

        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
