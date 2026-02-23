import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import polyline from 'google-polyline';
import { Clock } from 'lucide-react';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.DivIcon({
    html: `<div style="background-color: #10b981; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

const destinationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [20, 32],
    iconAnchor: [10, 32],
});

const ChangeView = ({ center, zoom, bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.setView(center, zoom || 13);
        }
    }, [center, zoom, bounds, map]);
    return null;
};

const PassengerMap = ({ trips, onSelectTrip, searchCoords }) => {
    const [selectedTripId, setSelectedTripId] = useState(null);
    const defaultCenter = [12.9716, 77.5946];
    const center = searchCoords ? [searchCoords.lat, searchCoords.lng] : defaultCenter;

    return (
        <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
            <MapContainer
                center={center}
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
                <ChangeView center={center} />

                {trips.map(trip => {
                    const isSelected = selectedTripId === trip._id;
                    const path = trip.routePolyline && trip.routePolyline !== 'NO_PATH'
                        ? polyline.decode(trip.routePolyline).map(p => [p[0], p[1]])
                        : [];

                    return (
                        <React.Fragment key={trip._id}>
                            <Marker
                                position={[trip.startPoint.coordinates[1], trip.startPoint.coordinates[0]]}
                                icon={driverIcon}
                                eventHandlers={{
                                    click: () => setSelectedTripId(isSelected ? null : trip._id)
                                }}
                            >
                                <Popup className="custom-popup" maxWidth={300}>
                                    <div className="p-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100">
                                                <img src={trip.driverId.profileImage || `https://ui-avatars.com/api/?name=${trip.driverId.name}`} alt="p" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 leading-none">{trip.driverId.name}</p>
                                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-1">{trip.driverId.ratingAvg || '5.0'} Rating</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                <p className="text-xs font-bold text-slate-600 truncate">{trip.endPoint.address}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <p className="text-[10px] font-bold text-slate-500">
                                                    {new Date(trip.departureTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} • {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <p className="font-black text-lg text-slate-900">₹{trip.pricePerSeat}</p>
                                            <button
                                                onClick={() => onSelectTrip(trip)}
                                                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all"
                                            >
                                                Book Spot
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>

                            {isSelected && (
                                <>
                                    <Marker
                                        position={[trip.endPoint.coordinates[1], trip.endPoint.coordinates[0]]}
                                        icon={destinationIcon}
                                    />
                                    {path.length > 0 && (
                                        <Polyline positions={path} color="#2563eb" weight={5} opacity={0.85} />
                                    )}
                                </>
                            )}
                        </React.Fragment>
                    );
                })}
            </MapContainer>
        </div>
    );
};


export default PassengerMap;
