import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Car, CreditCard, Upload,
    CheckCircle, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import useAuthStore from '../store/useAuthStore';

const DriverVerification = () => {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(user?.verificationStatus === 'PENDING');

    const [formData, setFormData] = useState({
        licenseNumber: user?.verificationDetails?.licenseNumber || '',
        vehiclePlate: user?.verificationDetails?.vehiclePlate || '',
        vehicleModel: user?.verificationDetails?.vehicleModel || '',
        documentUrl: user?.verificationDetails?.documentUrl || 'https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=300' // Mock doc
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await API.post('/auth/verify-vehicle', formData);
            setUser(data);
            setSubmitted(true);
        } catch (err) {
            console.error(err);
            alert('Verification submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (user?.verificationStatus === 'VERIFIED') {
        return (
            <div className="min-h-screen pt-32 px-6 bg-slate-50 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-emerald-500/20 text-center"
                >
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">You are Verified!</h2>
                    <p className="text-slate-500 mb-8">Your account is fully verified. You can now publish rides and earn trust points.</p>
                    <button
                        onClick={() => navigate('/traveller-dashboard')}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Go to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen pt-32 px-6 bg-slate-50 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-xl border border-blue-500/20 text-center"
                >
                    <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Verification Pending</h2>
                    <p className="text-slate-500 mb-8">Our team is reviewing your documents. This usually takes 24-48 hours. We'll notify you once it's done.</p>
                    <button
                        onClick={() => navigate('/traveller-dashboard')}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        Back to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-20 px-6 bg-slate-50">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold mb-8 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Vehicle Verification</h1>
                    <p className="text-slate-500 text-lg">Submit your details to start publishing rides safely.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Enhanced Trust</h3>
                        <p className="text-xs text-slate-500 mt-1">Verified drivers get 3x more bookings.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                            <Car className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Safety First</h3>
                        <p className="text-xs text-slate-500 mt-1">Your data is encrypted and kept private.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Priority Support</h3>
                        <p className="text-xs text-slate-500 mt-1">Verified users get priority concierge desk access.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Driving License Number</label>
                            <div className="relative">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter DL Number"
                                    value={formData.licenseNumber}
                                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Vehicle Model</label>
                            <div className="relative">
                                <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Tesla Model 3"
                                    value={formData.vehicleModel}
                                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Number Plate (Vehicle Plate)</label>
                            <div className="relative">
                                <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    placeholder="KA-01-AB-1234"
                                    value={formData.vehiclePlate}
                                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 transition-all font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 pl-1">Upload Documents (DL & Vehicle RC)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center hover:border-emerald-500/50 transition-all cursor-pointer bg-slate-50">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Upload className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="font-bold text-slate-900">Click to upload or drag & drop</p>
                                <p className="text-xs text-slate-500 mt-2">Maximum file size 10MB (JPG, PNG, PDF)</p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                        Submit for Verification
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DriverVerification;
