import { useEffect, useState } from 'react';
import { Search, Filter, ExternalLink, Loader2, Sparkles, User, Crown, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeadData {
    id: string;
    created_at: string;
    name: string;
    ownerEmail: string;
    guestCount: number;
    estimatedBudget: number;
    status: 'gratis' | 'potencial' | 'premium';
}

export default function Leads() {
    const [leads, setLeads] = useState<LeadData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLeads = async () => {
        try {
            setLoading(true);
            // Fetch events and join with profiles to get email
            const { data, error } = await supabase
                .from('events')
                .select(`
                    id,
                    created_at,
                    name,
                    planner_data,
                    profiles!inner(email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const parsedLeads: LeadData[] = data.map((event: any) => {
                    const planner = event.planner_data || {};
                    const guests = planner.guests || [];
                    const budget = planner.estimatedBudget || 0;
                    const services = planner.services || [];
                    
                    // Determinar estado comercial
                    let status: LeadData['status'] = 'gratis';
                    
                    const hasPremiumServiceReady = services.some(
                        (s: any) => s.group === 'eventpix_premium' && s.status === 'ready'
                    );

                    if (hasPremiumServiceReady) {
                        status = 'premium';
                    } else if (guests.length > 20 || planner.tables?.length > 0) {
                        status = 'potencial';
                    }

                    return {
                        id: event.id,
                        created_at: new Date(event.created_at).toLocaleDateString(),
                        name: event.name || 'Evento sin nombre',
                        ownerEmail: event.profiles?.email || 'Sin correo',
                        guestCount: guests.length,
                        estimatedBudget: budget,
                        status
                    };
                });
                
                setLeads(parsedLeads);
            }
        } catch (err) {
            console.error("Error fetching leads:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleDeleteLead = async (eventId: string, eventName: string) => {
        const confirmFirst = confirm(`¿Estás seguro de que deseas eliminar el lead/evento "${eventName}"?\nEsta acción no se puede deshacer.`);
        if (!confirmFirst) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            
            // Refresh list
            fetchLeads();
        } catch (error: any) {
            console.error('Error deleting lead:', error);
            alert(`Error al eliminar: ${error.message}`);
        }
    };

    const getStatusBadge = (status: LeadData['status']) => {
        switch(status) {
            case 'gratis': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        <User size={12} /> Gratis Activo
                    </span>
                );
            case 'potencial': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Sparkles size={12} /> Potencial Premium
                    </span>
                );
            case 'premium': 
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                        <Crown size={12} className="text-yellow-500" /> Cliente Premium
                    </span>
                );
        }
    };

    const filteredLeads = leads.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Monitor CRM de EventPix</h1>
                    <p className="text-slate-400">Analiza en tiempo real cómo los usuarios organizan sus eventos y detecta oportunidades de venta.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto">
                    Exportar CSV
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Buscar por email, nombre del evento o ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                        <Filter size={18} />
                        Estado Comercial
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                            <p className="text-slate-400 font-medium">Buscando leads en la base de datos...</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                <Search size={24} />
                            </div>
                            <p className="text-slate-400 font-medium">No se encontraron leads con ese criterio.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">ID Lead</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Usuario / Evento</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-center">Invitados</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Presupuesto Est.</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Estado Comercial</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Creado</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                            {lead.id.substring(0, 8).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white mb-0.5">{lead.ownerEmail}</p>
                                            <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{lead.name}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-bold ${lead.guestCount > 20 ? 'text-indigo-400' : 'text-slate-300'}`}>
                                                {lead.guestCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-right text-emerald-400/90">
                                            {lead.estimatedBudget > 0 
                                                ? `$${lead.estimatedBudget.toLocaleString('es-AR')}`
                                                : <span className="text-slate-600 font-normal">No definido</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(lead.status)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                                            {lead.created_at}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors tooltip-trigger" title="Ver planificador">
                                                    <ExternalLink size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteLead(lead.id, lead.name)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors tooltip-trigger" 
                                                    title="Eliminar Lead"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-950/30">
                    <span>Mostrando {filteredLeads.length} leads</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1.5 rounded bg-slate-800/50 text-slate-400 hover:bg-slate-700 transition-colors disabled:opacity-50" disabled>Anterior</button>
                        <button className="px-3 py-1.5 rounded bg-slate-800/50 text-slate-400 hover:bg-slate-700 transition-colors">Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
