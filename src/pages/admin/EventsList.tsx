import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Event } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import { Plus, Search, Calendar, Users as UsersIcon, MapPin, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CreateEventModal from '../../components/CreateEventModal';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types';

export default function EventsList() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { user, role } = useAuth();


    useEffect(() => {
        if (user) fetchEvents();
    }, [user]);

    const fetchEvents = async () => {
        try {
            // 1. Get User Profile for Role & Assignments
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            const userProfile = profile as UserProfile;
            const isSuperAdmin = userProfile?.role === 'superadmin';
            const assignedIds = userProfile?.assigned_event_ids || [];

            // 2. Fetch Events
            // Strategy: Fetch all and filter client side for flexibility in this demo
            const { data: allEvents, error } = await supabase
                .from('events')
                .select('*')
                .order('date', { ascending: true });

            if (error) throw error;

            let finalEvents = allEvents || [];

            // 3. Apply Security Filter (Frontend Enforcement)
            if (!isSuperAdmin) {
                finalEvents = finalEvents.filter(event => {
                    // Owns the event
                    if (event.owner_id === user?.id) return true;
                    // Is assigned to the event
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
        const confirmFirst = confirm(`¿Estás seguro de que deseas eliminar el evento "${eventName}" ?\n\nEsta acción no se puede deshacer.`);
        if (!confirmFirst) return;

        const confirmSecond = confirm(`CONFIRMACIÓN FINAL: \n\n¿Realmente deseas eliminar "${eventName}" y todos sus invitados ?\n\nEscribe OK en tu mente y presiona Aceptar para continuar.`);
        if (!confirmSecond) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            alert('✅ Evento eliminado correctamente');
            fetchEvents();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            alert(`❌ Error al eliminar evento: ${error.message} `);
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
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onEventCreated={fetchEvents}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Mis Eventos</h1>
                    <p className="text-slate-400 text-sm font-light">
                        Bienvenido al panel de control. Gestiona tus accesos desde aquí.
                    </p>
                </div>

                {/* BLOQUEO: Solo superadmin puede crear eventos */}
                {role === 'superadmin' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary shadow-lg shadow-amber-500/20"
                    >
                        <Plus size={20} />
                        Nuevo Evento
                    </button>
                )}
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
                    <p className="text-slate-400 text-sm tracking-wider uppercase">Cargando eventos...</p>
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 border border-slate-200 shadow-sm">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold text-lg mb-2">No tienes eventos activos</h3>
                    <p className="text-slate-500 mb-6 max-w-xs mx-auto text-sm">Comienza creando tu primer evento para gestionar invitados.</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-outline text-sm bg-white"
                    >
                        Crear Evento
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/ admin / event / ${event.id} `)}
                            className="glass-card p-0 relative overflow-hidden group cursor-pointer bg-white hover:bg-slate-50 border-slate-200"
                        >

                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 z-10">
                                <span className={`badge ${event.status === 'active' ? 'badge-success' :
                                        event.status === 'pending' ? 'badge-warning' :
                                            event.status === 'disabled' ? 'badge-neutral' : 'badge-neutral'
                                    } `}>
                                    {getStatusLabel(event.status)}
                                </span>
                            </div>

                            {/* Card Content */}
                            <div className="p-6 pt-8">
                                <div className="mb-6">
                                    <p className="text-xs text-amber-600 font-bold tracking-widest uppercase mb-2">Cliente VIP</p>
                                    <h3 className="text-2xl font-bold text-slate-900 leading-tight group-hover:text-amber-600 transition-colors font-display">{event.name}</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                            <Calendar size={16} />
                                        </div>
                                        <span className="text-sm font-medium">{format(new Date(event.date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: es })}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                            <UsersIcon size={14} className="text-slate-400" />
                                            <span className="text-xs text-slate-500">
                                                <strong className="text-slate-900">{event.guest_count_total}</strong> Inv.
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                            <MapPin size={14} className="text-slate-400" />
                                            <span className="text-xs text-slate-500">
                                                <strong className="text-slate-900">{event.table_count}</strong> Mesas
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">ID: {event.id.slice(0, 8)}...</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/ admin / event / ${event.id} `);
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Ver detalles"
                                    >
                                        <ExternalLink size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/ admin / event / ${event.id}/invitation`);
                                        }}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Editar Invitación Web"
                                    >
                                        <span className="text-base">💌</span>
                                    </button >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteEvent(event.id, event.name);
                                        }}
                                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                        title="Eliminar evento"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <span className="text-[10px] text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Ver detalles →</span>
                                </div >
                            </div >
                        </div >
                    ))}
                </div >
            )}
        </DashboardLayout >
    );
}
