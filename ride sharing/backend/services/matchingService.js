const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const deg2rad = (deg) => deg * (Math.PI / 180);

// Check if a point is "on the way" between two points (within a corridor)
// This allows pickups/dropoffs mid-route, not just at start/end
const isOnTheWay = (tripStartLat, tripStartLng, tripEndLat, tripEndLng, pointLat, pointLng, corridorKm = 15) => {
    // Project the point onto the straight line between trip start and end
    // Use the sum-of-segments trick: dist(start→point) + dist(point→end) ≈ dist(start→end) if on the line
    const totalDist = getDistanceFromLatLonInKm(tripStartLat, tripStartLng, tripEndLat, tripEndLng);
    const distToStart = getDistanceFromLatLonInKm(tripStartLat, tripStartLng, pointLat, pointLng);
    const distToEnd = getDistanceFromLatLonInKm(pointLat, pointLng, tripEndLat, tripEndLng);

    // If sumOfLegs ≈ totalDist, point lies on or near the route
    const deviation = (distToStart + distToEnd) - totalDist;
    return deviation <= corridorKm;
};

const matchTrips = (trips, pickupCoords, dropCoords, maxDistanceKm = 25) => {
    // pickupCoords: [lng, lat]
    // dropCoords: [lng, lat]
    const [pickupLng, pickupLat] = pickupCoords;
    const [dropLng, dropLat] = dropCoords;

    return trips.filter(trip => {
        const [tripStartLng, tripStartLat] = trip.startPoint.coordinates; // [lng, lat]
        const [tripEndLng, tripEndLat] = trip.endPoint.coordinates;

        // 1. Pickup must be within maxDistanceKm of the trip's start point
        const distToPickup = getDistanceFromLatLonInKm(
            pickupLat, pickupLng,
            tripStartLat, tripStartLng
        );

        // 2. Drop must be within maxDistanceKm of the trip's end point
        const distToDrop = getDistanceFromLatLonInKm(
            dropLat, dropLng,
            tripEndLat, tripEndLng
        );

        // 3. OR: pickup/drop is within a wider corridor of the route (mid-route pickups)
        const pickupOnWay = isOnTheWay(tripStartLat, tripStartLng, tripEndLat, tripEndLng, pickupLat, pickupLng, maxDistanceKm * 2);
        const dropOnWay = isOnTheWay(tripStartLat, tripStartLng, tripEndLat, tripEndLng, dropLat, dropLng, maxDistanceKm * 2);

        // Match if: (pickup near start AND drop near end) OR (both are on the route corridor)
        const strictMatch = distToPickup <= maxDistanceKm && distToDrop <= maxDistanceKm;
        const corridorMatch = pickupOnWay && dropOnWay;

        // Ensure drop is "after" pickup in the direction of travel (no backwards bookings)
        const passengerDirection = getDistanceFromLatLonInKm(pickupLat, pickupLng, tripEndLat, tripEndLng);
        const isForwardDirection = passengerDirection < getDistanceFromLatLonInKm(dropLat, dropLng, tripStartLat, tripStartLng) + 5;

        return (strictMatch || corridorMatch) && isForwardDirection;
    });
};

module.exports = { matchTrips };
