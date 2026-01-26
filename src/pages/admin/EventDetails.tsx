import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Event, Guest } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    ArrowLeft, Calendar, Users, MapPin,
    Upload, Plus, Clock, CheckCircle2,
    Palette, Video, Download, Settings, QrCode, Music
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import GuestImportModal from '../../components/GuestImportModal';
import CreateGuestModal from '../../components/CreateGuestModal';

// Tabs Components
import GuestsTab from './components/event_details/GuestsTab';
import TablesTab from './components/event_details/TablesTab';
import DesignTab from './components/event_details/DesignTab';
import ReceptionistTab from './components/event_details/ReceptionistTab';
import DownloadsTab from './components/event_details/DownloadsTab';
import SettingsTab from './components/event_details/SettingsTab';
import PlaylistTab from './components/event_details/PlaylistTab';

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'guests' | 'tables' | 'settings' | 'design' | 'receptionist' | 'downloads' | 'playlist'>('guests');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

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
        } catch (error: any) {
            console.error('Error loading event:', error);
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

    const handleImportComplete = () => {
        fetchGuests();
        fetchEventDetails();
    };

    const handleGuestAdded = (newGuest: Guest) => {
        setGuests(prev => [newGuest, ...prev]);
        fetchEventDetails();
        setIsCreateModalOpen(false);
    };

    const handleGuestUpdated = (updatedGuest: Guest) => {
        setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));
        fetchEventDetails();
        setIsCreateModalOpen(false);
        setEditingGuest(null);
    };

    const handleDeleteGuest = async (guestId: string) => {
        if (!confirm('¿Estás seguro de eliminar este invitado?')) return;

        try {
            const { error } = await supabase
                .from('guests')
                .delete()
                .eq('id', guestId);

            if (error) throw error;
            setGuests(prev => prev.filter(g => g.id !== guestId));
        } catch (error) {
            console.error('Error deleting guest:', error);
            alert('Error al eliminar invitado');
        }
    };

    const handleUpdateGuestStatus = async (guestId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('guests')
                .update({ status: newStatus })
                .eq('id', guestId);

            if (error) throw error;
            setGuests(prev => prev.map(g => g.id === guestId ? { ...g, status: newStatus as any } : g));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error al actualizar estado');
        }
    };

    const handleAssignTable = async (guestId: string, newTableName: string | null) => {
        // Optimistic update
        const originalGuests = [...guests];
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_info: newTableName || undefined } : g));

        try {
            const { error } = await supabase
                .from('guests')
                .update({ table_info: newTableName })
                .eq('id', guestId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating guest table:', err);
            setGuests(originalGuests); // Revert
            alert('Error al asignar mesa');
        }
    };

    const onUpdateEvent = (updates: Partial<Event>) => {
        setEvent(prev => prev ? { ...prev, ...updates } : null);
    };

    const onUpdateGuests = (updatedGuests: Guest[]) => {
        setGuests(updatedGuests);
    };

    const getGuestUrl = () => {
        const baseUrl = window.location.pathname.startsWith('/ingreso-vip') ? '/ingreso-vip' : '';
        return `${window.location.origin}${baseUrl}/evento/${event?.id}`;
    };

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
                    className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6 text-xs font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={14} /> Volver al Dashboard
                </button>

                {event.status === 'closed' && (
                    <div className="bg-slate-800 text-white px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-lg">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <Clock size={16} />
                        </div>
                        <div>
                            <p className="font-bold text-sm">Evento Finalizado</p>
                            <p className="text-xs text-slate-400">Este evento está cerrado. Solo lectura.</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-foreground tracking-tight font-display">{event.name}</h1>
                            <span className={`badge ${event.status === 'active'
                                ? 'bg-emerald-500 text-white border-transparent'
                                : 'bg-slate-100 text-slate-600 border-slate-200'} border px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm`}>
                                {event.status === 'active' ? 'En Curso' : event.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 text-muted-foreground text-sm font-medium">
                            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                                <Calendar size={14} className="text-accent" />
                                <span>{event.date ? format(new Date(event.date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha'}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                                <Users size={14} className="text-accent" />
                                <span>{guests.length} Invitados</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.open(getGuestUrl(), '_blank')}
                            className="btn btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                            title="Ver vista del invitado"
                        >
                            <QrCode size={16} className="mr-2" /> Ver App
                        </button>
                        {event.status !== 'closed' && (
                            <>
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="btn btn-outline"
                                >
                                    <Upload size={16} className="mr-2" /> Importar
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="btn btn-primary"
                                >
                                    <Plus size={16} className="mr-2" /> Nuevo Invitado
                                </button>
                            </>
                        )}
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

            {/* Tabs Navigation */}
            <div className="mb-8">
                <div className="bg-surface border border-border p-1.5 rounded-xl inline-flex flex-wrap gap-1 shadow-sm">
                    {[
                        { id: 'guests', label: 'Invitados', icon: Users },
                        { id: 'tables', label: 'Organizador', icon: MapPin },
                        { id: 'design', label: 'Diseño', icon: Palette },
                        { id: 'receptionist', label: 'Recepcionista', icon: Video },
                        { id: 'playlist', label: 'Música', icon: Music },
                        { id: 'downloads', label: 'Descargas', icon: Download },
                        { id: 'settings', label: 'Configuración', icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                                ${activeTab === tab.id
                                    ? 'bg-accent/10 text-accent-dark shadow-sm ring-1 ring-inset ring-accent/20'
                                    : 'text-muted hover:text-foreground hover:bg-background'}
                            `}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-accent' : 'text-muted-foreground'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Contents */}
            {activeTab === 'guests' && (
                <GuestsTab
                    event={event}
                    guests={guests}
                    onUpdateStatus={handleUpdateGuestStatus}
                    onDelete={handleDeleteGuest}
                    onEdit={(guest) => {
                        setEditingGuest(guest);
                        setIsCreateModalOpen(true);
                    }}
                    onImport={() => setIsImportModalOpen(true)}
                />
            )}

            {activeTab === 'tables' && (
                <TablesTab
                    event={event}
                    guests={guests}
                    onAssignTable={handleAssignTable}
                />
            )}

            {activeTab === 'design' && (
                <DesignTab
                    event={event}
                    onUpdateEvent={onUpdateEvent}
                />
            )}

            {activeTab === 'receptionist' && (
                <ReceptionistTab
                    event={event}
                    guests={guests}
                    onUpdateEvent={onUpdateEvent}
                    onUpdateGuests={onUpdateGuests}
                />
            )}

            {activeTab === 'playlist' && (
                <PlaylistTab
                    event={event}
                />
            )}

            {activeTab === 'downloads' && (
                <DownloadsTab
                    event={event}
                    guests={guests}
                />
            )}

            {activeTab === 'settings' && (
                <SettingsTab
                    event={event}
                    onUpdateEvent={onUpdateEvent}
                />
            )}

            {/* Modals */}
            <GuestImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                event={event}
                onImportComplete={handleImportComplete}
            />

            <CreateGuestModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingGuest(null);
                }}
                event={event}
                guestToEdit={editingGuest}
                onGuestAdded={handleGuestAdded}
                onGuestUpdated={handleGuestUpdated}
            />

        </DashboardLayout>
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
    };

    return (
        <div className="card-premium p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                <Icon size={24} />
            </div>
            <div>
                <div className="text-2xl font-bold text-foreground leading-none mb-1">{value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
            </div>
        </div>
    );
}
