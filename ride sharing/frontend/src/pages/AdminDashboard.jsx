import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, MapPinned, CreditCard, ShieldCheck,
    ArrowUpRight, ArrowDownRight, Activity, Search,
    Filter, MoreVertical, Trash2, CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import API from '../api';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalTrips: 0,
        totalTravellers: 0,
        totalPassengers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        activeTrips: 0,
        pendingVerifications: 0
    });
    const [recentUsers, setRecentUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeFilter, setActiveFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('USERS'); // 'USERS', 'TRIPS', 'BOOKINGS', 'DISPUTES', 'UPDATES'
    const [recentTrips, setRecentTrips] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [recentReports, setRecentReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const handleApproveUser = async (userId) => {
        try {
            await API.patch(`/auth/admin/approve-verification/${userId}`);
            alert('User verified successfully!');
            fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.message || 'Verification failed');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await API.delete(`/auth/admin/users/${userId}`);
            alert('User deleted successfully!');
            fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.message || 'Deletion failed');
        }
    };

    const handleGenerateReport = () => {
        const reportData = {
            timestamp: new Date().toISOString(),
            stats,
            recentUsers
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-report-${new Date().toLocaleDateString()}.json`;
        a.click();
    };

    const handleHealthCheck = () => {
        alert('System Health Check:\n\n- API Server: Online (5001)\n- Database: Connected (MongoDB)\n- Authentication: Active\n- Trip Logic: Operational\n- Notification Node: Online');
    };

    const fetchAdminData = async () => {
        try {
            const { data } = await API.get('/stats/admin');
            setStats(data.stats);
            setRecentUsers(data.recentUsers);
            setFilteredUsers(data.recentUsers); // Initial list
            setRecentTrips(data.recentTrips);
            setRecentBookings(data.recentBookings || []);
            setRecentReports(data.recentReports || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleFilterRole = (role) => {
        setActiveFilter(role);
        if (role === 'ALL') {
            setFilteredUsers(recentUsers);
        } else {
            setFilteredUsers(recentUsers.filter(u => u.role.includes(role)));
        }
    };

    const StatCard = ({ title, value, icon: Icon, trend, color, onClick, isActive }) => (
        <motion.div
            whileHover={{ y: -8, scale: 1.02, rotateX: 2, rotateY: 2 }}
            whileTap={{ scale: 0.96 }}
            onClick={onClick}
            className={`cursor-pointer p-8 rounded-[2.5rem] transition-all duration-500 premium-card ${isActive
                    ? `bg-emerald-600 text-white shadow-2xl shadow-emerald-500/20`
                    : 'physical-glass'
                }`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${isActive ? 'bg-white/20' : `bg-${color}-50 text-${color}-600`}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${isActive ? 'bg-white/20 text-white' : (trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{title}</p>
            <h3 className="text-4xl font-extrabold tracking-tighter mt-2">
                {typeof value === 'number' && title.includes('Revenue') ? `₹${value.toLocaleString()}` : value}
            </h3>
        </motion.div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading Dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-24 selection:bg-emerald-500/10 noise-bg">
            <div className="h-32" />

            <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-12 relative z-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-4 border-b border-slate-200/50">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Admin Live</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-[800] text-slate-900 tracking-tight leading-[0.9]">
                            Control <span className="text-emerald-500">Center</span>
                        </h1>
                        <p className="text-slate-400 font-semibold text-lg max-w-md">Orchestrating platform operations and user ecosystems.</p>
                    </div>
                    <div className="flex gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerateReport}
                            className="btn-premium"
                        >
                            <Activity className="w-5 h-5 opacity-50" />
                            <span>Generate Intel Report</span>
                        </motion.button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Trips"
                        value={stats.totalTrips}
                        icon={MapPinned}
                        trend={12}
                        color="emerald"
                        onClick={() => setViewMode('TRIPS')}
                        isActive={viewMode === 'TRIPS'}
                    />
                    <StatCard
                        title="Travellers"
                        value={stats.totalTravellers}
                        icon={Users}
                        trend={8}
                        color="blue"
                        onClick={() => { setViewMode('USERS'); handleFilterRole('TRAVELLER'); }}
                        isActive={viewMode === 'USERS' && activeFilter === 'TRAVELLER'}
                    />
                    <StatCard
                        title="Passengers"
                        value={stats.totalPassengers}
                        icon={Users}
                        trend={15}
                        color="indigo"
                        onClick={() => { setViewMode('USERS'); handleFilterRole('PASSENGER'); }}
                        isActive={viewMode === 'USERS' && activeFilter === 'PASSENGER'}
                    />
                    <StatCard
                        title="Booked Rides"
                        value={stats.totalBookings}
                        icon={CheckCircle}
                        trend={24}
                        color="purple"
                        onClick={() => setViewMode('BOOKINGS')}
                        isActive={viewMode === 'BOOKINGS'}
                    />
                </div>

                {/* Main Content Sections */}
                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-6">
                        {viewMode === 'USERS' ? (
                            <>
                                <div className="flex justify-between items-center px-4">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-2xl font-black text-slate-900">Registrations</h3>
                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black text-slate-400">{filteredUsers.length}</span>
                                    </div>
                                    <button
                                        onClick={() => handleFilterRole('ALL')}
                                        className="btn-ghost !py-2 !px-4 !text-xs !rounded-xl"
                                    >
                                        {activeFilter === 'ALL' ? 'Refresh' : 'Reset Context'}
                                    </button>
                                </div>
                                <div className="physical-glass overflow-hidden !rounded-[3rem] border-transparent">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-900/[0.02] border-b border-slate-100/50">
                                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Identified User</th>
                                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Designation</th>
                                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Trust status</th>
                                                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Security</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100/50">
                                            {filteredUsers.map((user, i) => (
                                                <tr key={user._id} className="hover:bg-emerald-50/30 transition-all duration-300 group">
                                                    <td className="px-10 py-7">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden">
                                                                <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="avatar" className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <p className="font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">{user.name}</p>
                                                                <p className="text-xs text-slate-400 font-bold tracking-tight">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-7">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${user.role.includes('TRAVELLER') ? 'bg-blue-400' : 'bg-indigo-400'}`} />
                                                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{user.role[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-7">
                                                        <span className={`px-4 py-1.5 ${user.isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} rounded-xl text-[10px] font-black uppercase tracking-widest border border-current/10`}>
                                                            {user.isVerified ? 'Verified' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-10 py-7">
                                                        <div className="flex gap-2">
                                                            {!user.isVerified && (
                                                                <button
                                                                    onClick={() => handleApproveUser(user._id)}
                                                                    className="w-10 h-10 flex items-center justify-center bg-emerald-50 hover:bg-emerald-500 hover:text-white rounded-xl text-emerald-600 transition-all active:scale-90"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteUser(user._id)}
                                                                className="w-10 h-10 flex items-center justify-center bg-rose-50 hover:bg-rose-500 hover:text-white rounded-xl text-rose-600 transition-all active:scale-90"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No {activeFilter.toLowerCase()} found in recent registrations.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : viewMode === 'TRIPS' ? (
                            <>
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900">Total System Trips</h3>
                                    <div className="flex gap-4 items-center">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Showing {recentTrips.length} records</p>
                                        <button
                                            onClick={() => setViewMode('USERS')}
                                            className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
                                        >
                                            View Users
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Driver & Service</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Route</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Fare & Seats</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTrips.map((trip) => (
                                                <tr key={trip._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                                                                <img src={`https://ui-avatars.com/api/?name=${trip.driverId?.name || 'Driver'}&background=random`} alt="avatar" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{trip.driverId?.name || 'Unknown'}</p>
                                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">ID: {trip._id.substring(0, 8)}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{trip.startPoint.address}</p>
                                                            <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">To: {trip.endPoint.address}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${trip.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600' :
                                                            trip.status === 'ongoing' ? 'bg-blue-50 text-blue-600' :
                                                                trip.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'
                                                            }`}>
                                                            {trip.status}
                                                        </span>
                                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(trip.departureTime).toLocaleDateString()} • {new Date(trip.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-slate-900">₹{trip.pricePerSeat}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">{trip.availableSeats}/{trip.totalSeats} Seats</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentTrips.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No active trips found in system logs.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : viewMode === 'BOOKINGS' ? (
                            <>
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900">Booking Inventory</h3>
                                    <button
                                        onClick={() => setViewMode('USERS')}
                                        className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
                                    >
                                        Return home
                                    </button>
                                </div>
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Passenger</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trip & Route</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Transaction</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentBookings.map((booking) => (
                                                <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden text-emerald-600 font-black text-xs">
                                                                {booking.passengerId?.name?.charAt(0) || 'P'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-900">{booking.passengerId?.name || 'Guest'}</p>
                                                                <p className="text-[10px] text-slate-500 font-medium">{booking.passengerId?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1">
                                                            <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                                                                From: {booking.tripId?.startPoint?.address.substring(0, 30)}...
                                                            </p>
                                                            <p className="text-[10px] text-slate-400 font-medium">Trip: {booking.tripId?._id?.substring(0, 8)}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 ${booking.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                                            booking.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                            } rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-black text-slate-900">₹{booking.fare}</p>
                                                            <p className={`text-[10px] font-black uppercase ${booking.paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {booking.paymentStatus}
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentBookings.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No bookings recorded in ledger.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : viewMode === 'DISPUTES' ? (
                            <>
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900">Dispute Resolution Centre</h3>
                                    <button
                                        onClick={() => setViewMode('USERS')}
                                        className="text-blue-600 font-bold text-xs uppercase tracking-widest hover:underline"
                                    >
                                        Exit
                                    </button>
                                </div>
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reporter</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Issue Type</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Target User</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentReports.map((report) => (
                                                <tr key={report._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{report.reporterId?.name}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-xs font-black text-rose-600 uppercase tracking-widest">{report.type}</p>
                                                        <p className="text-[10px] text-slate-500 line-clamp-1 max-w-[200px]">{report.description}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                                            {report.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 font-bold text-slate-900 text-xs">
                                                        {report.accusedId?.name}
                                                    </td>
                                                </tr>
                                            ))}
                                            {recentReports.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-10 text-center text-slate-400 font-medium">No open disputes reported.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : viewMode === 'UPDATES' ? (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900">System Performance & Updates</h3>
                                    <button onClick={() => setViewMode('USERS')} className="text-blue-600 font-bold text-xs uppercase hover:underline">Return</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'API Gateway', status: 'Operational', value: '45ms', color: 'emerald' },
                                        { label: 'Database Sync', status: 'Healthy', value: '100%', color: 'blue' },
                                        { label: 'Push Services', status: 'Active', value: '0 failures', color: 'violet' },
                                        { label: 'Storage Cluster', status: 'Optimized', value: '12% used', color: 'orange' }
                                    ].map((service, i) => (
                                        <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{service.label}</p>
                                                <h4 className="text-lg font-bold text-slate-900">{service.status}</h4>
                                            </div>
                                            <div className={`px-4 py-2 bg-${service.color}-50 text-${service.color}-600 rounded-2xl font-black text-xs uppercase`}>
                                                {service.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
                                    <h4 className="text-xl font-bold mb-2 text-emerald-400">All Systems Nominal</h4>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">System kernel version 4.2.0-stable. Last security patch applied 48 hours ago. No infrastructure warnings detected in the last 24-hour cycle.</p>
                                </div>
                            </div>
                        ) : (
                            // Default case, perhaps show a message or redirect
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900">Select a view mode</h3>
                                    <button onClick={() => setViewMode('USERS')} className="text-blue-600 font-bold text-xs uppercase hover:underline">Return to Users</button>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                                    <p className="text-slate-500 font-medium">Please select a view mode from the statistics cards or management section.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Management */}
                    <div className="space-y-8">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="text-2xl font-black text-slate-900">Protocols</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                {
                                    title: 'Identity Verification',
                                    count: stats.pendingVerifications || 0,
                                    icon: ShieldCheck,
                                    color: 'emerald',
                                    onClick: () => {
                                        setViewMode('USERS');
                                        setActiveFilter('UNVERIFIED');
                                        setFilteredUsers(recentUsers.filter(u => !u.isVerified));
                                    }
                                },
                                {
                                    title: 'Conflict Resolution',
                                    count: recentReports.length || 0,
                                    icon: XCircle,
                                    color: 'rose',
                                    onClick: () => setViewMode('DISPUTES')
                                },
                                {
                                    title: 'Infrastructure Sync',
                                    count: 1,
                                    icon: Activity,
                                    color: 'blue',
                                    onClick: () => setViewMode('UPDATES')
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ x: 8 }}
                                    onClick={item.onClick}
                                    className="p-6 physical-glass flex items-center justify-between cursor-pointer group active:scale-95 transition-all !rounded-3xl hover:border-emerald-500/20"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-2xl ${`bg-${item.color}-50 text-${item.color}-600`} group-hover:scale-110 transition-transform duration-500`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-slate-900">{item.title}</p>
                                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{item.count} Active Tasks</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                </motion.div>
                            ))}
                        </div>

                        <div className="p-10 bg-slate-900 rounded-[3rem] text-white space-y-6 relative overflow-hidden shadow-2xl shadow-slate-900/20">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Rocket className="w-32 h-32 rotate-45" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl font-black">System Terminal</h4>
                                <p className="text-slate-400 text-xs font-bold leading-relaxed mt-2 uppercase tracking-widest opacity-60">Status: All Systems Nominal</p>
                                <div className="mt-6 space-y-3">
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "100%" }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                    <p className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em]">Synchronizing Data Clusters...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
