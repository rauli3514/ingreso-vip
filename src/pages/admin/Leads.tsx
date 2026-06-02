import { useEffect, useState } from 'react';
import { Search, Filter, ExternalLink, Loader2, DollarSign, Mail, Phone, Calendar, Users, Briefcase, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types';

export default function Leads() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select(`
                    *,
                    provider:providers(company_name, logo_url, category:services_offered)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            console.error("Error fetching leads:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const handleDeleteLead = async (id: string, clientName: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar el lead de "${clientName}"?`)) return;

        try {
            const { error } = await supabase
                .from('leads')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchLeads();
        } catch (error: any) {
            console.error('Error deleting lead:', error);
            alert(`Error al eliminar: ${error.message}`);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;
            fetchLeads(); // Refrescar para ver el cambio
        } catch (err) {
            console.error("Error updating status:", err);
            alert("Error al actualizar el estado");
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch(status) {
            case 'nuevo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'contactado': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'cerrado': return 'bg-slate-800 text-slate-400 border-slate-700';
            default: return 'bg-slate-800 text-slate-400 border-slate-700';
        }
    };

    const filteredLeads = leads.filter(l => {
        const matchesSearch = l.client_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (l.client_email && l.client_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (l.provider?.company_name && l.provider.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === '' || l.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Monitor de Leads</h1>
                    <p className="text-slate-400">Gestiona los contactos y solicitudes de presupuesto enviados a los proveedores.</p>
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
                        placeholder="Buscar por cliente, email o proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none min-w-[200px]"
                >
                    <option value="">Todos los estados</option>
                    <option value="nuevo">Nuevos</option>
                    <option value="contactado">Contactados</option>
                    <option value="cerrado">Cerrados</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                <div className="overflow-x-auto custom-scrollbar min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                            <p className="text-slate-400 font-medium">Cargando leads...</p>
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20 pb-20">
                            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                <Search size={24} />
                            </div>
                            <p className="text-slate-400 font-medium">No se encontraron leads.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Proveedor Solicitado</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Detalles del Evento</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Presupuesto Est.</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Estado</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-white mb-1 text-base">{lead.client_name}</p>
                                            <div className="space-y-1">
                                                {lead.client_phone && (
                                                    <p className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-emerald-400 transition-colors cursor-pointer">
                                                        <Phone size={12} /> {lead.client_phone}
                                                    </p>
                                                )}
                                                {lead.client_email && (
                                                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                        <Mail size={12} /> {lead.client_email}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {lead.provider?.logo_url ? (
                                                    <img src={lead.provider.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                                                        <Briefcase size={14} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-slate-200">{lead.provider?.company_name || 'Proveedor Eliminado'}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                                        {new Date(lead.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {lead.event_details?.guests_count && (
                                                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                        <Users size={12} /> {lead.event_details.guests_count} invitados
                                                    </p>
                                                )}
                                                {lead.event_details?.date && (
                                                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                        <Calendar size={12} /> {lead.event_details.date}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-right text-emerald-400/90">
                                            {lead.estimated_budget > 0 
                                                ? `$${lead.estimated_budget.toLocaleString('es-AR')}`
                                                : <span className="text-slate-600 font-normal">A cotizar</span>
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <select 
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${getStatusBadgeClass(lead.status)}`}
                                            >
                                                <option value="nuevo">NUEVO</option>
                                                <option value="contactado">CONTACTADO</option>
                                                <option value="cerrado">CERRADO</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a 
                                                    href={`https://wa.me/${lead.client_phone?.replace(/[^0-9]/g, '')}`} 
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" 
                                                    title="Escribir por WhatsApp"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button 
                                                    onClick={() => handleDeleteLead(lead.id, lead.client_name)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" 
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
                </div>
            </div>
        </div>
    );
}
