require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Trip = require('./models/Trip');
const { matchTrips } = require('./services/matchingService');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    try {
        // Guntur coords (approx)
        const pickupLng = 80.4365, pickupLat = 16.3067;
        // Tenali coords (approx)
        const dropLng = 80.6480, dropLat = 16.2400;

        // Show ALL trips in DB
        const allTrips = await Trip.find({}).populate('driverId', 'name');
        console.log(`\n=== ALL TRIPS IN DB (${allTrips.length}) ===`);
        allTrips.forEach(t => {
            console.log(`  [${t.status}] ${t.startPoint?.address} -> ${t.endPoint?.address}`);
            console.log(`    Start coords: [${t.startPoint?.coordinates}]`);
            console.log(`    End coords:   [${t.endPoint?.coordinates}]`);
            console.log(`    Departure: ${t.departureTime}`);
            console.log(`    Available: ${t.availableSeats} seats, Distance: ${t.distance}`);
        });

        // Show OPEN trips from 12 hours ago
        const pastThresh = new Date(Date.now() - 12 * 60 * 60 * 1000);
        const openTrips = await Trip.find({ status: 'OPEN', departureTime: { $gte: pastThresh }, availableSeats: { $gt: 0 } }).populate('driverId', 'name');
        console.log(`\n=== OPEN TRIPS FROM NOW (${openTrips.length}) ===`);
        openTrips.forEach(t => {
            console.log(`  ${t.startPoint?.address} -> ${t.endPoint?.address}`);
        });

        // Run matching
        console.log(`\n=== MATCHING: pickup[${pickupLng},${pickupLat}] → drop[${dropLng},${dropLat}] radius=50km ===`);
        const matched = matchTrips(openTrips, [pickupLng, pickupLat], [dropLng, dropLat], 50);
        console.log(`Matched: ${matched.length} trips`);

        // Show distances for each trip
        const { getDistanceFromLatLonInKm } = require('./services/matchingService');
        console.log('\n=== DISTANCE BREAKDOWN for each OPEN trip ===');
        openTrips.forEach(t => {
            const [sLng, sLat] = t.startPoint?.coordinates || [0, 0];
            const [eLng, eLat] = t.endPoint?.coordinates || [0, 0];
            // Simple haversine inline
            const R = 6371;
            const dLat1 = (sLat - pickupLat) * Math.PI / 180;
            const dLon1 = (sLng - pickupLng) * Math.PI / 180;
            const a1 = Math.sin(dLat1 / 2) ** 2 + Math.cos(pickupLat * Math.PI / 180) * Math.cos(sLat * Math.PI / 180) * Math.sin(dLon1 / 2) ** 2;
            const d1 = R * 2 * Math.atan2(Math.sqrt(a1), Math.sqrt(1 - a1));

            const dLat2 = (eLat - dropLat) * Math.PI / 180;
            const dLon2 = (eLng - dropLng) * Math.PI / 180;
            const a2 = Math.sin(dLat2 / 2) ** 2 + Math.cos(dropLat * Math.PI / 180) * Math.cos(eLat * Math.PI / 180) * Math.sin(dLon2 / 2) ** 2;
            const d2 = R * 2 * Math.atan2(Math.sqrt(a2), Math.sqrt(1 - a2));

            console.log(`  Trip: ${t.startPoint?.address?.split(',')[0]} → ${t.endPoint?.address?.split(',')[0]}`);
            console.log(`    pickup→tripStart: ${d1.toFixed(1)}km | drop→tripEnd: ${d2.toFixed(1)}km`);
        });

    } catch (e) {
        console.error('ERROR:', e.message);
        console.error(e.stack);
    }
    process.exit(0);
}).catch(e => { console.error('DB:', e.message); process.exit(1); });
