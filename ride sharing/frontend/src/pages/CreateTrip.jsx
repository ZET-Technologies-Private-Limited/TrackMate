import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Users, ArrowRight, Loader, Search, Navigation, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

import debounce from 'lodash.debounce';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
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

const ChangeView = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length >= 2) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

const CreateTrip = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Get current time formatted for datetime-local min attribute
    const nowLocal = new Date();
    nowLocal.setMinutes(nowLocal.getMinutes() - nowLocal.getTimezoneOffset());
    const minDateTime = nowLocal.toISOString().slice(0, 16);
    // Set default departure time to 1 hour from now
    const defaultDeparture = new Date(nowLocal.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

    const [formData, setFormData] = useState({
        startPoint: { address: '', coordinates: [] },
        endPoint: { address: '', coordinates: [] },
        departureTime: defaultDeparture,
        availableSeats: 4,
        pricePerSeat: 150,
        vehicleDetails: ''
    });
    const [pickupConfirmed, setPickupConfirmed] = useState(false);
    const [dropConfirmed, setDropConfirmed] = useState(false);
    const [locationError, setLocationError] = useState('');

    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [searchingPickup, setSearchingPickup] = useState(false);
    const [searchingDrop, setSearchingDrop] = useState(false);

    const [routeInfo, setRouteInfo] = useState(null);
    const [fetchingRoute, setFetchingRoute] = useState(false);

    const pickupRef = useRef(null);
    const dropRef = useRef(null);
    const pickupInputRef = useRef(null);
    const dropInputRef = useRef(null);
    const [pickupDropRect, setPickupDropRect] = useState(null);
    const [dropDropRect, setDropDropRect] = useState(null);

    const updateRects = useCallback(() => {
        if (pickupInputRef.current) setPickupDropRect(pickupInputRef.current.getBoundingClientRect());
        if (dropInputRef.current) setDropDropRect(dropInputRef.current.getBoundingClientRect());
    }, []);

    const SuggestionPortal = ({ suggestions, rect, onSelect, accentColor = 'emerald' }) => {
        if (!suggestions.length || !rect) return null;
        return ReactDOM.createPortal(
            <div
                style={{ position: 'fixed', top: rect.bottom + 4, left: rect.left, width: rect.width, zIndex: 99999 }}
                className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="max-h-64 overflow-y-auto">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
                            className="px-5 py-4 hover:bg-slate-50 cursor-pointer flex items-start gap-3 border-b border-slate-50 last:border-0 group"
                        >
                            <div className={`mt-0.5 p-1.5 bg-slate-100 rounded-lg group-hover:bg-${accentColor}-100 group-hover:text-${accentColor}-600 transition-colors flex-shrink-0`}>
                                <Search className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-800 truncate">{s.address.split(',')[0]}</p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{s.address.split(',').slice(1).join(',').trim()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>,
            document.body
        );
    };

    useEffect(() => {
        const getRoutePreview = async () => {
            if (pickupConfirmed && dropConfirmed) {
                setFetchingRoute(true);
                try {
                    const { data } = await API.get('/trips/route-info', {
                        params: {
                            pickupLat: formData.startPoint.coordinates[1],
                            pickupLng: formData.startPoint.coordinates[0],
                            dropLat: formData.endPoint.coordinates[1],
                            dropLng: formData.endPoint.coordinates[0]
                        }
                    });
                    setRouteInfo(data);
                } catch (err) {
                    console.error('Route Preview Error:', err);
                } finally {
                    setFetchingRoute(false);
                }
            } else {
                setRouteInfo(null);
            }
        };
        getRoutePreview();
    }, [pickupConfirmed, dropConfirmed, formData.startPoint.coordinates, formData.endPoint.coordinates]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickupRef.current && !pickupRef.current.contains(event.target)) {
                setPickupSuggestions([]);
            }
            if (dropRef.current && !dropRef.current.contains(event.target)) {
                setDropSuggestions([]);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', updateRects, true);
        window.addEventListener('resize', updateRects);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateRects, true);
            window.removeEventListener('resize', updateRects);
        };
    }, []);

    const fetchSuggestions = debounce(async (query, type) => {
        if (!query || query.length < 3) return;

        const isPickup = type === 'pickup';
        if (isPickup) setSearchingPickup(true);
        else setSearchingDrop(true);

        try {
            // Bias towards the other point if it exists
            const otherPoint = isPickup ? formData.endPoint : formData.startPoint;

            const { data: suggestions } = await API.get('/trips/search-location', {
                params: {
                    q: query,
                    lat: otherPoint?.coordinates?.[1],
                    lon: otherPoint?.coordinates?.[0]
                }
            });

            if (isPickup) setPickupSuggestions(suggestions);
            else setDropSuggestions(suggestions);
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        } finally {
            if (isPickup) setSearchingPickup(false);
            else setSearchingDrop(false);
        }
    }, 300);

    const handleSelectSuggestion = (suggestion, type) => {
        const isPickup = type === 'pickup';
        if (isPickup) {
            setFormData(prev => ({ ...prev, startPoint: suggestion }));
            setPickupConfirmed(true);
            setPickupSuggestions([]);
        } else {
            setFormData(prev => ({ ...prev, endPoint: suggestion }));
            setDropConfirmed(true);
            setDropSuggestions([]);
        }
        setLocationError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!pickupConfirmed) {
            setLocationError('Please select a Pickup Location from the suggestions.');
            return;
        }
        if (!dropConfirmed) {
            setLocationError('Please select a Drop-off Location from the suggestions.');
            return;
        }
        setLocationError('');
        setLoading(true);
        try {
            await API.post('/trips', formData);
            alert('Mission Published Successfully!');
            navigate('/dashboard/traveller');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to publish mission');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 sm:pt-32 px-3 sm:px-4 pb-20 max-w-2xl mx-auto bg-slate-50">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-slate-900">
                    <div className="p-2 bg-emerald-500 rounded-xl">
                        <MapPin className="w-6 h-6 text-white" />
                    </div>
                    Publish a Mission
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    {locationError && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-medium px-4 py-3 rounded-xl">
                            {locationError}
                        </div>
                    )}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Route Details</h3>
                        <div className="relative" ref={pickupRef}>
                            <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-widest">Pickup Origin</label>
                            <div className="relative">
                                <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-20 ${pickupConfirmed ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <input
                                    ref={pickupInputRef}
                                    type="text"
                                    required
                                    value={formData.startPoint.address}
                                    onFocus={updateRects}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, startPoint: { address: val, coordinates: [] } });
                                        setPickupConfirmed(false);
                                        fetchSuggestions(val, 'pickup');
                                        updateRects();
                                    }}
                                    className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 ${pickupConfirmed ? 'border-emerald-400 focus:border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-slate-200 focus:border-emerald-500'}`}
                                    placeholder="Search pickup city or area..."
                                />
                                {searchingPickup && <div className="absolute right-10 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                {pickupConfirmed && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg">SELECTED</span>}
                            </div>
                            <SuggestionPortal
                                suggestions={pickupSuggestions}
                                rect={pickupDropRect}
                                onSelect={(s) => handleSelectSuggestion(s, 'pickup')}
                                accentColor="emerald"
                            />
                        </div>
                        <div className="relative" ref={dropRef}>
                            <label className="block text-xs font-bold mb-2 text-slate-500 uppercase tracking-widest">Drop-off Destination</label>
                            <div className="relative">
                                <Navigation className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-20 ${dropConfirmed ? 'text-blue-500' : 'text-slate-400'}`} />
                                <input
                                    ref={dropInputRef}
                                    type="text"
                                    required
                                    value={formData.endPoint.address}
                                    onFocus={updateRects}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, endPoint: { address: val, coordinates: [] } });
                                        setDropConfirmed(false);
                                        fetchSuggestions(val, 'drop');
                                        updateRects();
                                    }}
                                    className={`w-full pl-11 pr-4 py-4 bg-slate-50 border rounded-2xl outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400 ${dropConfirmed ? 'border-blue-400 focus:border-blue-500 shadow-lg shadow-blue-500/5' : 'border-slate-200 focus:border-blue-500'}`}
                                    placeholder="Search drop-off destination..."
                                />
                                {searchingDrop && <div className="absolute right-10 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                {dropConfirmed && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg">SELECTED</span>}
                            </div>
                            <SuggestionPortal
                                suggestions={dropSuggestions}
                                rect={dropDropRect}
                                onSelect={(s) => handleSelectSuggestion(s, 'drop')}
                                accentColor="blue"
                            />
                        </div>
                    </div>

                    {/* Route Preview Map - Interactive Style */}
                    {(pickupConfirmed || dropConfirmed) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-4 mb-8"
                        >
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Navigation className="w-3 h-3 text-emerald-500" /> Route Analysis
                                </h3>
                                {routeInfo && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                        CALCULATION COMPLETE
                                    </span>
                                )}
                            </div>

                            <div className="h-[300px] w-full rounded-3xl overflow-hidden border-2 border-slate-100 shadow-2xl shadow-slate-200/50 bg-slate-100 relative group">
                                <MapContainer
                                    center={[20.5937, 78.9629]}
                                    zoom={5}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl={false}
                                >
                                    <TileLayer
                                        url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                                        attribution='&copy; Google Maps'
                                    />
                                    {pickupConfirmed && (
                                        <Marker position={[formData.startPoint.coordinates[1], formData.startPoint.coordinates[0]]} />
                                    )}
                                    {dropConfirmed && (
                                        <Marker position={[formData.endPoint.coordinates[1], formData.endPoint.coordinates[0]]} />
                                    )}
                                    {routeInfo && routeInfo.polyline && (
                                        <Polyline
                                            positions={polyline.decode(routeInfo.polyline).map(p => [p[0], p[1]])}
                                            color="#2563eb"
                                            weight={5}
                                            opacity={0.85}
                                        />
                                    )}
                                    <ChangeView bounds={[
                                        pickupConfirmed ? [formData.startPoint.coordinates[1], formData.startPoint.coordinates[0]] : null,
                                        dropConfirmed ? [formData.endPoint.coordinates[1], formData.endPoint.coordinates[0]] : null
                                    ].filter(b => b !== null)} />
                                </MapContainer>

                                {fetchingRoute && (
                                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
                                        <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center gap-3">
                                            <Loader className="w-5 h-5 text-emerald-500 animate-spin" />
                                            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Routing...</span>
                                        </div>
                                    </div>
                                )}

                                {routeInfo && (
                                    <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            className="bg-slate-900/95 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10 shadow-2xl flex justify-between items-center"
                                        >
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black uppercase text-emerald-400 tracking-[0.2em]">Trip Distance</p>
                                                <p className="text-lg font-black text-white leading-none">{routeInfo.distance}</p>
                                            </div>
                                            <div className="h-8 w-px bg-white/10" />
                                            <div className="space-y-1 text-right">
                                                <p className="text-[8px] font-black uppercase text-blue-400 tracking-[0.2em]">Est. Travel Time</p>
                                                <p className="text-lg font-black text-white leading-none">{routeInfo.duration}</p>
                                            </div>
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Departure Time</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="datetime-local"
                                    required
                                    min={minDateTime}
                                    value={formData.departureTime}
                                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Available Seats</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                                <input
                                    type="number"
                                    min="1" max="8"
                                    value={formData.availableSeats}
                                    onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Price per Seat (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    required
                                    value={formData.pricePerSeat}
                                    onChange={(e) => setFormData({ ...formData, pricePerSeat: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-slate-500">Vehicle Info</label>
                            <input
                                type="text"
                                required
                                value={formData.vehicleDetails}
                                onChange={(e) => setFormData({ ...formData, vehicleDetails: e.target.value })}
                                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium placeholder:text-slate-400"
                                placeholder="Toyota Fortuner (Black)"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2 uppercase tracking-widest text-sm"
                    >
                        {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Publish Ride</>}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateTrip;
