import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Calendar, User, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { signOut, user, role } = useAuth();

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Ensure user profile exists to avoid FK errors when creating events
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
                    console.log('Profile missing, creating default profile...');
                    await supabase.from('profiles').insert({
                        id: user.id,
                        email: user.email,
                        role: 'provider'
                    });
                    console.log('Profile created successfully');
                }
            } catch (err) {
                console.error('Error checking/creating profile:', err);
            }
        };

        ensureProfileExists();
    }, [user]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 relative">
            {/* Sidebar - Clean Light Surface */}
            <aside className="w-64 flex flex-col z-20 border-r border-slate-200 bg-white shrink-0 shadow-sm">
                <div className="p-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 font-display">INGRESO<span className="text-[#FBBF24]">VIP</span></h2>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-medium pl-1">by Tecno Eventos</p>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-2">
                    <NavItem
                        icon={<Calendar size={18} />}
                        label="Eventos"
                        active={location.pathname.includes('/admin/dashboard')}
                        onClick={() => navigate('/admin/dashboard')}
                    />

                    {role === 'superadmin' && (
                        <NavItem
                            icon={<Users size={18} />}
                            label="Usuarios"
                            active={location.pathname.includes('/admin/users')}
                            onClick={() => navigate('/admin/users')}
                        />
                    )}

                    <div className="mt-8 pt-4 border-t border-slate-100">
                        <NavItem
                            icon={<LogOut size={18} />}
                            label="Salir"
                            onClick={handleSignOut}
                        />
                    </div>
                </nav>

                <div className="p-4 m-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#FBBF24] font-bold shadow-sm">
                            <User size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
                            <p className="text-xs text-slate-500 font-medium badge badge-neutral inline-block mt-1 px-2 py-0.5 rounded-full scale-90 origin-left">
                                {role === 'superadmin' ? 'Super Admin' : 'Proveedor'}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-slate-50 relative z-10">
                <div className="max-w-6xl mx-auto p-6 md:p-10">
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group font-medium ${active
                ? 'bg-[#FBBF24]/10 text-[#B45309]'
                : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                }`}
        >
            <div className={`transition-colors ${active ? 'text-[#F59E0B]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm">{label}</p>
            </div>
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            )}
        </button>
    );
}
