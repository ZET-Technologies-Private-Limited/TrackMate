import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import socket from '../socket';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, MessageCircle, Phone, X, AlertCircle, Star, CheckCircle, Send, Loader2, Zap, Users, Clock } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
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

// Custom icons
const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const dropIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom icons for passengers
const passengerPickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const passengerDropIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const carIcon = new L.DivIcon({
    html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; transform: rotate(0deg);"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg></div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Component to handle map view updates
const ChangeView = ({ center, bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length >= 2 && bounds[0] && bounds[0][0] !== null) {
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.setView(center, map.getZoom());
        }
    }, [bounds, center, map]);
    return null;
};

const LiveTrip = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [trip, setTrip] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [path, setPath] = useState([]);
    const [completing, setCompleting] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const fetchTripDetails = async () => {
            try {
                const { data } = await API.get(`/trips/${id}`);
                setTrip(data);

                if (data.routePolyline && data.routePolyline !== 'NO_PATH') {
                    const decoded = polyline.decode(data.routePolyline);
                    setPath(decoded.map(p => [p[0], p[1]]));
                }

                // Fetch bookings to get passenger specific points
                const bookingsRes = await API.get(`/bookings/trip/${id}`);
                setBookings(bookingsRes.data.filter(b => b.status === 'ACCEPTED'));

            } catch (err) {
                console.error('Error fetching trip:', err);
                alert('Could not load mission data.');
            }
        };
        fetchTripDetails();

        socket.emit('joinTrip', id);

        socket.on('receiveMessage', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('locationUpdated', (data) => {
            if (data.tripId === id) {
                setCurrentLocation([data.lat, data.lng]);
            }
        });

        let watchId;
        if (trip?.driverId?._id === user._id && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    socket.emit('updateLocation', {
                        tripId: id,
                        lat: latitude,
                        lng: longitude
                    });
                    setCurrentLocation([latitude, longitude]);
                },
                (err) => console.error('GPS Issue:', err),
                { enableHighAccuracy: true, distanceFilter: 10 }
            );
        }

        return () => {
            socket.off('receiveMessage');
            socket.off('locationUpdated');
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [id, trip?.driverId?._id, user._id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = () => {
        if (!newMessage.trim()) return;
        const msgData = {
            tripId: id,
            senderId: user._id,
            senderName: user.name,
            message: newMessage
        };
        socket.emit('sendMessage', msgData);
        setNewMessage('');
    };

    const handleCallUser = (phone) => {
        if (phone) {
            window.location.href = `tel:${phone}`;
        } else {
            alert('Phone number unknown.');
        }
    };

    const handleMessageUser = (phone) => {
        if (phone) {
            window.location.href = `sms:${phone}`;
        } else {
            alert('Phone number unknown.');
        }
    };

    const handleComplete = async () => {
        if (completing) return;
        setCompleting(true);
        try {
            await API.patch(`/trips/${id}/complete`);
            navigate(user.role === 'TRAVELLER' ? '/dashboard/traveller' : '/dashboard/passenger');
        } catch (err) {
            console.error(err);
            alert('Failed to complete trip.');
            setCompleting(false);
        }
    };

    if (!trip) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        </div>
    );

    const startPos = [trip.startPoint.coordinates[1], trip.startPoint.coordinates[0]];
    const endPos = [trip.endPoint.coordinates[1], trip.endPoint.coordinates[0]];
    const myBooking = bookings.find(b => b.passengerId._id === user._id);

    // Determine which points to show on map
    const markers = [];
    markers.push({ pos: startPos, icon: pickupIcon, label: 'Trip Start' });
    markers.push({ pos: endPos, icon: dropIcon, label: 'Trip End' });

    if (user.role === 'TRAVELLER') {
        // Driver sees all passenger pickup/drop points
        bookings.forEach(b => {
            markers.push({ pos: [b.pickupPoint.coordinates[1], b.pickupPoint.coordinates[0]], icon: passengerPickupIcon, label: `Pickup: ${b.passengerId.name}` });
            markers.push({ pos: [b.dropPoint.coordinates[1], b.dropPoint.coordinates[0]], icon: passengerDropIcon, label: `Drop: ${b.passengerId.name}` });
        });
    } else if (myBooking) {
        // Passenger sees their specific pickup/drop
        markers.push({ pos: [myBooking.pickupPoint.coordinates[1], myBooking.pickupPoint.coordinates[0]], icon: passengerPickupIcon, label: 'My Pickup' });
        markers.push({ pos: [myBooking.dropPoint.coordinates[1], myBooking.dropPoint.coordinates[0]], icon: passengerDropIcon, label: 'My Drop-off' });
    }

    const bounds = markers.map(m => m.pos);

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 selection:bg-emerald-500/30">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Trip Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="flex items-center gap-6 sm:gap-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                            <div className="relative p-5 bg-emerald-500 rounded-2xl text-white shadow-xl shadow-emerald-500/20 transform group-hover:rotate-12 transition-transform">
                                <Navigation className="w-7 h-7" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                                Live Trip Status
                                <div className="p-1 bg-slate-900 rounded-full animate-pulse md:hidden lg:block">
                                    <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                                </div>
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{trip.status}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                    ID: {id.slice(-6).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-10">
                        <div className="relative">
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-2">Occupancy Status</p>
                            <div className="flex items-end gap-1.5">
                                <span className="text-3xl font-black text-slate-900 leading-none">
                                    {(trip.totalSeats || 4) - (trip.availableSeats || 0)}
                                </span>
                                <span className="text-xl font-bold text-slate-300 leading-none mb-0.5">/</span>
                                <span className={`text-xl font-bold leading-none mb-0.5 ${trip.availableSeats === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                    {trip.totalSeats || 4}
                                </span>
                            </div>
                            <div className="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(((trip.totalSeats || 4) - (trip.availableSeats || 0)) / (trip.totalSeats || 4)) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                />
                            </div>
                        </div>

                        <div className="h-12 w-px bg-slate-200 hidden sm:block mx-2" />

                        <button
                            onClick={() => navigate(-1)}
                            className="p-4 bg-white hover:bg-slate-900 rounded-[2rem] text-slate-400 hover:text-white border-2 border-slate-100 hover:border-slate-900 transition-all shadow-lg hover:shadow-slate-300 group active:scale-95"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Map & Route Stats */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white p-3 rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 h-[500px] lg:h-[650px] relative overflow-hidden group">
                            <MapContainer
                                center={startPos}
                                zoom={13}
                                style={{ height: '100%', width: '100%', borderRadius: '2.5rem' }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                                    maxZoom={20}
                                    attribution='&copy; Google Maps'
                                />
                                <ChangeView bounds={bounds} />

                                {markers.map((m, i) => (
                                    <Marker key={i} position={m.pos} icon={m.icon} />
                                ))}

                                {currentLocation && <Marker position={currentLocation} icon={carIcon} />}
                                {path.length > 0 && <Polyline positions={path} color="#2563eb" weight={6} opacity={0.85} lineCap="round" />}
                            </MapContainer>

                            {/* Floating Overlay */}
                            <div className="absolute bottom-10 left-10 z-[1000] right-10">
                                <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1 flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Drop-off Location</p>
                                            <p className="text-sm font-bold text-slate-900 truncate">{trip.endPoint.address}</p>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200 hidden md:block" />
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
                                                <Zap className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Distance</p>
                                                <p className="text-xs font-black text-slate-900">{trip.distance ? `${(trip.distance / 1000).toFixed(1)} km` : '-- km'}</p>
                                            </div>
                                        </div>
                                        <div className="w-px h-6 bg-slate-200" />
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-500 rounded-xl text-white">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Est. Arrival</p>
                                                <p className="text-xs font-black text-slate-900">{trip.duration ? (trip.duration >= 3600 ? `${Math.floor(trip.duration / 3600)}h ${Math.round((trip.duration % 3600) / 60)}m` : `${Math.round(trip.duration / 60)} min`) : '-- min'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stop Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Pickup Point</p>
                                    <p className="font-bold text-slate-900 truncate">{trip.startPoint.address}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900">
                                    <Navigation className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Final Destination</p>
                                    <p className="font-bold text-slate-900 truncate">{trip.endPoint.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Passengers & Chat */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-500" /> Passenger List
                            </h3>

                            {/* Driver Info */}
                            <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-[2rem] border border-slate-100 flex items-center justify-between mb-6 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />
                                <div className="flex items-center gap-5 relative">
                                    <div className="relative">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-xl ring-1 ring-slate-100">
                                            <img
                                                src={trip.driverId?.profileImage || `https://ui-avatars.com/api/?background=random&name=${trip.driverId?.name}`}
                                                alt="driver"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-lg border-2 border-white">
                                            <Zap className="w-3 h-3 text-white fill-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 tracking-tight">{trip.driverId?.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-0.5">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                <span className="text-[10px] font-bold text-slate-600">{trip.driverId?.ratingAvg || '5.0'}</span>
                                            </div>
                                            <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/20">Verified Driver</span>
                                        </div>
                                    </div>
                                </div>
                                {user.role === 'PASSENGER' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleMessageUser(trip.driverId?.phone)}
                                            className="p-4 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all relative overflow-hidden group/msg"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/msg:translate-y-0 transition-transform duration-300" />
                                            <MessageCircle className="w-5 h-5 relative" />
                                        </button>
                                        <button
                                            onClick={() => handleCallUser(trip.driverId?.phone)}
                                            className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-95 transition-all relative overflow-hidden group/call"
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/call:translate-y-0 transition-transform duration-300" />
                                            <Phone className="w-5 h-5 relative" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Passenger List */}
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center justify-between px-2">
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Trip passengers</p>
                                    <div className="flex -space-x-3">
                                        {bookings.slice(0, 3).map((b, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                                                <img src={b.passengerId.profileImage || `https://ui-avatars.com/api/?name=${b.passengerId.name}`} alt="" />
                                            </div>
                                        ))}
                                        {bookings.length > 3 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-900 text-white text-[8px] flex items-center justify-center font-bold">
                                                +{bookings.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {bookings.map(b => (
                                        <motion.div
                                            key={b._id}
                                            whileHover={{ x: 5 }}
                                            className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-500/20 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <img src={b.passengerId.profileImage || `https://ui-avatars.com/api/?name=${b.passengerId.name}`} alt="p" className="w-10 h-10 rounded-xl bg-slate-100" />
                                                <div>
                                                    <p className="text-xs font-black text-slate-900">{b.passengerId.name} {b.passengerId._id === user._id && '(You)'}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Verified ID</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleMessageUser(b.passengerId.phone)}
                                                    className="p-2 bg-blue-500/10 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleCallUser(b.passengerId.phone)}
                                                    className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </button>
                                                <div className="px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 ml-2">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">{b.seatsBooked} Seats</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {user._id?.toString() === trip.driverId?._id?.toString() && trip.status !== 'COMPLETED' && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleComplete}
                                    disabled={completing}
                                    className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-4 mb-10 transition-all relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    {completing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                                    <span>Complete Trip</span>
                                </motion.button>
                            )}

                            {/* Comms Block */}
                            <div className="space-y-4 pt-6 border-t border-slate-100">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                    <MessageCircle className="w-3 h-3" /> Trip Chat
                                </p>
                                <div className="h-[250px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                    {messages.length === 0 && (
                                        <div className="text-center py-10 opacity-30">
                                            <p className="text-xs font-bold">Secure Connection established</p>
                                        </div>
                                    )}
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`p-4 rounded-2xl text-sm max-w-[85%] ${msg.senderId === user._id
                                                ? 'bg-emerald-500 text-white rounded-br-none shadow-lg shadow-emerald-500/10'
                                                : 'bg-slate-100 text-slate-900 rounded-bl-none'}`}>
                                                <p className="text-[8px] font-black uppercase mb-1 opacity-60 tracking-widest">{msg.senderName}</p>
                                                <p className="font-medium">{msg.message}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="pt-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 transition-all text-sm font-bold text-slate-900"
                                    />
                                    <button onClick={sendMessage} className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all">
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveTrip;
