const axios = require('axios');

// ─────────────────────────────────────────────────────────────────
// Haversine straight-line distance — last resort
// ─────────────────────────────────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDuration = (seconds) => {
    const totalMin = Math.round(seconds / 60);
    if (totalMin >= 60) {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    }
    return `${totalMin} min`;
};

// ─────────────────────────────────────────────────────────────────
// OSRM — tries multiple public servers for reliability
// Works for every location on Earth
// ─────────────────────────────────────────────────────────────────
const OSRM_SERVERS = [
    'https://router.project-osrm.org',
    'https://routing.openstreetmap.de/routed-car',
];

const getOsrmDistance = async (oLat, oLng, dLat, dLng) => {
    for (const server of OSRM_SERVERS) {
        try {
            const url = `${server}/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false`;
            const { data } = await axios.get(url, { timeout: 10000 });
            if (data.code === 'Ok' && data.routes?.[0]) {
                const { distance, duration } = data.routes[0];
                return {
                    distanceValue: Math.round(distance),
                    distanceText: `${(distance / 1000).toFixed(1)} km`,
                    durationValue: Math.round(duration),
                    durationText: formatDuration(duration),
                };
            }
        } catch (err) {
            console.warn(`[OSRM][${server}] failed:`, err.message);
        }
    }
    throw new Error('All OSRM servers failed');
};

const getOsrmPolyline = async (oLat, oLng, dLat, dLng) => {
    for (const server of OSRM_SERVERS) {
        try {
            const url = `${server}/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=polyline`;
            const { data } = await axios.get(url, { timeout: 10000 });
            if (data.code === 'Ok' && data.routes?.[0]) {
                return data.routes[0].geometry;
            }
        } catch (err) {
            console.warn(`[OSRM Poly][${server}] failed:`, err.message);
        }
    }
    throw new Error('All OSRM servers failed for polyline');
};

// ─────────────────────────────────────────────────────────────────
// getDistanceAndDuration
// Priority: Google → OSRM (multi-server) → Haversine estimate
// Works for EVERY location on Earth
// ─────────────────────────────────────────────────────────────────
const getDistanceAndDuration = async (origin, destination) => {
    const [oLat, oLng] = origin.split(',').map(Number);
    const [dLat, dLng] = destination.split(',').map(Number);

    // ── 1. Google Distance Matrix (driving + real-time traffic) ──
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
        try {
            const departureTime = Math.floor(Date.now() / 1000); // unix seconds
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json` +
                `?origins=${encodeURIComponent(origin)}` +
                `&destinations=${encodeURIComponent(destination)}` +
                `&mode=driving` +
                `&departure_time=${departureTime}` +
                `&traffic_model=best_guess` +
                `&key=${apiKey}`;
            const { data } = await axios.get(url, { timeout: 8000 });
            const el = data?.rows?.[0]?.elements?.[0];
            if (data.status === 'OK' && el?.status === 'OK') {
                // Use duration_in_traffic if available (real-time), else duration
                const duration = el.duration_in_traffic || el.duration;
                console.log('[Maps] ✅ Google Distance + Traffic success');
                return {
                    distanceValue: el.distance.value,
                    distanceText: el.distance.text,
                    durationValue: duration.value,
                    durationText: duration.text,
                };
            }
            console.warn('[Maps] Google status:', data.status, el?.status);
        } catch (err) {
            console.warn('[Maps] Google Distance failed:', err.message);
        }
    }

    // ── 2. OSRM (multi-server, global coverage) ───────────────────
    try {
        const result = await getOsrmDistance(oLat, oLng, dLat, dLng);
        console.log('[Maps] ✅ OSRM success:', result.distanceText, result.durationText);
        return result;
    } catch (err) {
        console.warn('[Maps] All OSRM servers failed:', err.message);
    }

    // ── 3. Haversine straight-line + road factor ──────────────────
    const distM = haversineDistance(oLat, oLng, dLat, dLng);
    const roadDistM = Math.round(distM * 1.35);
    const durationSec = Math.round(roadDistM / (40000 / 3600)); // ~40 km/h average
    console.warn('[Maps] ⚠️ Haversine fallback used');
    return {
        distanceValue: roadDistM,
        distanceText: `~${(roadDistM / 1000).toFixed(1)} km`,
        durationValue: durationSec,
        durationText: `~${formatDuration(durationSec)}`,
    };
};

// ─────────────────────────────────────────────────────────────────
// getPolyline
// Priority: Google Directions → OSRM (multi-server) → null
// Works for EVERY location on Earth
// ─────────────────────────────────────────────────────────────────
const getPolyline = async (origin, destination) => {
    const [oLat, oLng] = origin.split(',').map(Number);
    const [dLat, dLng] = destination.split(',').map(Number);

    // ── 1. Google Directions (driving mode, fastest route) ───────
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/directions/json` +
                `?origin=${encodeURIComponent(origin)}` +
                `&destination=${encodeURIComponent(destination)}` +
                `&mode=driving` +
                `&alternatives=false` +
                `&key=${apiKey}`;
            const { data } = await axios.get(url, { timeout: 8000 });
            if (data.status === 'OK' && data.routes?.[0]) {
                console.log('[Maps] ✅ Google Polyline success');
                return data.routes[0].overview_polyline.points;
            }
            console.warn('[Maps] Google Directions status:', data.status);
        } catch (err) {
            console.warn('[Maps] Google Polyline failed:', err.message);
        }
    }

    // ── 2. OSRM multi-server ──────────────────────────────────────
    try {
        const poly = await getOsrmPolyline(oLat, oLng, dLat, dLng);
        console.log('[Maps] ✅ OSRM Polyline success');
        return poly;
    } catch (err) {
        console.warn('[Maps] OSRM Polyline failed:', err.message);
    }

    return null;
};

// ─────────────────────────────────────────────────────────────────
// searchLocations
// Proxies Nominatim (OpenStreetMap) to avoid CORS/429 in browser
// ─────────────────────────────────────────────────────────────────
const searchLocations = async (query, lat, lon) => {
    if (!query || query.length < 3) return [];

    // ── 1. Priority: Google Geocoding (if key exists) ────────────
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (apiKey) {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
            const { data } = await axios.get(url, { timeout: 5000 });
            if (data.status === 'OK') {
                return data.results.map(item => ({
                    address: item.formatted_address,
                    coordinates: [item.geometry.location.lng, item.geometry.location.lat]
                }));
            }
        } catch (err) {
            console.warn('[Search] Google Geocode failed:', err.message);
        }
    }

    // ── 2. Fallback: Nominatim (OpenStreetMap) ───────────────────
    try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`;
        if (lat && lon) {
            url += `&lat=${lat}&lon=${lon}`;
        }

        const { data } = await axios.get(url, {
            timeout: 5000,
            headers: {
                'User-Agent': 'RideSharingApp/1.0 (contact@rideshare.com)',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        return (data || []).map(item => ({
            address: item.display_name,
            coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
        }));
    } catch (err) {
        console.error('[Search] Nominatim failed:', err.response?.status, err.message);
        return [];
    }
};

module.exports = { getDistanceAndDuration, getPolyline, searchLocations };

