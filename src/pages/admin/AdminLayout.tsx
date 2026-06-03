import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    Store, 
    Crown, 
    Filter, 
    LogOut, 
    Home,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin-ep/analytics', label: 'Métricas EventPix', icon: LayoutDashboard, isExternal: false },
        { path: '/admin-ep/leads', label: 'Leads', icon: Users, isExternal: false },
        { path: '/admin-ep/providers', label: 'Proveedores', icon: Store, isExternal: false },
    ];

    const oldNavItems = [
        { path: '/admin/dashboard', label: 'Mis Eventos', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Clientes (Novios)', icon: Users },
        { path: '/admin/metrics', label: 'Métricas de Uso', icon: LayoutDashboard },
    ];

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans selection:bg-blue-500/30">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
                <div className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-sm">EP</span>
                    </div>
                    EventPix <span className="text-blue-500 font-normal">Admin</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="text-slate-400 hover:text-white p-2"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="p-6 hidden md:flex items-center gap-3 border-b border-slate-800/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">EP</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-white leading-tight tracking-tight">EventPix</h1>
                        <span className="text-xs text-blue-400 font-medium">Business Admin</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                                    ${isActive 
                                        ? 'bg-blue-600/10 text-blue-400 shadow-[inset_4px_0_0_0_rgba(37,99,235,1)]' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                                `}
                            >
                                <Icon size={20} className={isActive ? "text-blue-500" : "text-slate-500"} />
                                {item.label}
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 mb-2">
                        <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-500">Gestión Global</p>
                    </div>

                    {oldNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
                                    ${isActive 
                                        ? 'bg-blue-600/10 text-blue-400 shadow-[inset_4px_0_0_0_rgba(37,99,235,1)]' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
                                `}
                            >
                                <Icon size={20} className={isActive ? "text-blue-500" : "text-slate-500"} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800/50">
                    <div className="bg-slate-950/50 rounded-2xl p-4 mb-4">
                        <p className="text-xs text-slate-500 font-medium mb-1">Sesión activa</p>
                        <p className="text-sm text-slate-300 truncate">{user?.email || 'admin@eventpix.com'}</p>
                    </div>
                    
                    <div className="space-y-1">
                        <Link 
                            to="/admin" 
                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                        >
                            <Home size={18} />
                            Ingreso VIP Admin
                        </Link>
                        <button 
                            onClick={handleSignOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Overlay for Mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
