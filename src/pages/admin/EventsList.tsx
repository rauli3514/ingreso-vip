import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Plus, Search, Calendar, Users as UsersIcon, MapPin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CreateEventModal from '../../components/CreateEventModal';

export default function EventsList() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: Event['status']) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(52,211,153,0.3)]';
            case 'pending': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'disabled': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'closed': return 'bg-black/50 text-slate-600 border-slate-800';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    const getStatusLabel = (status: Event['status']) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'pending': return 'Pendiente Lista';
            case 'disabled': return 'Deshabilitado';
            case 'closed': return 'Cerrado';
            default: return status;
        }
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Mis Eventos</h1>
                    <p className="text-slate-400 text-sm font-light">
                        Bienvenido al panel de control. Gestiona tus accesos desde aquí.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary shadow-lg shadow-amber-500/20"
                >
                    <Plus size={20} />
                    Nuevo Evento
                </button>
            </div>

            <div className="glass p-1 rounded-xl mb-10 max-w-md w-full flex items-center gap-3">
                <div className="pl-4 text-slate-500">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nombre o fecha..."
                    className="bg-transparent border-none shadow-none focus:shadow-none p-3 text-sm placeholder:text-slate-600 w-full"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 opacity-50">
                    <Loader2 className="w-10 h-10 text-[#FBBF24] animate-spin mb-4" />
                    <p className="text-slate-400 text-sm tracking-wider uppercase">Cargando...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-white font-medium text-lg mb-2">No tienes eventos activos</h3>
                    <p className="text-slate-500 mb-6 max-w-xs mx-auto text-sm">Comienza creando tu primer evento para gestionar invitados.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-outline text-sm"
                    >
                        Crear Evento
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/admin/event/${event.id}`)}
                            className="glass-card p-0 relative overflow-hidden group cursor-pointer hover:bg-white/[0.02]"
                        >

                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(event.status)}`}>
                                    {getStatusLabel(event.status)}
                                </span>
                            </div>

                            {/* Card Content */}
                            <div className="p-6 pt-8">
                                <div className="mb-6">
                                    <p className="text-xs text-[#FBBF24] font-medium tracking-widest uppercase mb-2 opacity-80 group-hover:opacity-100 transition-opacity">by Tecno Eventos</p>
                                    <h3 className="text-2xl font-bold text-white leading-tight group-hover:text-[#FBBF24] transition-colors">{event.name}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-300 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[#FBBF24]">
                                            <Calendar size={16} />
                                        </div>
                                        <span className="text-sm font-medium">{format(new Date(event.date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                                            <UsersIcon size={14} className="text-slate-500" />
                                            <span className="text-xs text-slate-300">
                                                <strong className="text-white">{event.guest_count_total}</strong> Inv.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                                            <MapPin size={14} className="text-slate-500" />
                                            <span className="text-xs text-slate-300">
                                                <strong className="text-white">{event.table_count}</strong> Mesas
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex justify-between items-center">
                                <span className="text-[10px] text-slate-600 uppercase tracking-wider">ID: {event.id.slice(0, 8)}...</span>
                                <span className="text-[10px] text-slate-500">Ver detalles →</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onEventCreated={fetchEvents}
            />
        </DashboardLayout>
    );
}
