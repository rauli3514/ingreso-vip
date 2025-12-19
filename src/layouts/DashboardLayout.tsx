import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[#030712] text-slate-200 relative">
            {/* Background Effects (Consistent with Login) */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Sidebar - Glass Effect */}
            <aside className="w-64 flex flex-col z-20 hidden md:flex border-r border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="p-6">
                    <h2 className="text-xl font-bold tracking-tight text-white">INGRESO<span className="text-[#FBBF24]">VIP</span></h2>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-[0.2em] font-medium pl-1">by Tecno Eventos</p>
                </div>

                <nav className="flex-1 px-3 space-y-2 mt-2">
                    <NavItem
                        icon={<Calendar size={18} />}
                        label="Eventos"
                        active={location.pathname.includes('/admin/dashboard')}
                        onClick={() => navigate('/admin/dashboard')}
                    />
                </nav>

                <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FBBF24] to-yellow-600 flex items-center justify-center text-black font-bold shadow-lg shadow-yellow-500/20">
                            <User size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-medium text-white truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-slate-500">Super Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center justify-center gap-2 text-[10px] font-medium text-red-400 hover:text-red-300 w-full py-2 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={12} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10">
                <div className="max-w-5xl mx-auto p-6 md:p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-300 group ${active
                ? 'bg-[#FBBF24] text-black shadow-[0_0_15px_-5px_rgba(251,191,36,0.4)]'
                : 'hover:bg-white/5 text-slate-400 hover:text-white'
                }`}
        >
            <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-black/10' : 'bg-white/5 group-hover:bg-white/10'}`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-semibold ${active ? 'text-black' : 'text-slate-200'}`}>{label}</p>
            </div>
        </button>
    );
}
