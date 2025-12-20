import { useEffect, useState } from 'react';
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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-background relative transition-colors duration-300">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Semantic Theme Surface (Responsive) */}
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 flex flex-col border-r border-border bg-sidebar shadow-xl md:shadow-none transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground font-display">INGRESO<span className="text-accent">VIP</span></h2>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.2em] font-medium pl-1">by Tecno Eventos</p>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="md:hidden p-1 text-muted hover:text-foreground rounded-lg"
                    >
                        <LogOut size={20} className="rotate-180" /> {/* Simulating back/close icon */}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 mt-2">
                    <NavItem
                        icon={<Calendar size={18} />}
                        label="Eventos"
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

                    <div className="mt-8 pt-4 border-t border-border">
                        <NavItem
                            icon={<LogOut size={18} />}
                            label="Salir"
                            onClick={handleSignOut}
                        />
                    </div>
                </nav>

                <div className="p-4 m-4 rounded-xl bg-background border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface border border-border flex items-center justify-center text-accent font-bold shadow-sm">
                            <User size={16} />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">{user?.email?.split('@')[0]}</p>
                            <p className="text-xs text-muted font-medium badge badge-neutral inline-block mt-1 px-2 py-0.5 rounded-full scale-90 origin-left border border-border bg-surface text-foreground">
                                {role === 'superadmin' ? 'Super Admin' : 'Proveedor'}
                            </p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-background relative z-10 transition-colors duration-300 w-full">
                {/* Mobile Header Trigger */}
                <div className="md:hidden p-4 bg-surface border-b border-border flex items-center justify-between sticky top-0 z-10">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 text-foreground rounded-lg hover:bg-background"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <span className="font-display font-bold text-foreground">IngresoVIP</span>
                    <div className="w-8" /> {/* Spacer for centering */}
                </div>

                <div className="max-w-7xl mx-auto p-6 md:p-8">
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
                ? 'bg-accent/10 text-accent-dark dark:text-accent-light'
                : 'hover:bg-background text-muted hover:text-foreground'
                }`}
        >
            <div className={`transition-colors ${active ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm">{label}</p>
            </div>
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
            )}
        </button>
    );
}
