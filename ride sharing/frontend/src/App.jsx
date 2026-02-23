import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import useAuthStore from './store/useAuthStore';
import API from './api';

// Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import TravellerDashboard from './pages/TravellerDashboard';
import PassengerDashboard from './pages/PassengerDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import LiveTrip from './pages/LiveTrip';
import DriverVerification from './pages/DriverVerification';
import CreateTrip from './pages/CreateTrip';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

// Components
import Navbar from './components/Navbar';
import NotificationCenter from './components/NotificationCenter';
import PageWrapper from './components/PageWrapper';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuthStore();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) return <Navigate to="/login" />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

const App = () => {
    const { checkAuth } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen relative overflow-x-hidden font-sans selection:bg-emerald-500/30">
            <Navbar />

            {/* Floating Notification Center */}
            <div className="fixed top-24 right-6 z-50">
                <NotificationCenter />
            </div>

            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                    <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                    <Route path="/register" element={<PageWrapper><Register /></PageWrapper>} />
                    <Route path="/forgot-password" element={<PageWrapper><ForgotPassword /></PageWrapper>} />

                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <PageWrapper><Profile /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard/traveller" element={
                        <ProtectedRoute allowedRoles={['TRAVELLER']}>
                            <PageWrapper><TravellerDashboard /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard/passenger" element={
                        <ProtectedRoute allowedRoles={['PASSENGER']}>
                            <PageWrapper><PassengerDashboard /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/trip/:id" element={
                        <ProtectedRoute>
                            <PageWrapper><LiveTrip /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/verification" element={
                        <ProtectedRoute>
                            <PageWrapper><DriverVerification /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/create-trip" element={
                        <ProtectedRoute allowedRoles={['TRAVELLER']}>
                            <PageWrapper><CreateTrip /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/payment" element={
                        <ProtectedRoute allowedRoles={['PASSENGER']}>
                            <PageWrapper><Payment /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/login" element={<PageWrapper><AdminLogin /></PageWrapper>} />

                    <Route path="/dashboard/admin" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <PageWrapper><AdminDashboard /></PageWrapper>
                        </ProtectedRoute>
                    } />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </AnimatePresence>
        </div>
    );
};

export default App;
