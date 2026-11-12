import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Mail, Phone, Calendar, Users, Briefcase, Trash2, MessageCircle, Sparkles, Download, Inbox } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { daysUntil, formatDate, formatDaysLeft, timeAgo, whatsappLink } from '../../lib/adminClients';

// Pedidos de presupuesto hechos desde el organizador: a EventPix (Kiosco Box,
// pantalla...) o a un proveedor de la guía. Se cruza cada pedido con la cuenta
// y el evento de quien lo hizo para mostrar datos de contacto y del evento al día.

type LeadStatus = 'nuevo' | 'contactado' | 'cerrado';

interface LeadRow {
    id: string;
    status: LeadStatus;
    created_at: string;
    forEventPix: boolean;
    providerName: string | null;
    providerLogo: string | null;
    service: string;
    name: string;
    email: string | null;
    phone: string | null;
    hasAccount: boolean;
    eventId: string | null;
    eventName: string | null;
    eventDate: string | null;
    guests: number;
    budget: number;
}

const STATUS_STYLES: Record<LeadStatus, string> = {
    nuevo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    contactado: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cerrado: 'bg-slate-800 text-slate-400 border-slate-700',
};

async function fetchLeads(): Promise<LeadRow[]> {
    const { data, error } = await supabase
        .from('leads')
        .select('*, provider:providers(company_name, logo_url), event:events(id, name, date, owner_id, planner_data)')
        .order('created_at', { ascending: false });
    if (error) throw error;
    const leads = (data || []) as any[];

    const ownerIds = Array.from(new Set(leads.map(l => l.owner_id || l.event?.owner_id).filter(Boolean)));
    const profiles = new Map<string, any>();
    if (ownerIds.length > 0) {
        const { data: profs } = await supabase.from('profiles').select('*').in('id', ownerIds);
        (profs || []).forEach((p: any) => profiles.set(p.id, p));
    }

    return leads.map(l => {
        const details = l.event_details || {};
        const pd = l.event?.planner_data || {};
        const profile = profiles.get(l.owner_id || l.event?.owner_id);
        const email = profile?.email || l.client_email || null;
        // Los leads viejos guardaban el nombre del evento como client_name.
        const name = profile?.full_name
            || (l.client_email ? l.client_name : null)
            || email?.split('@')[0]
            || 'Sin cuenta';
        return {
            id: l.id,
            status: l.status,
            created_at: l.created_at,
            forEventPix: !l.provider_id,
            providerName: l.provider?.company_name || null,
            providerLogo: l.provider?.logo_url || null,
            service: details.service_requested || 'Sin especificar',
            name,
            email,
            phone: profile?.phone || l.client_phone || null,
            hasAccount: !!profile || !!l.client_email,
            eventId: l.event?.id || l.event_id || null,
            eventName: pd.name || l.event?.name || details.event_name || (l.client_email ? null : l.client_name) || null,
            eventDate: pd.date || l.event?.date || details.date || null,
            // Si el evento sigue en la base, se muestra lo que tiene hoy.
            guests: Array.isArray(pd.guests) ? pd.guests.length : (details.guests_count || 0),
            budget: pd.estimatedBudget || l.estimated_budget || 0,
        };
    });
}

function leadMessage(lead: LeadRow): string {
    const first = lead.name === 'Sin cuenta' ? '' : ` ${lead.name.split(' ')[0]}`;
    const evento = lead.eventName ? ` para "${lead.eventName}"` : '';
    return `¡Hola${first}! Te escribo de EventPix por el presupuesto de ${lead.service}${evento} que pediste desde el organizador.`;
}

function downloadCsv(rows: LeadRow[]) {
    const header = ['Fecha', 'Estado', 'Para', 'Servicio', 'Cliente', 'Email', 'Teléfono', 'Evento', 'Fecha del evento', 'Invitados', 'Presupuesto'];
    const lines = rows.map(l => [
        formatDate(l.created_at), l.status, l.forEventPix ? 'EventPix' : (l.providerName || 'Proveedor eliminado'),
        l.service, l.name, l.email || '', l.phone || '', l.eventName || '', l.eventDate || '', String(l.guests), String(l.budget || ''),
    ]);
    const csv = [header, ...lines]
        .map(cols => cols.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
        .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Leads() {
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [target, setTarget] = useState<'todos' | 'eventpix' | 'proveedores'>('todos');

    const loadLeads = async () => {
        try {
            setLoading(true);
            setLeads(await fetchLeads());
        } catch (err) {
            console.error('Error fetching leads:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    const handleDeleteLead = async (id: string, clientName: string) => {
        if (!window.confirm(`¿Eliminar el pedido de "${clientName}"?`)) return;
        const { error } = await supabase.from('leads').delete().eq('id', id);
        if (error) {
            alert(`Error al eliminar: ${error.message}`);
            return;
        }
        setLeads(prev => prev.filter(l => l.id !== id));
    };

    const handleStatusChange = async (id: string, newStatus: LeadStatus) => {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) {
            alert('Error al actualizar el estado');
            return;
        }
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    };

    const stats = useMemo(() => {
        const weekAgo = Date.now() - 7 * 86400000;
        return {
            nuevos: leads.filter(l => l.status === 'nuevo').length,
            eventpix: leads.filter(l => l.forEventPix).length,
            semana: leads.filter(l => new Date(l.created_at).getTime() >= weekAgo).length,
            sinContacto: leads.filter(l => !l.phone && !l.email).length,
        };
    }, [leads]);

    const filteredLeads = leads.filter(l => {
        const q = searchTerm.toLowerCase().trim();
        const matchesSearch = !q || [l.name, l.email, l.phone, l.providerName, l.service, l.eventName]
            .some(v => v && v.toLowerCase().includes(q));
        const matchesStatus = statusFilter === '' || l.status === statusFilter;
        const matchesTarget = target === 'todos' || (target === 'eventpix' ? l.forEventPix : !l.forEventPix);
        return matchesSearch && matchesStatus && matchesTarget;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Leads</h1>
                    <p className="text-slate-400">
                        Pedidos de presupuesto hechos desde el organizador, a EventPix o a un proveedor de la guía, con los datos de quien lo pidió.
                    </p>
                </div>
                <button
                    onClick={() => downloadCsv(filteredLeads)}
                    disabled={filteredLeads.length === 0}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto shrink-0 whitespace-nowrap flex items-center justify-center gap-2"
                >
                    <Download size={16} /> Descargar CSV
                </button>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Sin contactar', value: stats.nuevos, hint: 'En estado Nuevo', color: 'text-emerald-400' },
                    { label: 'Para EventPix', value: stats.eventpix, hint: 'Kiosco Box, pantalla, etc.', color: 'text-amber-400' },
                    { label: 'Últimos 7 días', value: stats.semana, hint: 'Pedidos nuevos', color: 'text-white' },
                    { label: 'Sin datos de contacto', value: stats.sinContacto, hint: 'Lo pidieron sin cuenta', color: 'text-slate-400' },
                ].map(card => (
                    <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                        <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                        <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                        <p className="text-[11px] text-slate-500 mt-1">{card.hint}</p>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por cliente, servicio, evento o proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as typeof target)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                >
                    <option value="todos">Para todos</option>
                    <option value="eventpix">Para EventPix</option>
                    <option value="proveedores">Para proveedores</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
                >
                    <option value="">Todos los estados</option>
                    <option value="nuevo">Nuevos</option>
                    <option value="contactado">Contactados</option>
                    <option value="cerrado">Cerrados</option>
                </select>
            </div>

            {/* Tabla */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                            <p className="text-slate-400 font-medium">Cargando leads...</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20 px-6 text-center">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                <Inbox size={24} />
                            </div>
                            <p className="text-slate-400 font-medium">No hay pedidos de presupuesto.</p>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                Aparecen cuando alguien toca "Pedir presupuesto" en Mi Evento, para un servicio de EventPix o para un proveedor.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full min-w-[960px] text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="px-5 py-4 font-bold tracking-wider">Quién</th>
                                    <th className="px-5 py-4 font-bold tracking-wider">Qué pidió</th>
                                    <th className="px-5 py-4 font-bold tracking-wider">Su evento</th>
                                    <th className="px-5 py-4 font-bold tracking-wider">Estado</th>
                                    <th className="px-5 py-4 font-bold tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredLeads.map((lead) => {
                                    const wa = whatsappLink(lead.phone, leadMessage(lead));
                                    const days = daysUntil(lead.eventDate);
                                    return (
                                        <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors align-top">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-white text-base leading-tight">{lead.name}</p>
                                                <div className="space-y-1 mt-1.5">
                                                    {lead.email && (
                                                        <p className="text-xs text-slate-400 flex items-center gap-1.5 max-w-[260px]" title={lead.email}><Mail size={12} className="shrink-0" /> <span className="truncate">{lead.email}</span></p>
                                                    )}
                                                    {lead.phone && (
                                                        <p className="text-xs text-slate-400 flex items-center gap-1.5"><Phone size={12} /> {lead.phone}</p>
                                                    )}
                                                    {!lead.email && !lead.phone && (
                                                        <p className="text-xs text-slate-600">{lead.hasAccount ? 'Sin teléfono cargado' : 'Lo pidió sin cuenta: no dejó contacto'}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-200">{lead.service}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    {lead.forEventPix ? (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                                            <Sparkles size={10} /> Para EventPix
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                                            {lead.providerLogo
                                                                ? <img src={lead.providerLogo} alt="" className="w-5 h-5 rounded object-cover border border-slate-700" />
                                                                : <Briefcase size={12} />}
                                                            {lead.providerName || 'Proveedor eliminado'}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-1.5">{timeAgo(lead.created_at)} · {formatDate(lead.created_at)}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                {lead.eventName || lead.eventDate ? (
                                                    <div className="space-y-1 text-xs">
                                                        {lead.eventName && <p className="text-slate-200 font-medium">{lead.eventName}</p>}
                                                        <p className="text-slate-400 flex items-center gap-1.5">
                                                            <Calendar size={12} /> {formatDate(lead.eventDate)}
                                                            {lead.eventDate && (
                                                                <span className={days !== null && days >= 0 && days <= 60 ? 'text-amber-400' : 'text-slate-500'}>· {formatDaysLeft(days)}</span>
                                                            )}
                                                        </p>
                                                        <p className="text-slate-400 flex items-center gap-1.5"><Users size={12} /> {lead.guests} invitados</p>
                                                        {lead.budget > 0 && (
                                                            <p className="text-emerald-400/90">Presupuesto total: ${lead.budget.toLocaleString('es-AR')}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic">Sin datos del evento</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                                                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${STATUS_STYLES[lead.status] || STATUS_STYLES.cerrado}`}
                                                >
                                                    <option value="nuevo">NUEVO</option>
                                                    <option value="contactado">CONTACTADO</option>
                                                    <option value="cerrado">CERRADO</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {wa && (
                                                        <a
                                                            href={wa}
                                                            target="_blank" rel="noopener noreferrer"
                                                            onClick={() => lead.status === 'nuevo' && handleStatusChange(lead.id, 'contactado')}
                                                            className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                            title="Escribirle por WhatsApp (queda como Contactado)"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteLead(lead.id, lead.name)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        title="Eliminar pedido"
                                                    >
                                                        <Trash2 size={16} />
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
                <div className="px-6 py-4 border-t border-slate-800 text-xs text-slate-500 bg-slate-950/30">
                    Mostrando {filteredLeads.length} de {leads.length} pedidos
                </div>
            </div>
        </div>
    );
}
