import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, Car, DollarSign, Leaf, MessageCircle } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import API from '../api';
import socket from '../socket';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const { data } = await API.get('/notifications');
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const { user } = useAuthStore();
    useEffect(() => {
        if (!user) return;
        fetchNotifications();

        socket.on('newNotification', (newNotif) => {
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Optional: Play sound or show browser notification
        });

        return () => {
            socket.off('newNotification');
        };
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await API.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemove = async (id) => {
        try {
            await API.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'match': return <Car className="w-5 h-5 text-blue-400" />;
            case 'payment': return <DollarSign className="w-5 h-5 text-emerald-400" />;
            case 'impact': return <Leaf className="w-5 h-5 text-green-400" />;
            case 'message': return <MessageCircle className="w-5 h-5 text-purple-400" />;
            default: return <Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    return (
        <div className="relative z-50">
            <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <Bell className="w-6 h-6 text-slate-500" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {showNotifications && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl"
                    >
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={() => notifications.forEach(n => !n.read && handleMarkRead(n._id))} className="text-xs text-blue-600 hover:text-blue-500">
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 text-sm">
                                    No notifications yet.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors relative group ${!notif.read ? 'bg-blue-50' : ''}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 p-2 rounded-xl bg-white border border-slate-200 shrink-0 h-fit`}>
                                                {getIcon(notif.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className={`text-sm font-semibold truncate ${!notif.read ? 'text-slate-900' : 'text-slate-500'}`}>
                                                        {notif.title}
                                                    </h4>
                                                    <span className="text-[10px] text-slate-400 shrink-0 ml-2">{notif.time}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                                    {notif.body}
                                                </p>

                                                {!notif.read && (
                                                    <button
                                                        onClick={() => handleMarkRead(notif._id)}
                                                        className="mt-2 text-[10px] font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
                                                    >
                                                        Mark as read <Check className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemove(notif._id); }}
                                                className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-200 text-slate-400 transition-all"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
