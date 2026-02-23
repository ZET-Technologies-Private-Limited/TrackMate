import React from 'react';
import {
    LayoutDashboard, User, History, CreditCard, ShieldCheck, Settings, LogOut
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { id: 'Overview', icon: LayoutDashboard, label: 'Overview' },
        { id: 'History', icon: History, label: 'Trip History' },
        ...(user?.role === 'TRAVELLER' ? [{ id: 'Requests', icon: User, label: 'Requests' }] : []),
        { id: 'Payments', icon: CreditCard, label: 'Payments' },
        { id: 'Trust & Safety', icon: ShieldCheck, label: 'Trust & Safety' },
        { id: 'Settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="space-y-2">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                        ? 'bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/20'
                        : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'
                        }`}
                >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                </button>
            ))}

            <div className="pt-4 mt-4 border-t border-slate-200">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileSidebar;
