import { useEffect, useState } from 'react';
import { getAnalyticsEvents, AnalyticsEvent } from '../../lib/analytics';
import { BarChart3, Users, MousePointerClick, TrendingDown, LayoutGrid, Upload, Mail } from 'lucide-react';

export default function UsageMetrics() {
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);

    useEffect(() => {
        setEvents(getAnalyticsEvents());
    }, []);

    // Helper to count unique sessions for an event
    const countUnique = (eventName: string) => {
        const filtered = events.filter(e => e.eventName === eventName);
        const uniqueSessions = new Set(filtered.map(e => e.sessionId));
        return uniqueSessions.size;
    };

    // Calculate funnel metrics
    const visits = countUnique('page_view');
    const started = countUnique('event_started');
    const guestsAdded = countUnique('excel_uploaded') + countUnique('manual_guest_started');
    const tablesCreated = countUnique('tables_created');
    const contactSaved = countUnique('user_registered');

    const funnelData = [
        { name: 'Visitas', value: visits, icon: Users },
        { name: 'Empezaron Evento', value: started, icon: MousePointerClick },
        { name: 'Cargaron Invitados', value: guestsAdded, icon: Upload },
        { name: 'Crearon Mesas', value: tablesCreated, icon: LayoutGrid },
        { name: 'Registro / Contacto', value: contactSaved, icon: Mail },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <BarChart3 className="text-blue-500" /> Analítica y Embudo
                    </h1>
                    <p className="text-slate-400 text-sm font-light">
                        Métricas de conversión y comportamiento de usuarios en el planificador.
                    </p>
                </div>
            </div>

            {/* SECCIÓN 1: KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                    <p className="text-slate-400 text-sm font-medium mb-1">Visitas Totales</p>
                    <p className="text-3xl font-bold text-white">{events.filter(e => e.eventName === 'page_view').length}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                    <p className="text-slate-400 text-sm font-medium mb-1">Visitantes Únicos</p>
                    <p className="text-3xl font-bold text-blue-400">{visits}</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                    <p className="text-slate-400 text-sm font-medium mb-1">Conversión Inicio</p>
                    <p className="text-3xl font-bold text-emerald-400">
                        {visits > 0 ? Math.round((started / visits) * 100) : 0}%
                    </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/30 transition-colors">
                    <p className="text-slate-400 text-sm font-medium mb-1">Leads Capturados</p>
                    <p className="text-3xl font-bold text-pink-400">{contactSaved}</p>
                </div>
            </div>

            {/* SECCIÓN 2: Embudo en Cascada */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8">
                <h2 className="text-xl font-bold text-white mb-8">Embudo de Conversión (Funnel)</h2>
                
                <div className="space-y-4">
                    {funnelData.map((step, index) => {
                        const percentage = visits > 0 ? Math.round((step.value / visits) * 100) : 0;
                        const dropOff = index > 0 && funnelData[index - 1].value > 0 
                            ? 100 - Math.round((step.value / funnelData[index - 1].value) * 100) 
                            : 0;

                        return (
                            <div key={index} className="relative">
                                {/* Drop-off indicator between steps */}
                                {index > 0 && dropOff > 0 && (
                                    <div className="absolute -top-4 right-4 flex items-center gap-1 text-xs text-rose-400 font-medium">
                                        <TrendingDown size={12} /> {dropOff}% abandono
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-48 text-sm font-medium text-slate-300 flex items-center gap-2">
                                        <step.icon size={16} className="text-slate-500" /> {step.name}
                                    </div>
                                    <div className="flex-1 bg-slate-950 rounded-full h-8 overflow-hidden relative border border-slate-800">
                                        <div 
                                            className="h-full bg-blue-600/50 border-r-2 border-blue-500 transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                        <div className="absolute inset-0 flex items-center px-4 text-xs font-bold text-white">
                                            {step.value} usuarios ({percentage}%)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SECCIÓN 3: Últimos Eventos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Últimos Eventos Registrados</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-950/80 text-xs text-slate-500 uppercase border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3">Fecha / Hora</th>
                                <th className="px-4 py-3">Acción</th>
                                <th className="px-4 py-3">Detalles</th>
                                <th className="px-4 py-3">Sesión (ID)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                            {events.slice(0, 50).map((evt, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40">
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                                        {new Date(evt.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-blue-400">
                                        {evt.eventName}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs bg-slate-950 px-2 py-1 rounded text-slate-400 font-mono border border-slate-800">
                                            {(evt as any).eventData ? JSON.stringify((evt as any).eventData).substring(0, 50) : 'N/A'}...
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                                        {evt.sessionId.split('-')[0]}...
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
