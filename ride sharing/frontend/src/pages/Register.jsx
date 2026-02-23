import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import {
    UserPlus, User, Loader2, Navigation, Mail,
    Lock, UserCircle, ShieldCheck, Sparkles, ArrowRight, Smartphone
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('PASSENGER');
    const [upiId, setUpiId] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const { register, googleLogin, error, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const user = await googleLogin(tokenResponse.access_token, role, true);
                if (user.role === 'TRAVELLER') navigate('/dashboard/traveller');
                else navigate('/dashboard/passenger');
            } catch (err) {
                console.error('Google Register Error:', err?.response?.data?.message || err.message);
            }
        },
        onError: () => { }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await register({ name, email, password, phone, role, upiId });
            if (user.role === 'TRAVELLER') navigate('/dashboard/traveller');
            else navigate('/dashboard/passenger');
        } catch (err) {
            console.error(err);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    const roleColor = role === 'PASSENGER' ? 'emerald' : 'blue';

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-24 bg-[#FAFAFA]">
            {/* Subtle Gradient Background */}
            <div className={`absolute inset-0 z-0 transition-all duration-700 bg-[radial-gradient(circle_at_bottom_left,rgba(var(--${roleColor}-rgb),0.05),transparent_50%)]`} />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[600px] relative z-10"
            >
                <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create your account</h2>
                        <p className="text-slate-500 text-sm font-medium">Join our community and start your journey.</p>

                        {/* Notice for multiple email fix */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-[11px] font-semibold inline-flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Already have an account? Use the same email to add a new role.
                        </div>
                    </div>

                    <AnimatePresence mode='wait'>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 mb-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-semibold flex items-center gap-3"
                            >
                                <ShieldCheck className="w-4 h-4 shrink-0" /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="name@email.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="+91 00000 00000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Create Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium text-slate-900"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Select Your Primary Role</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('PASSENGER')}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${role === 'PASSENGER'
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    <User className={`w-6 h-6 ${role === 'PASSENGER' ? 'scale-110' : ''} transition-transform`} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Passenger</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('TRAVELLER')}
                                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all group ${role === 'TRAVELLER'
                                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    <Navigation className={`w-6 h-6 ${role === 'TRAVELLER' ? 'scale-110' : ''} transition-transform`} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Traveller</span>
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {role === 'TRAVELLER' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">UPI ID (Optional for Receiving Payments)</label>
                                        <div className="relative group">
                                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                                            <input
                                                type="text"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 outline-none transition-all text-sm font-medium text-slate-900"
                                                placeholder="username@bank"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-sm text-white transition-all shadow-lg focus:ring-4 ${role === 'PASSENGER' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 focus:ring-emerald-100' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-200 focus:ring-blue-100'}`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <button
                            onClick={() => handleGoogleLogin()}
                            type="button"
                            className="w-full flex items-center justify-center gap-3 py-4 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-semibold text-sm text-slate-700"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.191 2.69 1.145 6.655l4.121 3.11z" />
                                <path fill="#34A853" d="M16.04 18.013c-1.09.593-2.346.915-3.654.915a7.077 7.077 0 0 1-6.733-4.873l-4.12 3.116C3.191 21.31 7.273 24 12 24c3.055 0 5.782-1.145 7.91-3l-3.87-2.987z" />
                                <path fill="#4285F4" d="M19.91 21c2.254-1.99 3.636-4.936 3.636-8.273 0-.682-.109-1.364-.265-2.027H12v4.363h6.618c-.318 1.636-1.264 3.018-2.582 3.918l3.874 3z" />
                                <path fill="#FBBC05" d="M5.266 14.235a7.07 7.07 0 0 1 0-4.47l-4.12-3.11a12.003 12.003 0 0 0 0 10.697l4.12-3.117z" />
                            </svg>
                            Sign up with Google
                        </button>

                        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-slate-900 font-bold hover:underline ml-1"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
