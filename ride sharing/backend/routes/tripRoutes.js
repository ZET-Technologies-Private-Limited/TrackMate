const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');
const { matchTrips } = require('../services/matchingService');
const { processCarbonConversion } = require('../services/carbonService');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const { getDistanceAndDuration, getPolyline, searchLocations } = require('../utils/googleMaps');

// Search location suggestions (Proxied to avoid CORS/429)
router.get('/search-location', async (req, res) => {
    try {
        const { q, lat, lon } = req.query;
        const results = await searchLocations(q, lat, lon);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Preview route details (Distance, Duration, Polyline)
router.get('/route-info', async (req, res) => {
    try {
        const { pickupLat, pickupLng, dropLat, dropLng } = req.query;
        if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
            return res.status(400).json({ message: 'Missing coordinates' });
        }

        const origin = `${pickupLat},${pickupLng}`;
        const destination = `${dropLat},${dropLng}`;

        const [routeMeta, routePolyline] = await Promise.all([
            getDistanceAndDuration(origin, destination),
            getPolyline(origin, destination)
        ]);

        res.json({
            distance: routeMeta?.distanceText || '0 km',
            duration: routeMeta?.durationText || '0 mins',
            polyline: routePolyline || ''
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all trips (for discovery section)
router.get('/', async (req, res) => {
    try {
        const trips = await Trip.find({
            status: 'OPEN',
            departureTime: { $gt: new Date() }
        })
            .populate('driverId', 'name ratingAvg profileImage')
            .sort({ departureTime: 1 });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a trip (Driver)
router.post('/', protect, async (req, res) => {
    // Only Travellers can publish rides
    if (!req.user.role.includes('TRAVELLER')) {
        return res.status(403).json({ message: 'Only Travellers can publish a ride' });
    }

    try {
        console.log('1. Trip Creation Started');
        const { startPoint, endPoint } = req.body;

        if (!startPoint || !endPoint || !startPoint.coordinates || !endPoint.coordinates) {
            return res.status(400).json({ message: 'Pickup and Drop-off locations are required with coordinates' });
        }

        const origin = `${startPoint.coordinates[1]},${startPoint.coordinates[0]}`;
        const destination = `${endPoint.coordinates[1]},${endPoint.coordinates[0]}`;

        console.log('2. Requesting Google Maps Data...');

        const [routeMeta, routePolyline] = await Promise.all([
            getDistanceAndDuration(origin, destination),
            getPolyline(origin, destination)
        ]);

        console.log('3. Data Received, creating trip in DB...');
        const tripData = {
            ...req.body,
            driverId: req.user._id,
            distance: routeMeta?.distanceValue || 0,
            duration: routeMeta?.durationValue || 0,
            routePolyline: routePolyline || req.body.routePolyline || 'NO_PATH',
            totalSeats: req.body.availableSeats // Store initial seats as total
        };

        const trip = await Trip.create(tripData);

        // Notify all passengers about the new trip
        req.io.emit('newTripCreated', trip);

        console.log('4. Trip Created Successfully:', trip._id);
        res.status(201).json(trip);
    } catch (error) {
        console.error('SERVER ERROR AT TRIP CREATION:', error);

        if (error.name === 'ValidationError') {
            console.error('VALIDATION_ERROR:', error.errors);
            return res.status(400).json({ message: Object.values(error.errors).map(val => val.message).join(', ') });
        }

        res.status(500).json({ message: error.message || 'Unknown Server Error' });
    }
});

// Search trips (Only for Passengers)
router.get('/search', protect, async (req, res) => {
    if (!req.user.role.includes('PASSENGER')) {
        return res.status(403).json({ message: 'Only Passengers can search for rides' });
    }
    const { pickupLng, pickupLat, dropLng, dropLat, date, maxDistance = 25 } = req.query;

    try {
        // Build date filter — only show trips from now onwards (strictly remove expired)
        const now = new Date();
        const dateFilter = date && !isNaN(new Date(date))
            ? { $gte: new Date(Math.max(new Date(date), now)) }
            : { $gte: now };

        // Fetch all OPEN trips from now onwards
        const trips = await Trip.find({
            status: 'OPEN',
            departureTime: dateFilter,
            availableSeats: { $gt: 0 }
        }).populate('driverId', 'name ratingAvg profileImage phone upiId');

        console.log(`[SEARCH] DB returned ${trips.length} OPEN trips`);
        console.log(`[SEARCH] Query params:`, req.query);
        console.log(`[SEARCH] Date filter:`, dateFilter);
        console.log(`[SEARCH] Matching pickup: [${pickupLng}, ${pickupLat}] drop: [${dropLng}, ${dropLat}] radius: ${maxDistance}km`);

        // Apply geospatial matching
        const matchedTrips = matchTrips(
            trips,
            [parseFloat(pickupLng), parseFloat(pickupLat)],
            [parseFloat(dropLng), parseFloat(dropLat)],
            parseFloat(maxDistance)
        );

        console.log(`[SEARCH] Matched ${matchedTrips.length} trips after geospatial filter`);

        res.json(matchedTrips);
    } catch (error) {
        console.error('[SEARCH] Error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get my trips (for Traveller) - MOVED UP to avoid conflict with /:id
router.get('/my-trips', protect, async (req, res) => {
    if (!req.user.role.includes('TRAVELLER')) {
        return res.status(403).json({ message: 'Only Travellers can view their published rides' });
    }
    try {
        const trips = await Trip.find({ driverId: req.user._id }).sort({ departureTime: -1 });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get trip details
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ message: 'Invalid Trip ID format' });
        }

        const trip = await Trip.findById(req.params.id).populate('driverId', 'name ratingAvg profileImage phone');
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Complete a trip and award carbon credits
router.patch('/:id/complete', protect, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        // Only driver can complete the trip
        if (trip.driverId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only driver can complete the trip' });
        }

        // Mark trip completed — use updateOne to bypass full doc validation
        // (legacy trips may be missing fields added later like totalSeats)
        await Trip.updateOne(
            { _id: trip._id },
            { $set: { status: 'COMPLETED' } }
        );
        trip.status = 'COMPLETED'; // keep local ref in sync
        console.log('[COMPLETE] Trip marked COMPLETED:', trip._id);

        // Helper — safely emit via socket (won't crash if io not ready)
        const safeEmit = (roomId, event, data) => {
            try {
                if (req.io) req.io.to(roomId.toString()).emit(event, data);
            } catch (e) {
                console.warn('[COMPLETE] Socket emit failed:', e.message);
            }
        };

        // 1. Award Driver
        try {
            const driverImpact = await processCarbonConversion(trip.driverId, trip.distance || 5000, true);
            const driverNotif = {
                userId: trip.driverId,
                type: 'impact',
                title: 'Mission Complete!',
                body: `You earned ${driverImpact.creditsEarned} credits saving ${driverImpact.carbonSaved}g CO2!`,
                refId: trip._id,
                refType: 'TRIP',
                time: 'Just now'
            };
            await Notification.create(driverNotif);
            safeEmit(trip.driverId, 'newNotification', driverNotif);
            console.log('[COMPLETE] Driver notified:', trip.driverId);
        } catch (err) {
            console.error('[COMPLETE] Driver award error (non-fatal):', err.message);
        }

        // 2. Award Passengers & Update Bookings
        try {
            const bookings = await Booking.find({ tripId: trip._id, status: 'ACCEPTED' });
            console.log('[COMPLETE] Processing', bookings.length, 'passenger bookings');

            for (const booking of bookings) {
                try {
                    await Booking.updateOne(
                        { _id: booking._id },
                        { $set: { status: 'COMPLETED' } }
                    );
                    booking.status = 'COMPLETED';

                    const passengerImpact = await processCarbonConversion(
                        booking.passengerId,
                        trip.distance || 0,
                        false
                    );
                    const passengerNotif = {
                        userId: booking.passengerId,
                        type: 'impact',
                        title: 'Ride Completed!',
                        body: `You earned ${passengerImpact.creditsEarned} credits! Please settle your payment.`,
                        refId: trip._id,
                        refType: 'TRIP',
                        time: 'Just now'
                    };
                    await Notification.create(passengerNotif);
                    safeEmit(booking.passengerId, 'newNotification', passengerNotif);
                    console.log('[COMPLETE] Passenger notified:', booking.passengerId);
                } catch (err) {
                    console.error('[COMPLETE] Passenger booking error (non-fatal):', err.message);
                }
            }
        } catch (err) {
            console.error('[COMPLETE] Passenger loop error (non-fatal):', err.message);
        }

        res.json({ message: 'Mission terminated. Credits awarded.', trip });
    } catch (error) {
        console.error('[COMPLETE] FATAL ERROR:', error);
        res.status(500).json({ message: error.message || 'Failed to complete trip' });
    }
});

// Add an expense to a trip
router.post('/:id/expenses', protect, async (req, res) => {
    try {
        const { description, amount } = req.body;
        const trip = await Trip.findById(req.params.id);

        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        if (trip.driverId.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only driver can add expenses' });
        }

        trip.expenses.push({ description, amount });
        trip.totalExpenses = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        await trip.save();

        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
