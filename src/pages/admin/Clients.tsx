import { useEffect, useState } from 'react';
import { Search, Loader2, Mail, Phone, Calendar, Users, Power, PowerOff, User, ExternalLink, Settings, Crown, X, Link, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserProfile, Event } from '../../types';

interface ExtendedClient extends UserProfile {
    events: Event[];
}

export default function Clients() {
    const [clients, setClients] = useState<ExtendedClient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientForModules, setSelectedClientForModules] = useState<ExtendedClient | null>(null);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const [profilesRes, eventsRes] = await Promise.all([
                supabase.from('profiles').select('*').neq('role', 'superadmin').order('created_at', { ascending: false }),
                supabase.from('events').select('*, guests(count)')
            ]);
                
            if (profilesRes.error) throw profilesRes.error;
            if (eventsRes.error) throw eventsRes.error;

            const events = eventsRes.data || [];
            const profiles = profilesRes.data || [];

            const clientsWithEvents = profiles.map(profile => ({
                ...profile,
                events: events.filter(e => e.owner_id === profile.id)
            }));

            setClients(clientsWithEvents);
        } catch (err) {
            console.error("Error fetching clients:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        if (!window.confirm(`¿Estás seguro de que deseas ${currentStatus ? 'bloquear' : 'desbloquear'} a este cliente?`)) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchClients();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(`Error al actualizar estado: ${error.message}`);
        }
    };

    const handleToggleModule = async (event: Event, module: string, enable: boolean) => {
        try {
            const plannerData = ((event as any).planner_data) || {};
            let activeModules = new Set(plannerData.active_modules || []);
            
            if (enable) {
                activeModules.add(module);
            } else {
                activeModules.delete(module);
            }
            
            const newPlannerData = {
                ...plannerData,
                active_modules: Array.from(activeModules)
            };

            const { error } = await supabase
                .from('events')
                .update({ planner_data: newPlannerData })
                .eq('id', event.id);

            if (error) throw error;
            
            // Update local state without full reload to make UI snappy
            setClients(prev => prev.map(c => {
                if (c.id === event.owner_id) {
                    return {
                        ...c,
                        events: c.events.map(e => e.id === event.id ? { ...e, planner_data: newPlannerData } as any : e)
                    };
                }
                return c;
            }));
            
            // Also update selectedClientForModules so modal reflects change immediately
            setSelectedClientForModules(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    events: prev.events.map(e => e.id === event.id ? { ...e, planner_data: newPlannerData } as any : e)
                }
            });

        } catch (error: any) {
            console.error('Error toggling module:', error);
            alert(`Error: ${error.message}`);
        }
    };

    const filteredClients = clients.filter(c => {
        const matchesSearch = (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (c.phone && c.phone.includes(searchTerm));
        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Directorio de Clientes</h1>
                    <p className="text-slate-400">Administra los usuarios (novios) registrados en la plataforma.</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Buscar por email o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
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
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-slate-950/80 text-slate-500 border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Eventos Activos</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Registro</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Estado</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-800/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-base">
                                                        {client.email?.split('@')[0]}
                                                    </p>
                                                    <div className="space-y-1 mt-1">
                                                        {client.email && (
                                                            <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                                <Mail size={12} /> {client.email}
                                                            </p>
                                                        )}
                                                        {client.phone && (
                                                            <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                                                                <Phone size={12} /> {client.phone}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {client.events.length > 0 ? (
                                                <div className="space-y-2">
                                                    {client.events.map(e => (
                                                        <div key={e.id} className="bg-slate-950/50 rounded-lg p-2 border border-slate-800/50">
                                                            <p className="text-slate-300 font-medium text-xs mb-1">{e.name}</p>
                                                            <div className="flex gap-3 text-[10px] text-slate-500">
                                                                <span className="flex items-center gap-1"><Calendar size={10} /> {e.date}</span>
                                                                <span className="flex items-center gap-1"><Users size={10} /> {((e as any).guests && (e as any).guests[0] && (e as any).guests[0].count > 0) ? (e as any).guests[0].count : ((e as any).planner_data?.guests?.length || e.guest_count_total)} inv.</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-500 italic">Sin eventos creados</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {client.is_active ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                                    Bloqueado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {client.events.length > 0 && (
                                                    <>
                                                        <button 
                                                            onClick={() => setSelectedClientForModules(client)}
                                                            className="p-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                            title="Administrar Módulos Premium"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                        <a 
                                                            href={`/evento/${client.events[0].id}`}
                                                            target="_blank" rel="noopener noreferrer"
                                                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title="Ver Evento Público"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </a>
                                                    </>
                                                )}
                                                <button 
                                                    onClick={() => toggleStatus(client.id, client.is_active)}
                                                    className={`p-2 rounded-lg transition-colors ${client.is_active ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'}`} 
                                                    title={client.is_active ? 'Bloquear Cliente' : 'Desbloquear Cliente'}
                                                >
                                                    {client.is_active ? <PowerOff size={16} /> : <Power size={16} />}
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
                    <span>Mostrando {filteredClients.length} clientes</span>
                </div>
            </div>

            {/* Modules Modal */}
            {selectedClientForModules && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-950/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Crown className="text-amber-500" size={20}/> Módulos Premium</h3>
                            <button onClick={() => setSelectedClientForModules(null)} className="text-slate-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <p className="text-sm text-slate-400">
                                Administra el acceso a los módulos Premium para los eventos de <strong className="text-white">{selectedClientForModules.email}</strong>.
                            </p>
                            {selectedClientForModules.events.map(event => {
                                const currentModules = ((event as any).planner_data)?.active_modules || [];
                                return (
                                    <div key={event.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                                        <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Calendar size={16} className="text-blue-500"/> {event.name}</h4>
                                        <div className="space-y-3">
                                            <label className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800/50 cursor-pointer hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentModules.includes('invitation_pro') ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        <Link size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200">Invitación Digital</p>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentModules.includes('invitation_pro')}
                                                    onChange={(e) => handleToggleModule(event, 'invitation_pro', e.target.checked)}
                                                    className="w-5 h-5 accent-blue-500"
                                                />
                                            </label>
                                            <label className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800/50 cursor-pointer hover:border-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentModules.includes('vip_access') ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                                                        <Shield size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-200">Ingreso VIP</p>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={currentModules.includes('vip_access')}
                                                    onChange={(e) => handleToggleModule(event, 'vip_access', e.target.checked)}
                                                    className="w-5 h-5 accent-purple-500"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                );
                            })}
                            {selectedClientForModules.events.length === 0 && (
                                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-xl text-sm border border-amber-500/20">
                                    Este cliente aún no tiene eventos creados.
                                </div>
                            )}
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
