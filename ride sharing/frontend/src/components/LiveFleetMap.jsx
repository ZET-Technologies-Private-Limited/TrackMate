import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const carIcon = new L.DivIcon({
    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; transform: rotate(45deg);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

const LiveFleetMap = () => {
    const [cars, setCars] = useState([
        { id: 1, pos: [12.9716, 77.5946], angle: 0 },
        { id: 2, pos: [12.9352, 77.6245], angle: 0 },
        { id: 3, pos: [13.0123, 77.5678], angle: 0 }
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCars(prev => prev.map(car => ({
                ...car,
                pos: [
                    car.pos[0] + (Math.random() - 0.5) * 0.002,
                    car.pos[1] + (Math.random() - 0.5) * 0.002
                ]
            })));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full relative group">
            <MapContainer
                center={[12.9716, 77.5946]}
                zoom={12}
                style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    maxZoom={20}
                    attribution='&copy; Google Maps'
                />
                {cars.map(car => (
                    <Marker key={car.id} position={car.pos} icon={carIcon} />
                ))}
            </MapContainer>

            {/* Live Indicator Overlay */}
            <div className="absolute top-6 left-6 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live Active Fleet</span>
            </div>


        </div>
    );
};

export default LiveFleetMap;
