import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, Lock, Mail, Loader2, AlertCircle,
    ArrowLeft, ArrowRight, Terminal, Cpu, Database
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, error, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await login(email, password, 'ADMIN');
            if (user.role === 'ADMIN') {
                navigate('/dashboard/admin');
            }
        } catch (err) {
            console.error('Admin Login Error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]" />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Back Button */}
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
                </button>

                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 relative group">
                            <div className="absolute inset-0 bg-blue-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <ShieldCheck className="w-10 h-10 text-blue-400 relative z-10" />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Admin Console</h1>
                        <p className="text-slate-400 text-sm mt-2 font-medium">Restricted Access Authorization Required</p>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3"
                            >
                                <AlertCircle className="w-4 h-4" /> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Admin Identity</label>
                            <div className="relative">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium"
                                    placeholder="admin@system.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Access Key</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-blue-500 focus:bg-white/10 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 group disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
                        <div className="text-center space-y-2">
                            <Terminal className="w-4 h-4 text-slate-600 mx-auto" />
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Logs</p>
                        </div>
                        <div className="text-center space-y-2">
                            <Cpu className="w-4 h-4 text-slate-600 mx-auto" />
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">System</p>
                        </div>
                        <div className="text-center space-y-2">
                            <Database className="w-4 h-4 text-slate-600 mx-auto" />
                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Data</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminLogin;
