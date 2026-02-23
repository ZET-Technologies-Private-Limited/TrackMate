import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    Navigation, ArrowRight, ShieldCheck, Leaf,
    Zap, Globe, Users, Smartphone, Share2,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import LiveFleetMap from '../components/LiveFleetMap';

const Home = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();

    // Parallax effects for background elements
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const rotate = useTransform(scrollY, [0, 1000], [0, 45]);

    const features = [
        {
            icon: <Leaf className="w-6 h-6 text-emerald-400" />,
            title: "Eco-Friendly Rewards",
            desc: "Calculate CO2 savings for every shared ride and earn exclusive Carbon Credits."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
            title: "Verified Community",
            desc: "Every traveller undergoes identity verification to ensure a safe and trusted network."
        },
        {
            icon: <Zap className="w-6 h-6 text-amber-400" />,
            title: "Real-time Sync",
            desc: "Live location tracking and instant trip chat powered by WebSocket technology."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 12 }
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500/30 overflow-x-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <motion.div
                    style={{ y: y1 }}
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"
                />
                <motion.div
                    style={{ y: y2 }}
                    className="absolute top-[40%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px]"
                />
            </div>

            {/* Hero Section */}
            <div className="pt-32 sm:pt-40 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 space-y-8 text-center lg:text-left"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
                        >
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <span>Revolutionizing Urban Mobility</span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-6xl md:text-8xl xl:text-[9rem] font-black leading-[0.85] tracking-tighter"
                        >
                            Track <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 inline-block py-2">
                                Mate.
                            </span>
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-slate-600 text-lg md:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium"
                        >
                            The smarter way to commute. Connect with verified travellers, share your journey, and track your environmental impact in real-time.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4"
                        >
                            <motion.button
                                onClick={() => navigate('/register')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold flex items-center gap-3 shadow-2xl shadow-slate-900/20 transition-all text-sm uppercase tracking-widest"
                            >
                                Get Started <ArrowRight className="w-5 h-5" />
                            </motion.button>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                        className="flex-1 w-full relative"
                    >
                        <div className="bg-white p-3 rounded-[3.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden h-[500px] lg:h-[650px] relative">
                            <LiveFleetMap />
                        </div>

                        {/* Stats below the map */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                            className="mt-4 bg-slate-900 px-8 py-5 rounded-3xl border border-white/10 shadow-2xl text-white flex items-center gap-8"
                        >
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 shrink-0">Local Network Activity</p>
                            <div className="w-px h-8 bg-white/10 shrink-0" />
                            <div className="flex items-center gap-8 flex-1">
                                <div>
                                    <p className="text-2xl font-black">240+</p>
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400">Available Travellers</p>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div>
                                    <p className="text-2xl font-black">1.2k</p>
                                    <p className="text-[9px] uppercase tracking-wider text-slate-400">Daily Trips</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-32 px-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center space-y-6 mb-24"
                    >
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-900">Why Choose Our Platform?</h2>
                        <p className="text-slate-600 text-xl max-w-2xl mx-auto">We've combined modern transportation needs with environmental responsibility.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-10">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.5 }}
                                whileHover={{ y: -10 }}
                                className="bg-white p-10 rounded-[3rem] border border-slate-200 hover:border-emerald-500/30 transition-all group relative overflow-hidden shadow-xl"
                            >
                                <div className="absolute top-0 right-0 p-24 bg-emerald-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                <motion.div
                                    whileHover={{ rotate: 15, scale: 1.1 }}
                                    className="p-5 bg-emerald-500/10 rounded-2xl w-fit mb-8 relative z-10"
                                >
                                    {f.icon}
                                </motion.div>
                                <h3 className="text-2xl font-black mb-4 relative z-10 text-slate-900">{f.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-lg relative z-10">
                                    {f.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="py-32 px-6 text-center relative overflow-hidden"
            >
                <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        className="text-6xl md:text-8xl font-black tracking-tight"
                    >
                        Ready to ride <br />
                        <span className="text-emerald-500">the future?</span>
                    </motion.h2>
                    <p className="text-slate-600 text-2xl">Join thousands of commuters already making a difference every single day.</p>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-slate-900 text-white px-16 py-6 rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/20"
                        >
                            Create Free Account
                        </button>
                    </motion.div>
                </div>

                {/* Visual Flair */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
            </motion.div>

            {/* WhatsApp Contact Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="py-20 px-6 relative z-10"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-gradient-to-br from-[#075e54] via-[#128c7e] to-[#25d366] p-12 rounded-[3rem] shadow-2xl shadow-emerald-900/20 overflow-hidden text-white text-center">
                        {/* Decorative blobs */}
                        <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                        {/* WhatsApp icon */}
                        <motion.div
                            animate={{ scale: [1, 1.08, 1] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                            className="flex justify-center mb-6"
                        >
                            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-black/20">
                                <svg viewBox="0 0 32 32" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.51L4 29l7.697-1.817A11.94 11.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#25D366" />
                                    <path d="M22.003 19.3c-.303-.15-1.797-.885-2.075-.987-.278-.1-.48-.15-.683.15-.203.3-.785.987-.963 1.19-.178.2-.355.225-.658.075-.303-.15-1.28-.473-2.438-1.505-.9-.803-1.508-1.795-1.686-2.095-.178-.3-.019-.463.134-.612.138-.134.303-.35.455-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.683-1.645-.935-2.252-.246-.59-.496-.51-.683-.52l-.582-.01c-.2 0-.527.075-.802.375s-1.055 1.03-1.055 2.512 1.08 2.913 1.23 3.115c.15.2 2.125 3.243 5.148 4.548.72.31 1.28.495 1.717.634.722.228 1.38.196 1.9.119.58-.086 1.797-.735 2.05-1.445.253-.71.253-1.318.178-1.445-.075-.126-.278-.2-.58-.35z" fill="white" />
                                </svg>
                            </div>
                        </motion.div>

                        <p className="text-white/70 text-xs font-black uppercase tracking-[0.3em] mb-3">Get in Touch</p>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Contact Us on WhatsApp</h2>
                        <p className="text-white/80 text-lg mb-2">Have questions? We're just a message away.</p>
                        <p className="text-white/60 text-sm font-bold tracking-widest mb-10">+91 94917 41210</p>

                        <motion.a
                            href="https://wa.me/919491741210"
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-3 bg-white text-[#075e54] px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-white/90 transition-all"
                        >
                            <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.668 4.61 1.832 6.51L4 29l7.697-1.817A11.94 11.94 0 0016 27c6.627 0 12-5.373 12-12S22.627 3 16 3z" fill="#25D366" />
                                <path d="M22.003 19.3c-.303-.15-1.797-.885-2.075-.987-.278-.1-.48-.15-.683.15-.203.3-.785.987-.963 1.19-.178.2-.355.225-.658.075-.303-.15-1.28-.473-2.438-1.505-.9-.803-1.508-1.795-1.686-2.095-.178-.3-.019-.463.134-.612.138-.134.303-.35.455-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.683-1.645-.935-2.252-.246-.59-.496-.51-.683-.52l-.582-.01c-.2 0-.527.075-.802.375s-1.055 1.03-1.055 2.512 1.08 2.913 1.23 3.115c.15.2 2.125 3.243 5.148 4.548.72.31 1.28.495 1.717.634.722.228 1.38.196 1.9.119.58-.086 1.797-.735 2.05-1.445.253-.71.253-1.318.178-1.445-.075-.126-.278-.2-.58-.35z" fill="white" />
                            </svg>
                            Chat on WhatsApp
                        </motion.a>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <footer className="py-16 border-t border-slate-200 px-6 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg border border-slate-200">
                            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                        </div>
                        <span className="font-black text-2xl tracking-tighter uppercase italic text-slate-900">TrackMate</span>
                    </motion.div>

                    <p className="text-slate-500 font-medium">© 2026 Eco-Mobility. Redefining shared journeys.</p>

                    <div className="flex gap-8">
                        {[Smartphone, Globe, Share2].map((Icon, i) => (
                            <motion.a
                                key={i}
                                href="#"
                                whileHover={{ y: -5, color: "#10b981" }}
                                className="text-slate-500 transition-colors"
                            >
                                <Icon className="w-6 h-6" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
