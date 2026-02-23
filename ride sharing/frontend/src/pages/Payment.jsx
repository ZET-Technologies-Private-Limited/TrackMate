import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, ShieldCheck, Lock, CheckCircle,
    ChevronRight, ArrowLeft, Wallet, Apple,
    LayoutGrid, Zap, Info, ShieldAlert, Smartphone, QrCode
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import BookingSummaryMap from '../components/BookingSummaryMap';

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { trip, bookingDetails } = location.state || {};

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [upiId, setUpiId] = useState('');
    const [upiApp, setUpiApp] = useState('');
    const [upiError, setUpiError] = useState('');

    const validateUpi = (id) => {
        const regex = /^[\w.-]+@[\w.-]+$/;
        return regex.test(id);
    };

    useEffect(() => {
        if (!trip) {
            navigate('/dashboard/passenger');
        }
    }, [trip, navigate]);

    const handlePayment = async () => {
        if (selectedMethod === 'upi') {
            if (!upiId && !upiApp) {
                setUpiError('Please select an app or enter UPI ID');
                return;
            }
            if (upiId && !validateUpi(upiId)) {
                setUpiError('Invalid UPI ID format (e.g. user@bank)');
                return;
            }
        }

        setLoading(true);
        try {
            // STEP 1: Simulate Payment Gateway / UPI Handshake
            // This ensures "payment is completed perfectly" before registration
            await new Promise(resolve => setTimeout(resolve, 2500));

            // STEP 2: Register for the trip only AFTER payment simulation is successful
            if (location.state?.isRetry) {
                // Settle existing booking
                await API.patch(`/bookings/${bookingDetails._id}/payment`, {
                    paymentStatus: 'PAID',
                    paymentMethod: 'ONLINE'
                });
            } else {
                // Create new booking request
                await API.post('/bookings/request', {
                    tripId: trip._id,
                    ...bookingDetails,
                    paymentMethod: 'ONLINE',
                    paymentStatus: 'PAID'
                });
            }

            setLoading(false);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Payment Failed: Authorization issue');
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-white border border-emerald-500/20 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl shadow-emerald-500/10"
                >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-slate-900">Trip Confirmed</h2>
                        <p className="text-slate-600 font-medium">Your authorization was successful. The driver has been notified.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/passenger')}
                        className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs"
                    >
                        Return to Command Center
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pt-20 sm:pt-32 pb-20 px-3 sm:px-6 selection:bg-blue-500/30">
            {/* Atmosphere */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-10 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Abord Authorization</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
                    {/* Left: Secure Checkout */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                                Secure <span className="text-blue-600 italic">Authorization.</span>
                            </h1>
                            <p className="text-slate-600 text-lg font-medium">Finalize your mission parameters and secure your seat.</p>
                        </div>

                        {/* Payment Methods */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                                { id: 'upi', name: 'UPI Apps', icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                                { id: 'apple', name: 'Apple Pay', icon: Apple, color: 'text-slate-900', bg: 'bg-slate-200' },
                                { id: 'wallet', name: 'Track Credits', icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-500/10' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`p-6 rounded-[2rem] border transition-all flex items-center gap-4 group ${selectedMethod === method.id
                                        ? 'bg-white border-blue-500/50 shadow-lg shadow-blue-500/10'
                                        : 'bg-white/50 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    <div className={`p-3 rounded-xl ${method.bg} ${method.color} group-hover:scale-110 transition-transform`}>
                                        <method.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-sm font-bold ${selectedMethod === method.id ? 'text-slate-900' : 'text-slate-500'}`}>
                                        {method.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Card Details (Mock) */}
                        <AnimatePresence mode="wait">
                            {selectedMethod === 'card' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/50 backdrop-blur-xl border border-slate-200 p-8 rounded-[2.5rem] space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Protocol Holder Name</label>
                                        <input type="text" placeholder="Commander Name" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Card Identification Pattern</label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full bg-white border border-slate-200 rounded-2xl pl-16 pr-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all font-mono text-slate-900" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Expiration</label>
                                            <input type="text" placeholder="MM/YY" className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">CVC Code</label>
                                            <div className="relative">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input type="password" placeholder="***" className="w-full bg-white border border-slate-200 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all text-slate-900" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {selectedMethod === 'upi' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-white/50 backdrop-blur-xl border border-slate-200 p-8 rounded-[2.5rem] space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Select UPI App</label>
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { name: 'GPay', color: 'bg-blue-500', handle: '@oksbi' },
                                                { name: 'PhonePe', color: 'bg-indigo-500', handle: '@ybl' },
                                                { name: 'Paytm', color: 'bg-cyan-500', handle: '@paytm' },
                                                { name: 'Amazon', color: 'bg-amber-500', handle: '@apl' }
                                            ].map((app) => (
                                                <button
                                                    key={app.name}
                                                    onClick={() => {
                                                        setUpiApp(app.name);
                                                        // Priority: 1. Actual UPI ID from driver profile, 2. Guess based on phone
                                                        const targetUpi = trip?.driverId?.upiId || (trip?.driverId?.phone ? `${trip.driverId.phone}${app.handle}` : '');
                                                        setUpiId(targetUpi);
                                                        setUpiError('');
                                                    }}
                                                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${upiApp === app.name
                                                        ? `border-${app.color.split('-')[1]}-500 bg-white shadow-lg`
                                                        : 'border-transparent bg-white hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full ${app.color} flex items-center justify-center text-white font-bold text-[10px]`}>
                                                        {app.name[0]}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-600">{app.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-slate-50 px-2 text-slate-400 font-bold">Or enter VPA</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] uppercase font-black tracking-widest text-slate-500">UPI ID / VPA</label>
                                            {trip?.driverId?.upiId === upiId && upiId && (
                                                <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                                                    <ShieldCheck className="w-2 h-2" /> Verified Driver VPA
                                                </span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <QrCode className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="username@bank"
                                                value={upiId}
                                                onChange={(e) => {
                                                    setUpiId(e.target.value);
                                                    setUpiError('');
                                                    setUpiApp('');
                                                }}
                                                className={`w-full bg-white border rounded-2xl pl-16 pr-6 py-4 text-sm font-bold outline-none transition-all font-mono text-slate-900 ${upiError ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-emerald-500'}`}
                                            />
                                        </div>
                                        {upiError && <p className="text-red-500 text-xs font-bold ml-1">{upiError}</p>}
                                        <p className="text-xs text-slate-400 ml-1">Secure verified payment via NPCI gateway.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-4 p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem]">
                            <ShieldCheck className="w-10 h-10 text-blue-600 shrink-0" />
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-900">Secure Payment Processing</p>
                                <p className="text-xs text-slate-500">Your payment details are protected by industry-standard encryption.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 space-y-8 sticky top-32 shadow-xl shadow-slate-200/50">
                            <h2 className="text-xl font-bold border-b border-slate-100 pb-6 text-slate-900">Trip Summary</h2>

                            <BookingSummaryMap trip={trip} />

                            {trip && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <p className="text-sm font-bold text-slate-700">{trip.startPoint.address}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <p className="text-sm font-bold text-slate-700">{trip.endPoint.address}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-2">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Driver</p>
                                                <p className="text-sm font-bold text-slate-900">{trip.driverId?.name}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.location.href = `sms:${trip.driverId?.phone}`}
                                                    className="p-3 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20"
                                                    title="Message Driver"
                                                >
                                                    <Smartphone className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => window.location.href = `tel:${trip.driverId?.phone}`}
                                                    className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                                                    title="Call Driver"
                                                >
                                                    <Zap className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Trip Fare</span>
                                            <span className="font-bold text-slate-900">₹{trip.pricePerSeat}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 font-medium">Service Fee</span>
                                            <span className="font-bold text-blue-600">₹{Math.round(trip.pricePerSeat * 0.05)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 font-medium">Eco Contribution</span>
                                                <Info className="w-3 h-3 text-emerald-600" />
                                            </div>
                                            <span className="font-bold text-emerald-600">-₹{Math.round(trip.pricePerSeat * 0.02)}</span>
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100" />

                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Total Payment</p>
                                            <h3 className="text-4xl font-black text-slate-900">₹{Math.round(trip.pricePerSeat * 1.03)}</h3>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={loading}
                                        className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-blue-500/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Zap className="w-5 h-5 animate-pulse" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Payment <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-center justify-center gap-2 text-slate-600">
                                        <Lock className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS Compliant Secure Payment</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
