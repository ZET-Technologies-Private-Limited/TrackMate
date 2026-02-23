import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polyline from 'google-polyline';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const startIcon = new L.DivIcon({
    html: `<div style="background-color: #10b981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const endIcon = new L.DivIcon({
    html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const ChangeView = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

const BookingSummaryMap = ({ trip }) => {
    if (!trip) return null;

    const startPos = [trip.startPoint.coordinates[1], trip.startPoint.coordinates[0]];
    const endPos = [trip.endPoint.coordinates[1], trip.endPoint.coordinates[0]];
    const path = trip.routePolyline && trip.routePolyline !== 'NO_PATH'
        ? polyline.decode(trip.routePolyline).map(p => [p[0], p[1]])
        : [];

    const bounds = [startPos, endPos];

    return (
        <div className="w-full h-56 rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50 relative z-10">
            <MapContainer
                center={startPos}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={true}
            >
                <TileLayer
                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    maxZoom={20}
                    attribution='&copy; Google Maps'
                />
                <ChangeView bounds={bounds} />

                <Marker position={startPos} icon={startIcon} />
                <Marker position={endPos} icon={endIcon} />

                {path.length > 0 && (
                    <Polyline positions={path} color="#2563eb" weight={5} opacity={0.6} dashArray="8, 12" />
                )}
            </MapContainer>
        </div>
    );
};

export default BookingSummaryMap;
