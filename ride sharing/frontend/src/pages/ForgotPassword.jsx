import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, Send, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Mock request
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    const containerVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-slate-50">
            {/* Dynamic Background */}
            <motion.div
                animate={{
                    scale: isTyping ? 1.3 : 1,
                    opacity: isTyping ? 0.6 : 0.4,
                    background: submitted
                        ? "radial-gradient(circle at center, rgba(34, 197, 94, 0.1) 0%, transparent 70%)"
                        : "radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)"
                }}
                className="absolute inset-0 z-0 pointer-events-none transition-all duration-1000"
            />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="w-full max-w-lg relative z-10"
            >
                <div className="bg-white/80 backdrop-blur-3xl border border-slate-200 p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                    <button
                        onClick={() => navigate('/login')}
                        className="absolute top-8 left-8 p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-10 pt-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${submitted ? 'bg-green-500/10 border-green-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}
                        >
                            {submitted ? (
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            ) : (
                                <ShieldCheck className="w-10 h-10 text-purple-500" />
                            )}
                        </motion.div>
                        <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                            {submitted ? 'Email Sent' : 'Reset Password'}
                        </h2>
                        <p className="text-slate-500 font-medium">
                            {submitted
                                ? 'We have sent password reset instructions to your email.'
                                : 'Enter your email to receive a password reset link.'}
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="group space-y-2">
                                <label className="text-[10px] uppercase font-black tracking-widest text-slate-500 ml-1">Registered Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onFocus={() => setIsTyping(true)}
                                        onBlur={() => setIsTyping(false)}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:border-purple-500 outline-none transition-all text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                        placeholder="Enter your email..."
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-purple-500/20 flex justify-center items-center gap-3"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Request Reset <Send className="w-4 h-4" /></>
                                )}
                            </motion.button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/5 border border-green-500/10 p-6 rounded-3xl text-center"
                        >
                            <p className="text-green-700 text-sm font-medium leading-relaxed">
                                We've sent a recovery link to <span className="text-slate-900 font-bold">{email}</span>. Click the link within 60 minutes to reset your password.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-8 w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                            >
                                Return to Login
                            </button>
                        </motion.div>
                    )}

                    {!submitted && (
                        <div className="mt-10 pt-8 border-t border-slate-200 text-center">
                            <button
                                onClick={() => navigate('/login')}
                                className="text-slate-500 hover:text-slate-900 transition-colors text-xs font-black uppercase tracking-widest"
                            >
                                Back to Login
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
