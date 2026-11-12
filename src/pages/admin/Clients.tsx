import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Mail, Phone, Calendar, Users, Power, PowerOff, ExternalLink, Settings, Crown, X, Link, Shield, MessageCircle, LayoutGrid, Inbox, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    ClientRow, ClientEvent, Opportunity, OPPORTUNITY_LABELS, MODULE_LABELS,
    fetchClients, formatDaysLeft, formatDate, timeAgo, whatsappLink, clientMessage,
} from '../../lib/adminClients';

const OPPORTUNITY_STYLES: Record<Opportunity, string> = {
    compro: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    llamar: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    empezando: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    pasado: 'bg-slate-800 text-slate-500 border-slate-700',
    sin_evento: 'bg-slate-800 text-slate-500 border-slate-700',
};

const FILTERS: { id: Opportunity | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'llamar', label: 'Para llamar' },
    { id: 'empezando', label: 'Recién empiezan' },
    { id: 'compro', label: 'Ya compraron' },
    { id: 'sin_evento', label: 'Sin evento' },
    { id: 'pasado', label: 'Evento pasado' },
];

export default function Clients() {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<Opportunity | 'todos'>('todos');
    const [selectedClientForModules, setSelectedClientForModules] = useState<ClientRow | null>(null);

    const loadClients = async () => {
        try {
            setLoading(true);
            setClients(await fetchClients());
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!window.confirm(`¿Estás seguro de que deseas ${currentStatus ? 'bloquear' : 'desbloquear'} a este cliente?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            loadClients();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(`Error al actualizar estado: ${error.message}`);
        }
    };

    const handleToggleModule = async (event: ClientEvent, module: string, enable: boolean) => {
        try {
            const plannerData = event.plannerData || {};
            const activeModules = new Set<string>(plannerData.active_modules || []);
            if (enable) activeModules.add(module);
            else activeModules.delete(module);

            const newPlannerData = { ...plannerData, active_modules: Array.from(activeModules) };
            const { error } = await supabase
                .from('events')
                .update({ planner_data: newPlannerData })
                .eq('id', event.id);
            if (error) throw error;

            const refreshed = await fetchClients();
            setClients(refreshed);
            setSelectedClientForModules(prev => prev ? refreshed.find(c => c.id === prev.id) || null : null);
        } catch (error: any) {
            console.error('Error toggling module:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const counts = useMemo(() => {
        const c: Record<string, number> = { todos: clients.length };
        clients.forEach(cl => { c[cl.opportunity] = (c[cl.opportunity] || 0) + 1; });
        return c;
    }, [clients]);

    const filteredClients = clients.filter(c => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch = !q
            || c.email.toLowerCase().includes(q)
            || c.name.toLowerCase().includes(q)
            || (c.phone || '').includes(q)
            || c.events.some(e => e.name.toLowerCase().includes(q));
        return matchesSearch && (filter === 'todos' || c.opportunity === filter);
    });

    const withPhone = clients.filter(c => c.phone).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
                <p className="text-slate-400">
                    Quienes usan el organizador: qué cargaron en su evento, si compraron y cuándo entraron por última vez.
                </p>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Clientes', value: counts.todos || 0, hint: `${withPhone} con teléfono`, color: 'text-white' },
                    { label: 'Para llamar', value: counts.llamar || 0, hint: 'Cargaron invitados o el evento está cerca, sin comprar', color: 'text-amber-400' },
                    { label: 'Ya compraron', value: counts.compro || 0, hint: 'Invitación o Ingreso VIP', color: 'text-emerald-400' },
                    { label: 'Sin evento', value: counts.sin_evento || 0, hint: 'Se registraron y no armaron nada', color: 'text-slate-400' },
                ].map(card => (
                    <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{card.hint}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, email, teléfono o evento..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filter === f.id
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
                        >
                            {f.label} <span className="opacity-60">{counts[f.id] || 0}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                            <p className="text-slate-400 font-medium">Cargando clientes...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                <Users size={24} />
                            </div>
                            <p className="text-slate-400 font-medium">No se encontraron clientes.</p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[960px] text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-4 font-bold tracking-wider">Cliente</th>
                                    <th className="px-5 py-4 font-bold tracking-wider">Su evento</th>
                                    <th className="px-5 py-4 font-bold tracking-wider">Compró / pidió</th>
                                    <th className="px-5 py-4 font-bold tracking-wider">Actividad</th>
                                    <th className="px-5 py-4 font-bold tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredClients.map((client) => {
                                    const mainEvent = client.events.find(e => e.daysLeft === null || e.daysLeft >= 0) || client.events[0];
                                    const wa = whatsappLink(client.phone, clientMessage(client.name, mainEvent?.name));
                                    const modules = Array.from(new Set(client.events.flatMap(e => e.modules)));
                                    return (
                                        <tr key={client.id} className={`hover:bg-slate-800/40 transition-colors align-top ${client.is_active ? '' : 'opacity-60'}`}>
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-white text-base leading-tight">{client.name}</p>
                                                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${OPPORTUNITY_STYLES[client.opportunity]}`}>
                                                    {OPPORTUNITY_LABELS[client.opportunity]}
                                                </span>
                                                <div className="space-y-1 mt-2">
                                                    {client.email && (
                                                        <p className="text-xs text-slate-400 flex items-center gap-1.5 max-w-[240px]" title={client.email}>
                                                            <Mail size={12} className="shrink-0" /> <span className="truncate">{client.email}</span>
                                                        </p>
                                                    )}
                                                    {client.phone ? (
                                                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                            <Phone size={12} /> {client.phone}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                                                            <Phone size={12} /> Sin teléfono
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {client.events.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {client.events.map(e => (
                                                            <div key={e.id} className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/50 min-w-[220px]">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <p className="text-slate-200 font-semibold text-xs truncate">{e.name}</p>
                                                                    <span className="text-[10px] text-slate-500 shrink-0">{e.progress}%</span>
                                                                </div>
                                                                <div className="h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                                                    <div className="h-full bg-blue-500" style={{ width: `${e.progress}%` }} />
                                                                </div>
                                                                <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1 whitespace-nowrap">
                                                                    <Calendar size={11} /> {formatDate(e.date)}
                                                                    <span className={e.daysLeft !== null && e.daysLeft >= 0 && e.daysLeft <= 60 ? 'text-amber-400' : 'text-slate-500'}>
                                                                        · {formatDaysLeft(e.daysLeft)}
                                                                    </span>
                                                                </p>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-1">
                                                                    <span className="flex items-center gap-1"><Users size={11} /> {e.guests} invitados{e.confirmed > 0 ? ` · ${e.confirmed} confirmados` : ''}</span>
                                                                    <span className="flex items-center gap-1"><LayoutGrid size={11} /> {e.tables} mesas</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic">Todavía no armó su evento</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                    {modules.map(m => (
                                                        <span key={m} className="text-[10px] font-bold px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                            {MODULE_LABELS[m] || m}
                                                        </span>
                                                    ))}
                                                    {modules.length === 0 && client.events.length > 0 && (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-500 border border-slate-700">Sin plan pago</span>
                                                    )}
                                                    {client.events.some(e => e.hasInvitation) && (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">Armó la invitación</span>
                                                    )}
                                                    {client.leadsCount > 0 && (
                                                        <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 flex items-center gap-1">
                                                            <Inbox size={10} /> Pidió {client.leadsCount} presupuesto{client.leadsCount === 1 ? '' : 's'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs whitespace-nowrap">
                                                <p className="text-slate-400">Se registró: <span className="text-slate-300">{formatDate(client.created_at)}</span></p>
                                                <p className="text-slate-400 mt-1 flex items-center gap-1">
                                                    <Clock size={11} /> Último ingreso: <span className="text-slate-300">{timeAgo(client.lastSignIn)}</span>
                                                </p>
                                                {!client.is_active && <p className="text-rose-400 font-bold mt-1">Bloqueado</p>}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {wa && (
                                                        <a
                                                            href={wa}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                            title="Escribirle por WhatsApp (con un mensaje ya armado)"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </a>
                                                    )}
                                                    {client.events.length > 0 && (
                                                        <>
                                                            <button
                                                                onClick={() => setSelectedClientForModules(client)}
                                                                className="p-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                                title="Activar o quitar planes"
                                                            >
                                                                <Settings size={16} />
                                                            </button>
                                                            <a
                                                                href={`/admin/event/${client.events[0].id}`}
                                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                title="Abrir el evento"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => toggleStatus(client.id, client.is_active)}
                                                        className={`p-2 rounded-lg transition-colors ${client.is_active ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                        title={client.is_active ? 'Bloquear cliente' : 'Desbloquear cliente'}
                                                    >
                                                        {client.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-950/30">
                    <span>Mostrando {filteredClients.length} de {clients.length} clientes</span>
                </div>
            </div>

            {/* Modal de planes */}
            {selectedClientForModules && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Crown className="text-amber-500" size={20}/> Planes del cliente</h3>
                            <button onClick={() => setSelectedClientForModules(null)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-slate-400">
                                Activá o quitá los planes de los eventos de <strong className="text-white">{selectedClientForModules.name}</strong> (por ejemplo, si te pagó por transferencia).
                            </p>
                            {selectedClientForModules.events.map(event => (
                                <div key={event.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Calendar size={16} className="text-blue-500"/> {event.name}</h4>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'invitation_pro', label: 'Invitación Digital', icon: <Link size={16} />, on: 'bg-blue-500/20 text-blue-400', accent: 'accent-blue-500' },
                                            { id: 'vip_access', label: 'Ingreso VIP', icon: <Shield size={16} />, on: 'bg-purple-500/20 text-purple-400', accent: 'accent-purple-500' },
                                        ].map(m => (
                                            <label key={m.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800/50 cursor-pointer hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${event.modules.includes(m.id) ? m.on : 'bg-slate-800 text-slate-500'}`}>
                                                        {m.icon}
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-200">{m.label}</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={event.modules.includes(m.id)}
                                                    onChange={(e) => handleToggleModule(event, m.id, e.target.checked)}
                                                    className={`w-5 h-5 ${m.accent}`}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex justify-end">
                            <button
                                onClick={() => setSelectedClientForModules(null)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
