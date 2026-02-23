import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Settings, ShieldCheck, MapPinned, CreditCard,
    History, ChevronRight, Star, Leaf, ArrowRight,
    Navigation, TrendingUp, AlertCircle, Clock, CheckCircle, Download, Wallet, Banknote, MessageCircle, X,
    Plus, Trash2, Smartphone, QrCode
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import API from '../api';
import socket from '../socket';
import ProfileSidebar from '../components/ProfileSidebar';

const Profile = () => {
    const { user, setUser } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const queryTab = new URLSearchParams(location.search).get('tab');
    const [activeTab, setActiveTab] = useState(queryTab || location.state?.activeTab || 'Overview');

    useEffect(() => {
        if (queryTab) {
            setActiveTab(queryTab);
        }
    }, [queryTab]);
    const [myTrips, setMyTrips] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [tripBookings, setTripBookings] = useState([]);

    // Settings States
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [securityModalOpen, setSecurityModalOpen] = useState(false);
    const [verificationModalOpen, setVerificationModalOpen] = useState(false);
    const [editData, setEditData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        upiId: user?.upiId || ''
    });
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [updating, setUpdating] = useState(false);

    // Sync edit data when user changes
    useEffect(() => {
        if (user) {
            setEditData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                upiId: user.upiId || ''
            });
        }
    }, [user]);

    // UPI/Payment States
    const [linkedUpi, setLinkedUpi] = useState([]);
    const [showAddUpi, setShowAddUpi] = useState(false);
    const [newUpiHandle, setNewUpiHandle] = useState('');

    const handleAddUpi = (e) => {
        e.preventDefault();
        if (!newUpiHandle) return;
        setLinkedUpi([...linkedUpi, {
            id: Date.now().toString(),
            app: 'Custom UPI',
            handle: newUpiHandle,
            verified: true
        }]);
        setNewUpiHandle('');
        setShowAddUpi(false);
    };

    const handleDeleteUpi = (id) => {
        setLinkedUpi(linkedUpi.filter(upi => upi.id !== id));
    };

    const fetchData = async () => {
        if (!user) return;

        try {
            if (user.role === 'TRAVELLER') {
                const [tripsRes, bookingsRes, requestsRes] = await Promise.all([
                    API.get('/trips/my-trips'),
                    API.get('/bookings/my-bookings'),
                    API.get('/bookings/active-requests-v1')
                ]);
                setMyTrips(tripsRes.data);
                setMyBookings(bookingsRes.data);
                setPendingRequests(requestsRes.data);
            } else {
                // Passengers only need their bookings
                const { data } = await API.get('/bookings/my-bookings');
                setMyBookings(data);
                setMyTrips([]); // Passengers have no published trips
                setPendingRequests([]);
            }
        } catch (err) {
            console.error('Error fetching profile data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleCompleteTrip = async (tripId) => {
        try {
            setSelectedTripId(tripId);
            const { data } = await API.get(`/bookings/trip/${tripId}`);
            // Filter only accepted bookings
            const acceptedBookings = data.filter(b => b.status === 'ACCEPTED');
            setTripBookings(acceptedBookings);
            setPaymentModalOpen(true);
        } catch (err) {
            console.error(err);
            alert('Failed to fetch trip details.');
        }
    };

    const confirmCompletion = async () => {
        try {
            // 1. Complete Trip
            await API.patch(`/trips/${selectedTripId}/complete`);

            // 2. Refresh Data
            const [tripsRes, bookingsRes] = await Promise.all([
                API.get('/trips/my-trips'),
                API.get('/bookings/my-bookings')
            ]);
            setMyTrips(tripsRes.data);
            setMyBookings(bookingsRes.data);

            setPaymentModalOpen(false);
            setSelectedTripId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to complete trip. Please try again.');
        }
    };

    const togglePaymentStatus = async (bookingId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
            const { data } = await API.patch(`/bookings/${bookingId}/payment`, {
                paymentStatus: newStatus,
                paymentMethod: newStatus === 'PAID' ? 'CASH' : 'CASH' // Assume cash if manual override
            });

            setTripBookings(prev => prev.map(b => b._id === bookingId ? data : b));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestAction = async (bookingId, status) => {
        try {
            await API.patch(`/bookings/${bookingId}/status`, { status });
            // Refresh data
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Action failed');
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data } = await API.put('/auth/profile', editData);
            setUser(data);
            setInfoModalOpen(false);
            alert('Profile updated successfully');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return alert('Passwords do not match');
        }
        setUpdating(true);
        try {
            await API.put('/auth/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setSecurityModalOpen(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            alert('Password updated successfully');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Password update failed');
        } finally {
            setUpdating(false);
        }
    };

    const handleVerifyID = async () => {
        setUpdating(true);
        try {
            const { data } = await API.patch('/auth/verify-id');
            setUser(data);
            setVerificationModalOpen(false);
            alert('ID Verified successfully! Trust Score improved.');
        } catch (err) {
            console.error(err);
            alert('Verification failed');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="min-h-screen pt-20 sm:pt-32 pb-20 px-3 sm:px-6">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
                {/* Sidebar */}
                <div className="lg:w-1/4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-morphism p-2 sticky top-32 overflow-hidden"
                    >
                        <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === 'Overview' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}</h2>
                                <p className="text-sm text-slate-400 font-mono mb-4 bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                                    {user?.email}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                                <Leaf className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs text-slate-500">Lifetime</span>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">{user?.carbonSaved || 0}g</p>
                                        <p className="text-slate-500 text-sm">Carbon Saved</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">
                                            {user?.role === 'TRAVELLER' ? myTrips.length : myBookings.length}
                                        </p>
                                        <p className="text-slate-500 text-sm">
                                            {user?.role === 'TRAVELLER' ? 'Trips Published' : 'Rides Joined'}
                                        </p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                                <Star className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-3xl font-bold text-slate-900">{user?.ratingAvg || 5.0}</p>
                                        <p className="text-slate-500 text-sm">Average Rating</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'History' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900">Trip History</h2>
                                {user?.role === 'TRAVELLER' ? (
                                    myTrips.map(trip => (
                                        <div key={trip._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg font-bold text-slate-900">{trip.startPoint.address.split(',')[0]}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                                    <span className="text-lg font-bold text-slate-900">{trip.endPoint.address.split(',')[0]}</span>
                                                </div>
                                                <p className="text-sm text-slate-500">{new Date(trip.departureTime).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${trip.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {trip.status}
                                                </span>
                                                {(trip.status === 'OPEN' || trip.status === 'FULL') && (
                                                    <button
                                                        onClick={() => handleCompleteTrip(trip._id)}
                                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg transition-colors"
                                                    >
                                                        Complete Trip
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    myBookings.map(booking => (
                                        <div key={booking._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-lg font-bold text-slate-900">{booking.tripId?.startPoint.address.split(',')[0]}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-400" />
                                                    <span className="text-lg font-bold text-slate-900">{booking.tripId?.endPoint.address.split(',')[0]}</span>
                                                </div>
                                                <p className="text-sm text-slate-500">{new Date(booking.tripId?.departureTime).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500 mt-1">Driver: {booking.tripId?.driverId.name}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {booking.status}
                                                </span>
                                                <Link
                                                    to={`/trip/${booking.tripId?._id}`}
                                                    className="text-xs text-emerald-600 hover:underline"
                                                >
                                                    View Live Trip
                                                </Link>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {(user?.role === 'TRAVELLER' ? myTrips.length : myBookings.length) === 0 && (
                                    <div className="text-center py-12 text-slate-500">No trips found in history.</div>
                                )}
                            </div>
                        )}

                        {/* Add other tabs as placeholders or implement if needed */}
                        {activeTab === 'Requests' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900">Pending Requests</h2>
                                {pendingRequests.length === 0 ? (
                                    <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
                                        No pending requests at the moment.
                                    </div>
                                ) : (
                                    pendingRequests.map(req => (
                                        <div key={req._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden">
                                                    <img src={req.passengerId.profileImage || `https://ui-avatars.com/api/?name=${req.passengerId.name}&background=random`} alt="user" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{req.passengerId.name}</p>
                                                    <p className="text-sm text-slate-500">Request for {req.tripId.endPoint.address.split(',')[0]}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRequestAction(req._id, 'REJECTED')}
                                                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleRequestAction(req._id, 'ACCEPTED')}
                                                    className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'Payments' && (
                            <div className="space-y-8">
                                {/* UPI Methods Section */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-bold text-slate-900">Linked Payment Methods</h2>
                                        <button
                                            onClick={() => setShowAddUpi(true)}
                                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add UPI
                                        </button>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        {linkedUpi.map((upi) => (
                                            <div key={upi.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center group hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                                        <Smartphone className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{upi.app}</p>
                                                        <p className="text-xs text-slate-500 font-mono">{upi.handle}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] uppercase font-bold tracking-wider rounded-md">Verified</span>
                                                    <button
                                                        onClick={() => handleDeleteUpi(upi.id)}
                                                        className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100" />

                                <div className="space-y-6">
                                    <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {myBookings.filter(b => b.paymentStatus === 'PAID').map(booking => (
                                            <div key={booking._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                                        <CreditCard className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">₹{booking.fare}</p>
                                                        <p className="text-xs text-slate-500 uppercase tracking-wider">{booking.paymentMethod} • {new Date(booking.updatedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                        {myBookings.filter(b => b.paymentStatus === 'PAID').length === 0 && (
                                            <div className="text-center py-12 text-slate-500">No payment history found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Trust & Safety' && (
                            <div className="space-y-8">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold text-slate-900">Trust & Safety</h2>
                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">Elite Status</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                        <div className="relative z-10">
                                            <ShieldCheck className="w-12 h-12 text-blue-500 mb-4" />
                                            <h3 className="text-4xl font-bold mb-1 text-slate-900">{user?.trustScore}%</h3>
                                            <p className="text-slate-500 text-sm">Trust Score</p>
                                        </div>
                                        <div className="absolute top-0 right-0 p-16 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                    </div>
                                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                        <Star className="w-12 h-12 text-amber-500 mb-4" />
                                        <h3 className="text-4xl font-bold mb-1 text-slate-900">{user?.ratingAvg?.toFixed(1) || '5.0'}</h3>
                                        <p className="text-slate-500 text-sm">Average Rating</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                    <h4 className="font-bold mb-4 flex items-center gap-2 text-slate-900">
                                        <AlertCircle className={`w-4 h-4 ${user?.verified ? 'text-emerald-500' : 'text-amber-500'}`} /> Identity Verification
                                    </h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.verified ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                {user?.verified ? <CheckCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{user?.verified ? 'Government ID Verified' : 'ID Verification Pending'}</p>
                                                <p className="text-xs text-slate-500">
                                                    {user?.verified
                                                        ? `Verified on ${user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}`
                                                        : 'Connect your documents to unlock elite status'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        {!user?.verified && (
                                            <button
                                                onClick={() => setVerificationModalOpen(true)}
                                                className="text-xs text-blue-600 hover:text-blue-500 underline font-bold"
                                            >
                                                Complete Now
                                            </button>
                                        )}
                                        {user?.verified && (
                                            <button className="text-xs text-slate-500 cursor-not-allowed font-medium">Verified</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Settings' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-slate-900">Account Settings</h2>
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div
                                        onClick={() => setInfoModalOpen(true)}
                                        className="p-6 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:text-slate-900 transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">Personal Information</p>
                                                <p className="text-xs text-slate-500">Name, Email, Phone</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div
                                        onClick={() => setSecurityModalOpen(true)}
                                        className="p-6 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:text-slate-900 transition-colors">
                                                <ShieldCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">Security & Privacy</p>
                                                <p className="text-xs text-slate-500">Password, 2FA</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className="p-6 flex items-center justify-between hover:bg-red-50 cursor-pointer group text-red-500">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-red-50 rounded-lg">
                                                <AlertCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Deactivate Account</p>
                                                <p className="text-xs text-red-400">Permanently delete your profile</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Personal Info Modal */}
            <AnimatePresence>
                {infoModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                                    <User className="w-6 h-6 text-blue-600" /> Edit Profile
                                </h3>
                                <button onClick={() => setInfoModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">Full Name</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 transition-all outline-none font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">Email Address</label>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 transition-all outline-none font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="Your Phone Number"
                                            value={editData.phone}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 transition-all outline-none font-bold"
                                        />
                                    </div>
                                    {user?.role === 'TRAVELLER' && (
                                        <div>
                                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">UPI ID (for receiving payments)</label>
                                            <input
                                                type="text"
                                                placeholder="username@bank"
                                                value={editData.upiId}
                                                onChange={(e) => setEditData({ ...editData, upiId: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-blue-500 transition-all outline-none font-bold font-mono"
                                            />
                                            <p className="text-[9px] text-slate-400 mt-2 ml-1">Example: 9876543210@ybl or sunnypay@oksbi</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                                >
                                    {updating ? 'Saving Changes...' : 'Confirm Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Security Modal */}
            <AnimatePresence>
                {securityModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                                    <ShieldCheck className="w-6 h-6 text-indigo-500" /> Security Settings
                                </h3>
                                <button onClick={() => setSecurityModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleChangePassword} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">Current Password</label>
                                        <input
                                            type="password"
                                            placeholder="Current Password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-indigo-500 transition-all outline-none font-bold"
                                            required
                                        />
                                    </div>
                                    <div className="h-px bg-slate-100 mx-4" />
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">New Password</label>
                                        <input
                                            type="password"
                                            placeholder="New Password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-indigo-500 transition-all outline-none font-bold"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">Confirm New Password</label>
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-indigo-500 transition-all outline-none font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-indigo-500/20 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                                >
                                    {updating ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* ID Verification Modal */}
            <AnimatePresence>
                {verificationModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-2xl font-black flex items-center gap-3 text-slate-900">
                                    <ShieldCheck className="w-6 h-6 text-emerald-500" /> Verify Identity
                                </h3>
                                <button onClick={() => setVerificationModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                                    <p className="text-sm font-bold text-blue-600">Identity Verification</p>
                                    <p className="text-xs text-slate-500 leading-relaxed">Verifying your ID unlocks premium features, increases your trust score by +10%, and ensures a safer community for everyone.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 group hover:bg-slate-100 hover:border-emerald-500/20 transition-all cursor-pointer">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                            <Download className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-900">Upload Government ID</p>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 mt-2">PDF, PNG, JPG (Max 5MB)</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setVerificationModalOpen(false)}
                                        className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded-2xl transition-all uppercase tracking-widest text-[10px]"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleVerifyID}
                                        disabled={updating}
                                        className="flex-[2] py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-[10px] disabled:opacity-50"
                                    >
                                        {updating ? 'Verifying...' : 'Begin Verification'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add UPI Modal */}
            <AnimatePresence>
                {showAddUpi && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white border border-slate-200 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-xl font-black flex items-center gap-2 text-slate-900">
                                    <QrCode className="w-5 h-5 text-emerald-500" /> Link UPI ID
                                </h3>
                                <button onClick={() => setShowAddUpi(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                            <form onSubmit={handleAddUpi} className="p-6 space-y-6">
                                <div>
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 block">UPI Address</label>
                                    <input
                                        type="text"
                                        placeholder="username@bank"
                                        value={newUpiHandle}
                                        onChange={(e) => setNewUpiHandle(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-900 focus:border-emerald-500 transition-all outline-none font-bold placeholder:text-slate-300"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-[0.2em] text-xs"
                                >
                                    Verify & Link
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
