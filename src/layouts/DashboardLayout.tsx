import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Calendar, User, Users, Zap, X, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user, role } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Ensure user profile exists
    useEffect(() => {
        const ensureProfileExists = async () => {
            if (!user) return;

            try {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileError && profileError.code === 'PGRST116') {
                    await supabase.from('profiles').insert({
                        id: user.id,
                        email: user.email,
                        role: 'provider'
                    });
                }
            } catch (err) {
                console.error('Error checking/creating profile:', err);
            }
        };

        ensureProfileExists();
    }, [user]);

    return (
        <div className="flex h-screen overflow-hidden bg-background relative">
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:relative inset-y-0 left-0 z-50 w-64 
                flex flex-col bg-sidebar border-r border-white/5
                transition-transform duration-300 ease-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-none">
                                EventPix <span className="text-blue-400">Panel</span>
                            </h2>
                            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                                {role === 'superadmin' ? 'SUPER ADMIN' : 'Proveedor'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <NavItem
                        icon={<Calendar size={18} />}
                        label="Mis Eventos"
                        active={location.pathname.includes('/admin/dashboard')}
                        onClick={() => { navigate('/admin/dashboard'); setIsMobileMenuOpen(false); }}
                    />

                    {role === 'superadmin' && (
                        <NavItem
                            icon={<Users size={18} />}
                            label="Usuarios"
                            active={location.pathname.includes('/admin/users')}
                            onClick={() => { navigate('/admin/users'); setIsMobileMenuOpen(false); }}
                        />
                    )}
                </nav>

                {/* User Info & Logout */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                            <User size={16} className="text-blue-400" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-semibold text-white truncate">
                                {user?.email?.split('@')[0]}
                            </p>
                            <p className="text-xs text-slate-500">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background relative">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-30 bg-sidebar/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-white rounded-lg hover:bg-white/5"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <Zap size={16} className="text-white" strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-white">EventPix</span>
                    </div>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Content */}
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: {
    icon: React.ReactNode,
    label: string,
    active?: boolean,
    onClick?: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
        >
            <div className={active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}>
                {icon}
            </div>
            <span className="text-sm font-semibold">{label}</span>
        </button>
    );
}
