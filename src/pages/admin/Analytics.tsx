import { useEffect, useState } from 'react';
import { TrendingUp, Users, Calendar, Inbox, Activity, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        usersCount: 0,
        eventsCount: 0,
        guestsCount: 0,
        pendingLeads: 0
    });
    
    const [chartData, setChartData] = useState<number[]>(new Array(12).fill(0));
    const [topProviders, setTopProviders] = useState<any[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                // 1. Fetch Events (for total events and chart)
                const { data: eventsData, error: eventsError } = await supabase
                    .from('events')
                    .select('id, created_at, owner_id');
                if (eventsError) throw eventsError;

                // 2. Fetch Guests (for total volume)
                const { count: guestsCount, error: guestsError } = await supabase
                    .from('guests')
                    .select('*', { count: 'exact', head: true });
                if (guestsError) throw guestsError;

                // 3. Fetch Leads (for pending requests and top providers)
                const { data: leadsData, error: leadsError } = await supabase
                    .from('leads')
                    .select(`
                        id, 
                        status, 
                        provider:providers(id, company_name, category:services_offered)
                    `);
                if (leadsError) throw leadsError;

                // --- Calculate Metrics ---
                const uniqueUsers = new Set((eventsData || []).map(e => e.owner_id).filter(Boolean));
                const pendingLeads = (leadsData || []).filter(l => l.status === 'nuevo').length;

                setMetrics({
                    usersCount: uniqueUsers.size,
                    eventsCount: (eventsData || []).length,
                    guestsCount: guestsCount || 0,
                    pendingLeads: pendingLeads
                });

                // --- Calculate Chart Data (Events per month this year) ---
                const currentYear = new Date().getFullYear();
                const newChartData = new Array(12).fill(0);
                
                (eventsData || []).forEach(event => {
                    const date = new Date(event.created_at);
                    if (date.getFullYear() === currentYear) {
                        newChartData[date.getMonth()] += 1;
                    }
                });
                
                // Find max for percentage calculation (to simulate 0-100 heights)
                const maxVal = Math.max(...newChartData, 1);
                const normalizedChartData = newChartData.map(val => (val / maxVal) * 100);
                setChartData(normalizedChartData);

                // --- Calculate Top Providers ---
                const providerCounts: Record<string, { name: string, category: string, count: number }> = {};
                
                (leadsData || []).forEach(lead => {
                    if (lead.provider) {
                        const provider: any = Array.isArray(lead.provider) ? lead.provider[0] : lead.provider;
                        if (!provider) return;
                        
                        // Handle array or string for category safely
                        const cat = Array.isArray(provider.category) 
                            ? provider.category[0] 
                            : 'Servicio';
                            
                        if (!providerCounts[provider.id]) {
                            providerCounts[provider.id] = {
                                name: provider.company_name,
                                category: cat,
                                count: 0
                            };
                        }
                        providerCounts[provider.id].count += 1;
                    }
                });

                const sortedTopProviders = Object.values(providerCounts)
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                
                setTopProviders(sortedTopProviders);

            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-slate-400 font-medium">Calculando métricas del sistema...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Resumen General</h1>
                <p className="text-slate-400">Las métricas principales de EventPix en tiempo real.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Users className="text-blue-500" size={24} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Usuarios Logueados</p>
                    <h3 className="text-3xl font-bold text-white">{metrics.usersCount}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                            <Calendar className="text-indigo-500" size={24} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Eventos Creados</p>
                    <h3 className="text-3xl font-bold text-white">{metrics.eventsCount}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Activity className="text-emerald-500" size={24} />
                        </div>
                        {metrics.guestsCount > 0 && (
                            <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                                <TrendingUp size={14} /> Global
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Volumen de Invitados</p>
                    <h3 className="text-3xl font-bold text-white">{metrics.guestsCount.toLocaleString()}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Inbox className="text-amber-500" size={24} />
                        </div>
                        {metrics.pendingLeads > 0 && (
                            <span className="flex items-center gap-1 text-sm font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg animate-pulse">
                                Nuevos
                            </span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Solicitudes Pendientes</p>
                    <h3 className="text-3xl font-bold text-white">{metrics.pendingLeads}</h3>
                </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Crecimiento de Eventos ({new Date().getFullYear()})</h3>
                    
                    {metrics.eventsCount === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            Aún no hay eventos registrados este año.
                        </div>
                    ) : (
                        <div className="h-64 flex items-end justify-between gap-2 mt-auto">
                            {chartData.map((height, i) => (
                                <div key={i} className="w-full flex flex-col items-center gap-2 group">
                                    <div className="w-full bg-slate-800 rounded-t-sm relative group-hover:bg-blue-500/20 transition-colors h-full flex items-end">
                                        <div 
                                            className="w-full bg-blue-500 rounded-t-sm transition-all duration-1000 ease-out" 
                                            style={{ height: `${Math.max(height, 2)}%` }} // Minimum height so it's visible if 0
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium">{['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Top Proveedores Solicitados</h3>
                    <div className="space-y-6">
                        {topProviders.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">Aún no hay leads generados.</p>
                        ) : (
                            topProviders.map((provider, i) => (
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
                                        <p className="text-sm font-bold text-white">{provider.count}</p>
                                        <p className="text-[10px] text-slate-500 uppercase">Leads</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
