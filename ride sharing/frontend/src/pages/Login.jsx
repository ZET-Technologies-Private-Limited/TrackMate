import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn, Mail, Lock, Loader2, Sparkles,
    ArrowRight, ShieldCheck, User, Navigation, AlertCircle
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../store/useAuthStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('PASSENGER');
    const [isTyping, setIsTyping] = useState(false);

    const { login, googleLogin, error, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const user = await googleLogin(tokenResponse.access_token, role, true);
                if (user.role === 'ADMIN') navigate('/dashboard/admin');
                else if (user.role === 'TRAVELLER') navigate('/dashboard/traveller');
                else navigate('/dashboard/passenger');
            } catch (err) {
                console.error('Google Login Error:', err?.response?.data?.message || err.message);
            }
        },
        onError: () => { }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password, role);
            if (user.role === 'ADMIN') navigate('/dashboard/admin');
            else if (user.role === 'TRAVELLER') navigate('/dashboard/traveller');
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

    const getRoleColor = () => {
        if (role === 'PASSENGER') return 'emerald';
        if (role === 'TRAVELLER') return 'blue';
        return 'purple';
    };

    const roleColor = getRoleColor();

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-24 bg-[#FAFAFA]">
            {/* Subtle Gradient Background */}
            <div className={`absolute inset-0 z-0 transition-all duration-700 bg-[radial-gradient(circle_at_top_right,rgba(var(--${roleColor}-rgb),0.05),transparent_50%)]`} />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-[480px] relative z-10"
            >
                <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="text-center mb-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-colors duration-500 bg-${roleColor}-50 text-${roleColor}-600`}>
                            {role === 'PASSENGER' ? <User className="w-8 h-8" /> : role === 'TRAVELLER' ? <Navigation className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h2>
                        <p className="text-slate-500 text-sm font-medium">Please enter your details to sign in.</p>
                    </div>

                    {/* Role Selector */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                        {['PASSENGER', 'TRAVELLER'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${role === r
                                    ? `bg-white text-slate-900 shadow-sm`
                                    : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 mb-6 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-semibold flex items-center gap-3"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</label>
                                <button
                                    type="button"
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Forgot?
                                </button>
                            </div>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold text-sm text-white transition-all shadow-lg focus:ring-4 ${role === 'PASSENGER' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200 focus:ring-emerald-100' : role === 'TRAVELLER' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-200 focus:ring-blue-100' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200 focus:ring-slate-100'}`}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
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
                            Continue with Google
                        </button>

                        <p className="mt-8 text-center text-sm text-slate-500 font-medium flex flex-col gap-4">
                            <span>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => navigate('/register')}
                                    className="text-slate-900 font-bold hover:underline ml-1"
                                >
                                    Sign Up
                                </button>
                            </span>

                            {role !== 'ADMIN' ? (
                                <button
                                    onClick={() => navigate('/admin/login')}
                                    className="text-[10px] uppercase font-black tracking-widest text-slate-300 hover:text-slate-900 transition-colors"
                                >
                                    Admin Dashboard Access
                                </button>
                            ) : (
                                <button
                                    onClick={() => setRole('PASSENGER')}
                                    className="text-[10px] uppercase font-black tracking-widest text-emerald-600 hover:underline"
                                >
                                    Back to Standard Login
                                </button>
                            )}
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
