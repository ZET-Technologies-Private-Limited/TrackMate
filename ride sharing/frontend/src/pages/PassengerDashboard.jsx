import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Calendar, Clock, Loader2, Navigation,
    Search, Filter, Leaf, ChevronDown,
    CheckCircle, Receipt, MessageCircle, ArrowRight,
    Zap, ShieldCheck, Globe, CreditCard, List, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import useAuthStore from '../store/useAuthStore';
import socket from '../socket';
import debounce from 'lodash.debounce';

import PassengerMap from '../components/PassengerMap';

const PassengerDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] = useState({
        pickupLng: '', pickupLat: '',
        dropLng: '', dropLat: '',
        pickupName: '',
        dropName: '',
        date: new Date().toISOString().split('T')[0],
        maxDistance: 50
    });

    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [myActiveBookings, setMyActiveBookings] = useState([]);
    const [myTripHistory, setMyTripHistory] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

    const [pickupSuggestions, setPickupSuggestions] = useState([]);
    const [dropSuggestions, setDropSuggestions] = useState([]);
    const [searchingPickup, setSearchingPickup] = useState(false);
    const [searchingDrop, setSearchingDrop] = useState(false);
    const pickupRef = useRef(null);
    const dropRef = useRef(null);
    const pickupInputRef = useRef(null);
    const dropInputRef = useRef(null);
    const [pickupDropRect, setPickupDropRect] = useState(null);
    const [dropDropRect, setDropDropRect] = useState(null);

    // Recompute position on scroll/resize so dropdown follows the input
    const updateRects = useCallback(() => {
        if (pickupInputRef.current) setPickupDropRect(pickupInputRef.current.getBoundingClientRect());
        if (dropInputRef.current) setDropDropRect(dropInputRef.current.getBoundingClientRect());
    }, []);

    // Portal dropdown — renders at fixed position relative to viewport
    const SuggestionPortal = ({ suggestions, rect, onSelect, accentColor = 'emerald' }) => {
        if (!suggestions.length || !rect) return null;
        return ReactDOM.createPortal(
            <div
                style={{
                    position: 'fixed',
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    zIndex: 99999,
                }}
                className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
                            className={`px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-start gap-3 border-b border-slate-50 last:border-0 group`}
                        >
                            <div className={`mt-0.5 p-1 bg-slate-100 rounded group-hover:bg-${accentColor}-100 group-hover:text-${accentColor}-600 transition-colors flex-shrink-0`}>
                                <Search className="w-3 h-3" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 truncate">{s.address.split(',')[0]}</p>
                                <p className="text-[9px] text-slate-500 truncate mt-0.5">{s.address.split(',').slice(1).join(',').trim()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>,
            document.body
        );
    };

    useEffect(() => {
        fetchMyBookings();
        const handleClickOutside = (event) => {
            if (pickupRef.current && !pickupRef.current.contains(event.target)) setPickupSuggestions([]);
            if (dropRef.current && !dropRef.current.contains(event.target)) setDropSuggestions([]);
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', updateRects, true);
        window.addEventListener('resize', updateRects);
        socket.on('newNotification', () => fetchMyBookings());
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updateRects, true);
            window.removeEventListener('resize', updateRects);
            socket.off('newNotification');
        };
    }, []);

    const fetchMyBookings = async () => {
        try {
            const { data } = await API.get('/bookings/my-bookings');

            // Active: ACCEPTED or PENDING, and not completed/cancelled
            const active = data.filter(b =>
                !['COMPLETED', 'CANCELLED'].includes(b.tripId.status) &&
                !['COMPLETED', 'CANCELLED'].includes(b.status)
            ).sort((a, b) => new Date(a.tripId.departureTime) - new Date(b.tripId.departureTime));

            // History: COMPLETED or status is COMPLETED
            const history = data.filter(b =>
                (b.tripId.status === 'COMPLETED' || b.status === 'COMPLETED') && b.paymentStatus !== 'PAID'
            ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

            setMyActiveBookings(active);
            setMyTripHistory(history);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchSuggestions = debounce(async (query, type) => {
        if (!query || query.length < 3) return;
        const isPickup = type === 'pickup';
        if (isPickup) setSearchingPickup(true); else setSearchingDrop(true);
        try {
            const otherPoint = isPickup
                ? { coordinates: searchParams.dropLng ? [searchParams.dropLng, searchParams.dropLat] : null }
                : { coordinates: searchParams.pickupLng ? [searchParams.pickupLng, searchParams.pickupLat] : null };

            const { data: suggestions } = await API.get('/trips/search-location', {
                params: {
                    q: query,
                    lat: otherPoint.coordinates ? otherPoint.coordinates[1] : undefined,
                    lon: otherPoint.coordinates ? otherPoint.coordinates[0] : undefined
                }
            });

            if (isPickup) setPickupSuggestions(suggestions); else setDropSuggestions(suggestions);
        } catch (err) {
            console.error(err);
        } finally {
            if (isPickup) setSearchingPickup(false); else setSearchingDrop(false);
        }
    }, 300);

    const handleSelectSuggestion = (suggestion, type) => {
        if (type === 'pickup') {
            setSearchParams(prev => ({
                ...prev,
                pickupName: suggestion.address,
                pickupLng: suggestion.coordinates[0],
                pickupLat: suggestion.coordinates[1]
            }));
            setPickupSuggestions([]);
        } else {
            setSearchParams(prev => ({
                ...prev,
                dropName: suggestion.address,
                dropLng: suggestion.coordinates[0],
                dropLat: suggestion.coordinates[1]
            }));
            setDropSuggestions([]);
        }
    };

    const handleSearch = async () => {
        if (!searchParams.pickupName || !searchParams.dropName) {
            alert('Please specify both pickup and drop-off zones.');
            return;
        }
        setLoading(true);
        try {
            // Use existing coords if available, otherwise fetch
            let pLat = searchParams.pickupLat, pLng = searchParams.pickupLng;
            let dLat = searchParams.dropLat, dLng = searchParams.dropLng;

            if (!pLat || !pLng) {
                const { data } = await API.get('/trips/search-location', { params: { q: searchParams.pickupName } });
                if (data.length) { pLat = parseFloat(data[0].coordinates[1]); pLng = parseFloat(data[0].coordinates[0]); }
            }

            if (!dLat || !dLng) {
                const { data } = await API.get('/trips/search-location', { params: { q: searchParams.dropName } });
                if (data.length) { dLat = parseFloat(data[0].coordinates[1]); dLng = parseFloat(data[0].coordinates[0]); }
            }

            if (!pLat || !dLat) {
                alert('Location Error: Unable to resolve coordinates.');
                setLoading(false);
                return;
            }

            const { data } = await API.get('/trips/search', {
                params: { ...searchParams, pickupLng: pLng, pickupLat: pLat, dropLng: dLng, dropLat: dLat }
            });

            setSearchResults(data);
            setHasSearched(true);
            setSearchParams(prev => ({ ...prev, pickupLng: pLng, pickupLat: pLat, dropLng: dLng, dropLat: dLat }));
        } catch (err) {
            console.error(err);
            alert('Search Error: Unable to complete request.');
        } finally {
            setLoading(false);
        }
    };

    const handleBook = (trip) => {
        navigate('/payment', {
            state: {
                trip,
                bookingDetails: {
                    pickupPoint: { coordinates: [parseFloat(searchParams.pickupLng), parseFloat(searchParams.pickupLat)] },
                    dropPoint: { coordinates: [parseFloat(searchParams.dropLng), parseFloat(searchParams.dropLat)] },
                    seatsBooked: 1,
                    fare: trip.pricePerSeat
                }
            }
        });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-32 sm:pt-40 px-3 sm:px-4 pb-20 font-sans">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-8 relative z-10"
            >
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-200/50">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">TrackMate Sync</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-[800] text-slate-900 tracking-tight leading-[0.9]">
                            Journey <span className="text-emerald-500">Explorer</span>
                        </h1>
                        <p className="text-slate-400 font-semibold text-lg italic max-w-md mt-4">Personalized mobility for your shared network.</p>
                    </div>

                    <motion.div
                        whileHover={{ scale: 1.05, rotateZ: 2 }}
                        className="physical-glass p-6 flex items-center gap-5 !rounded-3xl hover:border-emerald-500/20"
                    >
                        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Environment Score</p>
                            <p className="text-3xl font-black text-slate-900">{user?.rideCredits || 0}</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Active Ride Overview */}
                <AnimatePresence>
                    {myActiveBookings.length > 0 && (
                        <motion.div
                            variants={itemVariants}
                            className="physical-glass p-10 !rounded-[3rem] border-emerald-500/10 flex flex-col lg:flex-row gap-10 relative overflow-hidden group shadow-2xl shadow-emerald-500/5"
                        >
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
                            <div className="flex-1 space-y-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">
                                        Active Journey
                                    </span>
                                </div>
                                <div className="flex items-start gap-8">
                                    <div className="flex flex-col items-center gap-2 mt-2">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] border-4 border-white" />
                                        <div className="w-0.5 h-16 bg-gradient-to-b from-emerald-500 to-slate-200" />
                                        <div className="w-4 h-4 rounded-full bg-slate-900 border-4 border-white" />
                                    </div>
                                    <div className="space-y-10 flex-1">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Boarding Point</p>
                                            <p className="text-xl font-bold text-slate-900 truncate max-w-xl">{myActiveBookings[0].tripId.startPoint.address}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Destination Target</p>
                                            <p className="text-xl font-bold text-slate-900 truncate max-w-xl">{myActiveBookings[0].tripId.endPoint.address}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Departure Window</p>
                                            <p className="text-xl font-bold text-slate-900">
                                                {new Date(myActiveBookings[0].tripId.departureTime).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(myActiveBookings[0].tripId.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:w-80 flex flex-col gap-4 justify-center relative z-10">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/trip/${myActiveBookings[0].tripId._id}`)}
                                    className="btn-premium w-full"
                                >
                                    <Navigation className="w-5 h-5 opacity-50" /> Portal View
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate(`/trip/${myActiveBookings[0].tripId._id}`)}
                                    className="btn-ghost w-full bg-white/50"
                                >
                                    <MessageCircle className="w-5 h-5" /> Secure Comms
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Payment Center - Completed Trips Awaiting Payment */}
                <AnimatePresence>
                    {myTripHistory.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-amber-500" /> Payment Settlements
                                </h3>
                                <div className="h-px flex-1 bg-slate-200 mx-4" />
                                <span className="text-[10px] font-bold text-slate-400">{myTripHistory.length} PENDING</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {myTripHistory.map((booking) => (
                                    <motion.div
                                        key={booking._id}
                                        whileHover={{ y: -5 }}
                                        className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-slate-50 rounded-2xl">
                                                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fare Amount</p>
                                                <p className="text-xl font-black text-slate-900">₹{booking.fare}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-slate-200" />
                                                <p className="text-xs font-bold text-slate-600 truncate">{booking.tripId.startPoint.address}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <p className="text-xs font-black text-slate-900 truncate">{booking.tripId.endPoint.address}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={booking.tripId.driverId?.profileImage || `https://ui-avatars.com/api/?name=${booking.tripId.driverId?.name}`}
                                                    className="w-6 h-6 rounded-full bg-slate-100"
                                                    alt="driver"
                                                />
                                                <p className="text-[10px] font-bold text-slate-500">{booking.tripId.driverId?.name}</p>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/payment`, { state: { trip: booking.tripId, bookingDetails: booking, isRetry: true } })}
                                                className="px-4 py-2 bg-slate-900 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                                            >
                                                Settle Payment
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <motion.div variants={itemVariants} className="lg:col-span-4 lg:sticky lg:top-32 space-y-8">
                        <div className="physical-glass p-10 !rounded-[3rem] border-transparent">
                            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Search className="w-6 h-6 text-emerald-500" /> Discover
                            </h2>
                            <div className="space-y-7">
                                <div className="space-y-3" ref={pickupRef}>
                                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Boarding Location</label>
                                    <div className="relative group">
                                        <MapPin className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 z-20 transition-all ${searchParams.pickupLat ? 'text-emerald-500 scale-110' : 'text-slate-300'}`} />
                                        <input
                                            ref={pickupInputRef}
                                            type="text"
                                            placeholder="Boarding City..."
                                            value={searchParams.pickupName}
                                            onFocus={updateRects}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSearchParams({ ...searchParams, pickupName: val, pickupLat: '', pickupLng: '' });
                                                fetchSuggestions(val, 'pickup');
                                                updateRects();
                                            }}
                                            className="w-full pl-14 pr-6 py-5 bg-white shadow-inner border-transparent rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 border border-slate-100 focus:border-emerald-500/20"
                                        />
                                        {searchingPickup && <div className="absolute right-5 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                    </div>
                                    <SuggestionPortal
                                        suggestions={pickupSuggestions}
                                        rect={pickupDropRect}
                                        onSelect={(s) => handleSelectSuggestion(s, 'pickup')}
                                        accentColor="emerald"
                                    />
                                </div>
                                <div className="space-y-3" ref={dropRef}>
                                    <label className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Target Destination</label>
                                    <div className="relative group">
                                        <Navigation className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 z-20 transition-all ${searchParams.dropLat ? 'text-indigo-500 scale-110' : 'text-slate-300'}`} />
                                        <input
                                            ref={dropInputRef}
                                            type="text"
                                            placeholder="Destination..."
                                            value={searchParams.dropName}
                                            onFocus={updateRects}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setSearchParams({ ...searchParams, dropName: val, dropLat: '', dropLng: '' });
                                                fetchSuggestions(val, 'drop');
                                                updateRects();
                                            }}
                                            className="w-full pl-14 pr-6 py-5 bg-white shadow-inner border-transparent rounded-[2rem] focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 border border-slate-100 focus:border-indigo-500/20"
                                        />
                                        {searchingDrop && <div className="absolute right-5 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                                    </div>
                                    <SuggestionPortal
                                        suggestions={dropSuggestions}
                                        rect={dropDropRect}
                                        onSelect={(s) => handleSelectSuggestion(s, 'drop')}
                                        accentColor="indigo"
                                    />
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="btn-premium w-full !rounded-[2rem] !py-5"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5 opacity-50" />}
                                    <span>Sync Mobility Grid</span>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">Recommended Fleet</h3>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {searchResults.length > 0 ? (
                                    searchResults.map((trip, idx) => (
                                        <motion.div
                                            key={trip._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => handleBook(trip)}
                                            className="premium-card p-8 !rounded-[3rem] physical-glass cursor-pointer group/card border-transparent"
                                        >
                                            <div className="flex justify-between items-start gap-8">
                                                <div className="flex-1 space-y-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 p-0.5 overflow-hidden group-hover/card:border-emerald-500/30 transition-all duration-500">
                                                            <img src={trip.driverId.profileImage || `https://ui-avatars.com/api/?name=${trip.driverId.name}`} alt="driver" className="w-full h-full object-cover rounded-xl" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-3">
                                                                <p className="font-extrabold text-slate-900 text-lg group-hover/card:text-emerald-600 transition-colors uppercase tracking-tight">{trip.driverId.name}</p>
                                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-100">Verified</span>
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 italic">
                                                                {new Date(trip.departureTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} at {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Fleet ID: {trip._id.substring(0, 6)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="relative pl-10 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                                        <div className="relative">
                                                            <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                                                            <p className="text-sm font-bold text-slate-600 truncate">{trip.startPoint.address}</p>
                                                        </div>
                                                        <div className="relative">
                                                            <div className="absolute -left-8 top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                            <p className="text-sm font-black text-slate-900 truncate">{trip.endPoint.address}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-6 min-w-[140px]">
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Standard Fare</p>
                                                        <p className="text-4xl font-[900] text-slate-900 tracking-tighter">₹{trip.pricePerSeat}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${trip.driverId.phone}`; }}
                                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-sm"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => { e.stopPropagation(); window.location.href = `sms:${trip.driverId.phone}`; }}
                                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-sm"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </motion.button>
                                                    </div>
                                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 group-hover/card:gap-4 transition-all">
                                                        Initiate Booking <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : hasSearched ? (
                                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                                        <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-xs">No Rides Found</p>
                                        <p className="text-[10px] mt-2">No trips match your route right now. Try a wider search or different locations.</p>
                                    </div>
                                ) : (
                                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                                        <Search className="w-10 h-10 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-xs">Set Your Route</p>
                                        <p className="text-[10px] mt-2">Enter pickup & destination above and search for available rides.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default PassengerDashboard;
