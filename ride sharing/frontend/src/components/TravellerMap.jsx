import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const activeTripIcon = new L.DivIcon({
    html: `<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(59,130,246,0.4); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const ChangeView = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

const TravellerMap = ({ trips, onSelectTrip }) => {
    const activeTrips = trips.filter(t => t.status === 'ongoing' || t.status === 'OPEN');
    const bounds = activeTrips.map(t => [t.startPoint.coordinates[1], t.startPoint.coordinates[0]]);

    return (
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50 bg-slate-100">
            <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    maxZoom={20}
                    attribution='&copy; Google Maps'
                />
                <ChangeView bounds={bounds.length > 0 ? bounds : null} />

                {activeTrips.map(trip => (
                    <Marker
                        key={trip._id}
                        position={[trip.startPoint.coordinates[1], trip.startPoint.coordinates[0]]}
                        icon={activeTripIcon}
                    >
                        <Popup className="custom-popup">
                            <div className="p-3">
                                <p className="font-black text-slate-900 text-sm mb-1">{trip.endPoint.address.split(',')[0]}</p>
                                <p className="text-[10px] uppercase font-black text-slate-400 mb-2">{trip.status}</p>
                                <button
                                    onClick={() => onSelectTrip(trip._id)}
                                    className="w-full py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20"
                                >
                                    View Logic
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default TravellerMap;
