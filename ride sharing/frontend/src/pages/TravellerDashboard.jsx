import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Users, TrendingUp, ShieldCheck, MapPin,
    Calendar, Clock, ArrowRight, Wallet, CheckCircle,
    Zap, Globe, Navigation, Search, Filter,
    Activity, LayoutGrid, List, X, Loader2, MessageCircle, Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import useAuthStore from '../store/useAuthStore';
import socket from '../socket';
import TravellerMap from '../components/TravellerMap';

const TravellerDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        revenue: 0,
        rides: 0,
        passengers: 0,
        trustScore: 100
    });
    const [publishedTrips, setPublishedTrips] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'map'

    const fetchData = async () => {
        try {
            const [tripsRes, requestsRes] = await Promise.all([
                API.get('/trips/my-trips'),
                API.get('/bookings/active-requests-v1')
            ]);

            setPublishedTrips(tripsRes.data.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime)));
            setPendingRequests(requestsRes.data.filter(r => r.tripId && r.tripId.status !== 'COMPLETED' && r.tripId.status !== 'CANCELLED'));

            // Calculate Stats
            const revenue = tripsRes.data.reduce((sum, t) => sum + (t.totalExpenses || 0), 0);
            const rides = tripsRes.data.length;
            const score = user.trustScore || 100;

            setStats({ revenue, rides, passengers: 0, trustScore: score });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        socket.on('newNotification', () => {
            fetchData();
        });

        return () => {
            socket.off('newNotification');
        };
    }, [user]);

    const handleRequestAction = async (bookingId, status) => {
        try {
            await API.patch(`/bookings/${bookingId}/status`, { status });
            fetchData(); // Reload all data
        } catch (err) {
            console.error(err);
            alert('Trip update failed');
        }
    };

    const handleCreateTrip = () => {
        navigate('/create-trip');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100 }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pt-32 sm:pt-40 px-3 sm:px-4 pb-20 selection:bg-blue-500/30">
            {/* Background Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-8 sm:space-y-12 relative z-10"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-slate-200/50">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">TrackMate Control</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-[800] text-slate-900 tracking-tight leading-[0.9]">
                            Traveller <span className="text-blue-500">Terminal</span>
                        </h1>
                        <p className="text-slate-400 font-semibold text-lg max-w-lg mt-4 leading-relaxed">Precision coordination and resource management for your active network.</p>
                    </div>

                    <motion.button
                        layoutId="publish-button"
                        onClick={handleCreateTrip}
                        whileHover={{ scale: 1.05, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-premium !bg-blue-600 !shadow-blue-500/20"
                    >
                        <Plus className="w-5 h-5 opacity-50" />
                        <span>Publish New Mission</span>
                    </motion.button>
                </motion.div>

                {/* Performance Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Asset Revenue', value: stats.revenue, prefix: '₹', icon: Wallet, color: 'emerald', trend: '+12%' },
                        { label: 'Successful Hubs', value: stats.rides, icon: TrendingUp, color: 'blue' },
                        { label: 'Trust Index', value: stats.trustScore, suffix: '%', icon: ShieldCheck, color: 'indigo', badge: 'Elite' },
                        { label: 'Network Output', value: stats.passengers, icon: Users, color: 'amber' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -8, scale: 1.02, rotateX: 2, rotateY: 2 }}
                            whileTap={{ scale: 0.98 }}
                            className="physical-glass p-8 !rounded-[2.5rem] premium-card cursor-pointer border-transparent"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                {stat.trend && <span className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-1 rounded-full font-black tracking-widest border border-emerald-100/50">{stat.trend}</span>}
                                {stat.badge && <span className="bg-indigo-50 text-indigo-600 text-[10px] px-3 py-1 rounded-full font-black tracking-widest border border-indigo-100/50">{stat.badge}</span>}
                            </div>
                            <h3 className="text-4xl font-[900] text-slate-900 tracking-tighter mb-1">
                                {stat.prefix}{stat.value.toLocaleString()}{stat.suffix}
                            </h3>
                            <p className="text-slate-400 text-[11px] uppercase font-black tracking-[0.2em]">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* INCOMING REQUESTS DECK */}
                {pendingRequests.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-8">
                        <div className="flex items-center gap-4 px-2">
                            <h2 className="text-2xl font-[900] text-slate-900 italic tracking-tighter">Personnel Queue</h2>
                            <div className="h-px flex-1 bg-slate-200/50 mx-4" />
                            <span className="px-4 py-1.5 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-pulse border border-rose-100">
                                {pendingRequests.length} Pending Actions
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <AnimatePresence mode="popLayout">
                                {pendingRequests.map((req) => (
                                    <motion.div
                                        key={req._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="physical-glass p-8 !rounded-[3rem] flex items-center justify-between group hover:border-blue-500/30 transition-all shadow-2xl shadow-slate-200/20"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className="w-16 h-16 rounded-2xl bg-white shadow-inner border border-slate-100 p-0.5 overflow-hidden">
                                                    <img
                                                        src={req.passengerId.profileImage || `https://ui-avatars.com/api/?name=${req.passengerId.name}&background=random`}
                                                        alt="passenger"
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-500 rounded-xl border-4 border-white shadow-lg">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-[900] text-slate-900 tracking-tight uppercase">{req.passengerId.name}</h4>
                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mt-0.5 mt-1">
                                                    Requesting {req.seatsBooked} Slot(s)
                                                </p>
                                                <div className="flex items-center gap-2 mt-3 p-1.5 px-3 bg-slate-50 rounded-lg w-fit border border-slate-100">
                                                    <Navigation className="w-3 h-3 text-blue-500" />
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[120px]">
                                                        {req.tripId.endPoint.address.split(',')[0]}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleRequestAction(req._id, 'ACCEPTED')}
                                                    className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all border border-emerald-400/20"
                                                    title="Accept"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleRequestAction(req._id, 'REJECTED')}
                                                    className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                                                    title="Decline"
                                                >
                                                    <X className="w-5 h-5" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => window.location.href = `tel:${req.passengerId.phone}`}
                                                    className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-all border border-slate-700"
                                                    title="Comms"
                                                >
                                                    <Phone className="w-5 h-5" />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => window.location.href = `sms:${req.passengerId.phone}`}
                                                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                                                    title="Message"
                                                >
                                                    <MessageCircle className="w-5 h-5" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}

                {/* Trip Management Deck */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                            <h2 className="text-2xl font-[900] text-slate-900 italic tracking-tighter uppercase whitespace-nowrap">Active Operations</h2>
                            <div className="flex gap-3 bg-white p-1.5 rounded-[1.25rem] border border-slate-100 shadow-sm hidden sm:flex">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`p-2.5 rounded-xl transition-all ${viewMode === 'map' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
                                >
                                    <Globe className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors">
                            <Filter className="w-4 h-4" /> System Filter
                        </button>
                    </div>

                    <div className={viewMode === 'grid' ? "grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8" : viewMode === 'list' ? "space-y-4" : "h-[600px] w-full"}>
                        <AnimatePresence mode="popLayout">
                            {viewMode === 'map' ? (
                                <motion.div
                                    key="map-view"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full h-full"
                                >
                                    <TravellerMap trips={publishedTrips} onSelectTrip={(id) => navigate(`/trip/${id}`)} />
                                </motion.div>
                            ) : (
                                <React.Fragment key="list-grid-view">
                                    {publishedTrips.filter(t =>
                                        !['COMPLETED', 'CANCELLED'].includes(t.status)
                                    ).map((trip, idx) => (
                                        <motion.div
                                            key={trip._id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`physical-glass premium-card !rounded-[3rem] p-10 flex group transition-all border-transparent ${viewMode === 'grid' ? 'flex-col justify-between' : 'flex-row items-center justify-between gap-10 py-8'}`}
                                        >
                                            <div className={`flex justify-between items-start ${viewMode === 'grid' ? 'mb-12 w-full' : 'flex-1'}`}>
                                                <div className="flex-1 space-y-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="relative">
                                                            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-50 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
                                                            <div className={`absolute left-[5.5px] top-[10px] w-0.5 border-l-2 border-dashed border-slate-100 ${viewMode === 'grid' ? 'h-20' : 'h-10'}`} />
                                                            <div className={`w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.6)] ${viewMode === 'grid' ? 'mt-20' : 'mt-10'}`} />
                                                        </div>
                                                        <div className={viewMode === 'grid' ? "space-y-12" : "flex items-center gap-12"}>
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Departure Origin</p>
                                                                <p className="text-xl font-[900] text-slate-900 leading-none uppercase tracking-tight">{trip.startPoint.address.split(',')[0]}</p>
                                                            </div>
                                                            {viewMode === 'list' && <ArrowRight className="w-5 h-5 text-slate-200" />}
                                                            <div>
                                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Target Endpoint</p>
                                                                <p className="text-xl font-[900] text-slate-900 leading-none uppercase tracking-tight">{trip.endPoint.address.split(',')[0]}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-[9px] uppercase font-black tracking-[0.3em] text-slate-300 mb-3 whitespace-nowrap">Status: {trip.status}</p>
                                                    <span className={`px-5 py-2 rounded-2xl text-[10px] font-black tracking-widest uppercase border ${trip.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                        {trip.status === 'OPEN' ? 'Live on Grid' : 'Standard Flux'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={`flex items-center justify-between ${viewMode === 'grid' ? 'pt-10 border-t border-slate-100/50' : 'pl-10 border-l border-slate-100/50'}`}>
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Yield / Seat</p>
                                                        <p className="text-3xl font-[900] text-slate-900 tracking-tighter">₹{trip.pricePerSeat}</p>
                                                    </div>
                                                    {viewMode === 'grid' && (
                                                        <div className="flex gap-4">
                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Occupancy</p>
                                                                <p className="text-sm font-black text-slate-900">{(trip.totalSeats || 4) - (trip.availableSeats || 0)} / {trip.totalSeats || 4}</p>
                                                            </div>
                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white transition-colors">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Telemetry</p>
                                                                <p className="text-sm font-black text-slate-900">{(trip.distance / 1000).toFixed(0)}km</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, rotate: 10 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => navigate(`/trip/${trip._id}`)}
                                                        className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-sm"
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => navigate(`/trip/${trip._id}`)}
                                                        className="btn-premium !rounded-2xl !py-3.5 !px-8 !text-[11px] !tracking-[0.2em]"
                                                    >
                                                        Command
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}

                                    {publishedTrips.filter(t =>
                                        !['COMPLETED', 'CANCELLED'].includes(t.status)
                                    ).length === 0 && !loading && (
                                            <div className="lg:col-span-2 py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 shadow-xl shadow-slate-200/50">
                                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                                    <Plus className="w-10 h-10 text-slate-400" />
                                                </div>
                                                <h3 className="text-3xl font-black text-slate-900 mb-4">No Active Trips</h3>
                                                <p className="text-slate-500 text-lg max-w-sm mx-auto mb-10">You haven't posted any trips yet. Share your first trip today.</p>
                                                <button
                                                    onClick={handleCreateTrip}
                                                    className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest"
                                                >
                                                    Publish First Trip
                                                </button>
                                            </div>
                                        )}
                                </React.Fragment>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default TravellerDashboard;
