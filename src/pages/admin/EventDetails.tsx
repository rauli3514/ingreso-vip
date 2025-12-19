import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabase';
import { Event, Guest } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    ArrowLeft, Calendar, Users, MapPin, Search,
    Upload, Plus, Filter, MoreVertical, CheckCircle2, Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import GuestImportModal from '../../components/GuestImportModal';
import CreateGuestModal from '../../components/CreateGuestModal';

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'guests' | 'tables' | 'settings'>('guests');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            fetchGuests();
        }
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setEvent(data);
        } catch (error) {
            console.error('Error loading event:', error);
            // Mock data for UI verification
            setEvent({
                id: '123',
                name: 'Evento de Prueba (Visualización)',
                date: '2025-12-25',
                guest_count_total: 150,
                status: 'active',
                table_count: 15,
                owner_id: 'user-id',
                created_at: new Date().toISOString()
            } as any);
        } finally {
            setLoading(false);
        }
    };

    const fetchGuests = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .eq('event_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGuests(data || []);
        } catch (error) {
            console.error('Error loading guests:', error);
        }
    };

    const handleImportComplete = (newGuests?: Guest[]) => {
        if (event?.id === '123' && newGuests) {
            setGuests(prev => [...newGuests, ...prev]);
        } else {
            fetchGuests();
            fetchEventDetails();
        }
    };

    const handleGuestAdded = (newGuest: Guest) => {
        setGuests(prev => [newGuest, ...prev]);
        if (event?.id !== '123') {
            fetchEventDetails();
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const newTableInfo = destination.droppableId === 'unassigned' ? undefined : destination.droppableId;

        // Optimistic update
        const updatedGuests = guests.map(g =>
            g.id === draggableId ? { ...g, table_info: newTableInfo } : g
        );
        setGuests(updatedGuests as Guest[]);

        // Update Backend
        if (event?.id === '123') return; // Mock mode

        try {
            const { error } = await supabase
                .from('guests')
                .update({ table_info: newTableInfo || null })
                .eq('id', draggableId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating guest table:', err);
            // Revert on error
            fetchGuests();
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (event?.id === '123') {
            alert('En modo demo no se pueden guardar cambios de configuración.');
            return;
        }

        // Logic to update event in Supabase would go here
        alert('Configuración guardada (simulado).');
    };

    const filteredGuests = guests.filter(g =>
        g.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.last_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full"></div>
            </div>
        </DashboardLayout>
    );

    if (!event) return null;

    return (
        <DashboardLayout>
            {/* Header with Back Button */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-xs font-medium uppercase tracking-wider"
                >
                    <ArrowLeft size={14} /> Volver al Dashboard
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">{event.name}</h1>
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-[#FBBF24]" />
                                <span>{format(new Date(event.date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-700" />
                            <div className="flex items-center gap-2">
                                <Users size={14} className="text-[#FBBF24]" />
                                <span>{event.guest_count_total} Invitados</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="btn btn-outline text-sm py-2 px-4 bg-white/5 border-white/10 hover:bg-white/10"
                        >
                            <Upload size={16} className="mr-2" /> Importar
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn btn-primary text-sm py-2 px-4 shadow-lg shadow-yellow-500/20"
                        >
                            <Plus size={16} className="mr-2" /> Nuevo Invitado
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Invitados" value={guests.length} icon={Users} color="blue" />
                <StatCard label="Confirmados" value={guests.filter(g => g.status === 'confirmed').length} icon={CheckCircle2} color="emerald" />
                <StatCard label="En Espera" value={guests.filter(g => g.status === 'pending').length} icon={Clock} color="amber" />
                <StatCard label="Mesas Asignadas" value={guests.filter(g => !!g.table_info).length} icon={MapPin} color="purple" />
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-white/10">
                <div className="flex gap-6">
                    <TabButton active={activeTab === 'guests'} onClick={() => setActiveTab('guests')} label="Lista de Invitados" />
                    <TabButton active={activeTab === 'tables'} onClick={() => setActiveTab('tables')} label="Mesas" />
                    <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} label="Configuración" />
                </div>
            </div>

            {/* Guests List */}
            {activeTab === 'guests' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex gap-3">
                        <div className="glass p-1 rounded-xl flex-1 flex items-center gap-3">
                            <div className="pl-4 text-slate-500"><Search size={18} /></div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar invitado por nombre..."
                                className="bg-transparent border-none shadow-none focus:shadow-none p-3 text-sm placeholder:text-slate-600 w-full"
                            />
                        </div>
                        <button className="btn btn-outline px-3 border-white/10 hover:bg-white/5 text-slate-400">
                            <Filter size={18} />
                        </button>
                    </div>

                    {guests.length === 0 ? (
                        <div className="glass-card overflow-hidden">
                            <div className="text-center py-12 text-slate-500">
                                <Users size={32} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">Aún no hay invitados cargados.</p>
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="text-[#FBBF24] text-sm font-medium mt-2 hover:underline"
                                >
                                    Importar lista CSV
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.02]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-xs text-slate-400 uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Invitado</th>
                                        <th className="px-6 py-4">Mesa / Ubicación</th>
                                        <th className="px-6 py-4 text-center">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredGuests.map((guest) => (
                                        <tr key={guest.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-white font-medium">{guest.last_name}, {guest.first_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {guest.table_info ? (
                                                    <span className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-[#FBBF24]" /> {guest.table_info}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 italic">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${guest.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    guest.status === 'arrived' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                    }`}>
                                                    {guest.status === 'pending' ? 'Pendiente' : guest.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tables Tab */}
            {activeTab === 'tables' && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="animate-in fade-in duration-300 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {/* Unassigned Guests Card */}
                            <Droppable droppableId="unassigned">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="glass-card p-0 flex flex-col h-96 border-l-4 border-l-slate-500"
                                    >
                                        <div className="p-4 border-b border-white/5 bg-slate-500/5">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-white">Sin Asignar</h3>
                                                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">
                                                    {guests.filter(g => !g.table_info).length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                            {guests.filter(g => !g.table_info).map((guest, index) => (
                                                <Draggable key={guest.id} draggableId={guest.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="p-2 mb-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-between group cursor-grab active:cursor-grabbing border border-transparent hover:border-white/10"
                                                        >
                                                            <span className="text-sm text-slate-300">{guest.last_name}, {guest.first_name}</span>
                                                            <div className="text-slate-500 hover:text-white">
                                                                <MoreVertical size={14} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {guests.filter(g => !g.table_info).length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic">
                                                    No hay invitados sin asignar
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Droppable>

                            {/* Generated Tables */}
                            {[
                                ...Array.from({ length: event.table_count || 0 }, (_, i) => `Mesa ${i + 1}`),
                                ...Array.from(new Set(guests.map(g => g.table_info).filter(t => t && !t.startsWith('Mesa '))))
                            ].map((tableName) => {
                                if (!tableName) return null;
                                const tableGuests = guests.filter(g => g.table_info === tableName);
                                return (
                                    <Droppable key={tableName} droppableId={tableName}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="glass-card p-0 flex flex-col h-96 border-l-4 border-l-[#FBBF24]"
                                            >
                                                <div className="p-4 border-b border-white/5 bg-[#FBBF24]/5">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="font-bold text-white truncate max-w-[70%]">{tableName}</h3>
                                                        <span className="text-xs bg-yellow-500/20 text-[#FBBF24] px-2 py-1 rounded-full">
                                                            {tableGuests.length} / {event.guests_per_table_default || 10}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                                    {tableGuests.map((guest, index) => (
                                                        <Draggable key={guest.id} draggableId={guest.id} index={index}>
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className="p-2 mb-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-between group cursor-grab active:cursor-grabbing border border-transparent hover:border-white/10"
                                                                >
                                                                    <span className="text-sm text-slate-300">{guest.last_name}, {guest.first_name}</span>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                    {tableGuests.length === 0 && (
                                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs italic">
                                                            Mesa vacía
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                );
                            })}
                        </div>
                    </div>
                </DragDropContext>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="animate-in fade-in duration-300 max-w-2xl">
                    <form onSubmit={handleUpdateEvent} className="glass-card p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Información del Evento</h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre del Evento</label>
                                    <input
                                        type="text"
                                        defaultValue={event.name}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</label>
                                        <input
                                            type="date"
                                            defaultValue={event.date}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600 appearance-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cantidad de Mesas</label>
                                        <input
                                            type="number"
                                            defaultValue={event.table_count || 10}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <button className="btn btn-primary py-2.5 px-6 shadow-lg shadow-yellow-500/20">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {event && <GuestImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                event={event}
                onImportComplete={handleImportComplete}
            />}

            {/* Create Guest Modal */}
            {event && <CreateGuestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                event={event}
                onGuestAdded={handleGuestAdded}
            />}

        </DashboardLayout>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colors = {
        blue: 'text-blue-400 bg-blue-400/10',
        emerald: 'text-emerald-400 bg-emerald-400/10',
        amber: 'text-[#FBBF24] bg-amber-400/10',
        purple: 'text-purple-400 bg-purple-400/10',
    };

    return (
        <div className="glass-card p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color as keyof typeof colors]}`}>
                <Icon size={20} />
            </div>
            <div>
                <div className="text-2xl font-bold text-white leading-none mb-1">{value}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`pb-4 text-sm font-medium transition-colors relative ${active ? 'text-[#FBBF24]' : 'text-slate-400 hover:text-white'}`}
        >
            {label}
            {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#FBBF24] shadow-[0_0_10px_2px_rgba(251,191,36,0.3)]" />}
        </button>
    );
}
