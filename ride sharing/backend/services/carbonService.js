const User = require('../models/User');

const CARBON_EMISSION_PER_KM_GAS_CAR = 120; // grams per passenger-km (average)
const CARBON_EMISSION_PER_KM_EV = 0; // Assuming zero tailpipe for EV
const POOL_EFFICIENCY_FACTOR = 0.6; // 40% reduction per shared seat
const CREDITS_PER_KG_CO2 = 10;
const POINTS_PER_KM = 5;

const processCarbonConversion = async (userId, distanceInMeters, isDriver = false) => {
    try {
        const user = await User.findById(userId);
        if (!user) return { carbonSaved: 0, creditsEarned: 0 };

        const distanceKm = distanceInMeters / 1000;

        // Calculate Carbon Saved (vs solo driving)
        // Solo drive: 120g/km * dist
        // Shared drive: (120g/km * dist) * efficiency
        // Impact = Solo - Shared
        const benchmarkCarbon = distanceKm * CARBON_EMISSION_PER_KM_GAS_CAR;
        const actualCarbon = distanceKm * CARBON_EMISSION_PER_KM_GAS_CAR * POOL_EFFICIENCY_FACTOR;
        const carbonSaved = Math.max(0, benchmarkCarbon - actualCarbon); // in grams

        // Calculate Attributes
        const newCredits = Math.round((carbonSaved / 1000) * CREDITS_PER_KG_CO2);
        const newPoints = Math.round(distanceKm * POINTS_PER_KM);

        // Update User
        user.carbonSaved += carbonSaved;
        user.rideCredits += newCredits;
        user.loyaltyPoints += newPoints;

        // Update Level
        if (user.loyaltyPoints > 5000) user.level = 'Eco-Warrior';
        else if (user.loyaltyPoints > 2000) user.level = 'Green Commuter';
        else if (user.loyaltyPoints > 500) user.level = 'Rookie Saver';

        await user.save();

        return {
            carbonSaved: Math.round(carbonSaved),
            creditsEarned: newCredits
        };
    } catch (error) {
        console.error('Carbon conversion error:', error);
        return { carbonSaved: 0, creditsEarned: 0 };
    }
};

module.exports = { processCarbonConversion };
