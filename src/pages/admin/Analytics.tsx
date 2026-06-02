import { TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react';

export default function Analytics() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Resumen General</h1>
                <p className="text-slate-400">Las métricas principales de EventPix en los últimos 30 días.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Users className="text-blue-500" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> +12%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Usuarios Activos</p>
                    <h3 className="text-3xl font-bold text-white">2,845</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                            <Calendar className="text-indigo-500" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> +8%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Eventos Creados</p>
                    <h3 className="text-3xl font-bold text-white">842</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Activity className="text-amber-500" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> +24%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Leads Generados</p>
                    <h3 className="text-3xl font-bold text-white">3,120</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="text-emerald-500" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                            Estable
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">MRR (Ingreso Mensual)</p>
                    <h3 className="text-3xl font-bold text-white">$4.2K</h3>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Crecimiento de Eventos</h3>
                    
                    {/* Simulated Chart */}
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 30, 45, 60, 55, 70, 65, 80, 95, 85, 100, 110].map((height, i) => (
                            <div key={i} className="w-full flex flex-col items-center gap-2 group">
                                <div className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-blue-500/20 transition-colors h-full flex items-end">
                                    <div 
                                        className="w-full bg-blue-500 rounded-t-sm transition-all duration-1000 ease-out" 
                                        style={{ height: `${height}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] text-slate-500 font-medium">{['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Top Proveedores</h3>
                    <div className="space-y-6">
                        {[
                            { name: 'DJ Maxi Sonido', category: 'Música / DJ', leads: 142 },
                            { name: 'Salón Los Pinos', category: 'Salón', leads: 98 },
                            { name: 'Catering Gourmet', category: 'Catering', leads: 87 },
                            { name: 'Foto y Video Pro', category: 'Fotografía', leads: 64 },
                            { name: 'Barra Libre VIP', category: 'Bebidas', leads: 52 },
                        ].map((provider, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{provider.name}</p>
                                        <p className="text-xs text-slate-400">{provider.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-white">{provider.leads}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Leads</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
