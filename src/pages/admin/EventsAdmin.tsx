import { useEffect, useState } from 'react';
import { Search, Calendar, Users as UsersIcon, MapPin, Loader2, Trash2, ExternalLink, CalendarDays, BarChart2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Event, UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function EventsAdmin() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user) fetchEvents();
    }, [user]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            const userProfile = profile as UserProfile;
            const isSuperAdmin = userProfile?.role === 'superadmin';
            const assignedIds = userProfile?.assigned_event_ids || [];

            const { data: allEvents, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;

            let finalEvents = allEvents || [];

            if (!isSuperAdmin) {
                finalEvents = finalEvents.filter(event => {
                    if (event.owner_id === user?.id) return true;
                    if (assignedIds.includes(event.id)) return true;
                    return false;
                });
            }

            setEvents(finalEvents);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId: string, eventName: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar el evento "${eventName}"? Esta acción no se puede deshacer.`)) return;
        if (!confirm(`CONFIRMACIÓN FINAL: \n\n¿Realmente deseas eliminar "${eventName}" y todos sus invitados?`)) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            fetchEvents();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            alert(`Error al eliminar: ${error.message}`);
        }
    };

    const filteredEvents = events.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Monitor de Eventos</h1>
                    <p className="text-slate-400">Controla todos los eventos creados en la plataforma.</p>
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
                        placeholder="Buscar evento por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                    <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
                    <p className="text-slate-400 font-medium">Cargando eventos...</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500">
                        <CalendarDays size={24} />
                    </div>
                    <p className="text-slate-400 font-medium">No se encontraron eventos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {filteredEvents.map(event => (
                        <div key={event.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-blue-500/50 transition-colors group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{event.name}</h3>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                            <Calendar size={12} /> {event.date}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${event.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        {event.status === 'active' ? 'Activo' : 'Cerrado'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                                        <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5"><UsersIcon size={14} /> Invitados</p>
                                        <p className="text-lg font-bold text-slate-200">{event.guest_count_total}</p>
                                    </div>
                                    <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
                                        <p className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1.5"><MapPin size={14} /> Mesas</p>
                                        <p className="text-lg font-bold text-slate-200">{event.table_count}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <div className="flex gap-2">
                                    <a 
                                        href={`/admin/event/${event.id}`}
                                        className="btn py-2 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium gap-2 flex items-center rounded-lg transition-colors"
                                        title="Panel de Control del Evento"
                                    >
                                        Gestión
                                    </a>
                                    <a 
                                        href={`/admin/event/${event.id}/invitation`}
                                        className="btn py-2 px-3 text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 font-medium gap-2 flex items-center rounded-lg transition-colors"
                                        title="Diseñar Invitación"
                                    >
                                        💌 Diseño
                                    </a>
                                    <a 
                                        href={`/evento/${event.id}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                                        title="Ver App del Invitado"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                </div>
                                
                                <button 
                                    onClick={() => handleDeleteEvent(event.id, event.name)}
                                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Eliminar Evento"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
