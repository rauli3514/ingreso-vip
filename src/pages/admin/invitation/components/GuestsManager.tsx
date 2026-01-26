import { useState, useEffect } from 'react';
import { Copy, Send, Trash2, UserPlus, ExternalLink, Users, Plus, X, Pencil, Ban } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

interface Guest {
    id: string;
    first_name: string;
    last_name: string;
    passes: number;
    companions: string[]; // Array de strings (nombres)
    invitation_sent?: boolean;
}

interface Props {
    eventId: string;
}

export default function GuestsManager({ eventId }: Props) {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

    // Form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [passes, setPasses] = useState(1);
    const [companions, setCompanions] = useState<string[]>([]);
    const [currentCompanion, setCurrentCompanion] = useState('');

    // URL Base amigable
    const baseUrl = `${window.location.origin}/invitacion/${eventId}`;

    useEffect(() => {
        fetchGuests();
    }, [eventId]);

    const fetchGuests = async () => {
        try {
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Mapeamos los datos de la BD a nuestra interfaz local
            const mappedGuests = (data || []).map(g => ({
                id: g.id,
                first_name: g.first_name,
                last_name: g.last_name,
                passes: g.passes || 1,
                companions: Array.isArray(g.companions) ? g.companions : [],
                invitation_sent: g.invitation_sent || false
            }));

            setGuests(mappedGuests);
        } catch (error) {
            console.error('Error fetching guests:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateGuestUrl = (guest: Guest) => {
        // Usamos el nombre completo como parámetro 'guest'
        const fullName = `${guest.first_name} ${guest.last_name}`.trim();
        return `${baseUrl}?guest=${encodeURIComponent(fullName)}`;
    };

    const handleAddCompanion = () => {
        if (!currentCompanion.trim()) return;
        setCompanions([...companions, currentCompanion.trim()]);
        setCurrentCompanion('');
    };

    const removeCompanion = (index: number) => {
        setCompanions(companions.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setPasses(1);
        setCompanions([]);
        setEditingGuestId(null);
    };

    const handleSaveGuest = async () => {
        if (!firstName.trim()) return;

        try {
            const guestData = {
                event_id: eventId,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                passes: passes,
                companions: companions,
                status: 'pending' // Default status
            };

            let savedGuest: Guest;

            if (editingGuestId) {
                // ACTUALIZAR
                const { data, error } = await supabase
                    .from('guests')
                    .update(guestData)
                    .eq('id', editingGuestId)
                    .select()
                    .single();

                if (error) throw error;

                savedGuest = {
                    id: data.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    passes: data.passes || 1,
                    companions: Array.isArray(data.companions) ? data.companions : []
                };

                // Actualizar lista local
                setGuests(guests.map(g => g.id === editingGuestId ? savedGuest : g));

            } else {
                // CREAR
                const { data, error } = await supabase
                    .from('guests')
                    .insert([guestData])
                    .select()
                    .single();

                if (error) throw error;

                savedGuest = {
                    id: data.id,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    passes: data.passes || 1,
                    companions: Array.isArray(data.companions) ? data.companions : []
                };

                // Agregar al inicio lista local
                setGuests([savedGuest, ...guests]);
            }

            resetForm();

        } catch (error: any) {
            alert('Error al guardar invitado: ' + error.message);
        }
    };

    const handleEditGuest = (guest: Guest) => {
        setEditingGuestId(guest.id);
        setFirstName(guest.first_name);
        setLastName(guest.last_name || '');
        setPasses(guest.passes);
        setCompanions(guest.companions || []);

        // Scroll al formulario
        const formElement = document.getElementById('guest-form');
        if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
    };

    const handleRemoveGuest = async (id: string) => {
        if (!confirm('¿Seguro quieres eliminar este invitado?')) return;
        try {
            const { error } = await supabase.from('guests').delete().eq('id', id);
            if (error) throw error;
            setGuests(guests.filter(g => g.id !== id));
            if (editingGuestId === id) resetForm();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleCopyLink = async (guest: Guest) => {
        const url = generateGuestUrl(guest);
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(guest.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            alert('Error al copiar el enlace');
        }
    };

    const handleWhatsAppShare = (guest: Guest) => {
        const url = generateGuestUrl(guest);
        const fullName = `${guest.first_name} ${guest.last_name}`.trim();
        const message = `Hola ${fullName}, te invitamos a nuestra boda. Aquí tienes tus ${guest.passes} pases para ingresar: ${url}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'pending'>('all');

    const handleToggleInvitationSent = async (guestId: string, currentStatus: boolean) => {
        // Optimistic update
        setGuests(guests.map(g => g.id === guestId ? { ...g, invitation_sent: !currentStatus } : g));

        try {
            const { error } = await supabase
                .from('guests')
                .update({ invitation_sent: !currentStatus })
                .eq('id', guestId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating invitation sent status:', err);
            // Revert
            setGuests(guests.map(g => g.id === guestId ? { ...g, invitation_sent: currentStatus } : g));
            alert('Error al actualizar estado de envío');
        }
    };

    const filteredGuests = guests.filter(g => {
        const matchesSearch = g.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.last_name.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'sent') return matchesSearch && g.invitation_sent;
        if (filterStatus === 'pending') return matchesSearch && !g.invitation_sent;

        return matchesSearch;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <UserPlus className="text-indigo-600" />
                    Gestión de Invitados
                </h3>
                <p className="text-slate-600 text-sm">
                    Agrega o edita tus invitados y asigna sus pases y acompañantes.
                </p>
            </div>

            {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
            <div id="guest-form" className={`bg-white p-6 rounded-xl border shadow-sm space-y-4 transition-colors ${editingGuestId ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-700">
                        {editingGuestId ? 'Editar Invitado' : 'Nuevo Invitado'}
                    </h4>
                    {editingGuestId && (
                        <button onClick={resetForm} className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1">
                            <Ban size={14} /> Cancelar Edición
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Ej: Juan"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apellido</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Ej: Pérez"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cantidad de Pases</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setPasses(Math.max(1, passes - 1))} className="p-2 bg-slate-200 hover:bg-slate-300 rounded text-slate-900 font-bold w-10">-</button>
                            <span className="font-bold w-8 text-center text-slate-900 text-lg">{passes}</span>
                            <button onClick={() => setPasses(passes + 1)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded text-slate-900 font-bold w-10">+</button>
                        </div>
                    </div>

                    <div>
                        {/* Acompañantes solo si passes > 1 */}
                        {passes > 1 && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Nombres de Acompañantes ({companions.length}/{passes - 1})
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={currentCompanion}
                                        onChange={(e) => setCurrentCompanion(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddCompanion()}
                                        placeholder="Nombre acompañante"
                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900"
                                        disabled={companions.length >= passes - 1}
                                    />
                                    <button
                                        onClick={handleAddCompanion}
                                        disabled={companions.length >= passes - 1 || !currentCompanion.trim()}
                                        className="bg-indigo-100 text-indigo-700 p-2 rounded-lg hover:bg-indigo-200 disabled:opacity-50"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {companions.map((comp, i) => (
                                        <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded flex items-center gap-1 border border-slate-200">
                                            {comp}
                                            <button onClick={() => removeCompanion(i)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={handleSaveGuest}
                        disabled={!firstName.trim()}
                        className={`w-full py-3 text-white rounded-lg font-bold shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${editingGuestId ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                        {editingGuestId ? <><Pencil size={18} /> Actualizar Invitado</> : <><UserPlus size={18} /> Crear Invitación</>}
                    </button>
                </div>
            </div>

            {/* LISTA DE INVITADOS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h4 className="font-bold text-slate-700">Lista de Invitados ({guests.length})</h4>

                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        {/* Filtros */}
                        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                            <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterStatus === 'all' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setFilterStatus('sent')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterStatus === 'sent' ? 'bg-green-100 text-green-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                Enviados
                            </button>
                            <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${filterStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                No Enviados
                            </button>
                        </div>

                        {/* Buscador */}
                        <input
                            type="text"
                            placeholder="Buscar invitado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-56 text-slate-900 bg-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Cargando invitados...</div>
                ) : filteredGuests.length === 0 ? (
                    <div className="p-12 text-center">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400">
                            {searchTerm || filterStatus !== 'all' ? 'No se encontraron coincidencias.' : 'No tienes invitados registrados.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredGuests.map((guest) => (
                            <div key={guest.id} className={`p-4 transition-colors ${editingGuestId === guest.id ? 'bg-indigo-50/50 border-l-4 border-indigo-500' : 'hover:bg-slate-50'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        {/* Checkbox Enviado */}
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={!!guest.invitation_sent}
                                                onChange={() => handleToggleInvitationSent(guest.id, !!guest.invitation_sent)}
                                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 cursor-pointer"
                                                title="Marcar como enviado"
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold text-slate-800 text-lg">
                                                    {guest.first_name} {guest.last_name}
                                                </h5>
                                                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold border border-indigo-200">
                                                    {guest.passes} Pase{guest.passes !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            {guest.companions && guest.companions.length > 0 && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    + {guest.companions.join(', ')}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400 font-mono break-all md:hidden">
                                                <ExternalLink size={10} /> {generateGuestUrl(guest)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Botón Editar */}
                                        <button
                                            onClick={() => handleEditGuest(guest)}
                                            className="p-2 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                                            title="Editar invitado"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                                        <button
                                            onClick={() => handleCopyLink(guest)}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${copiedId === guest.id
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}
                                        >
                                            <Copy size={16} />
                                            {copiedId === guest.id ? 'Copiado' : 'Copiar'}
                                        </button>
                                        <button
                                            onClick={() => handleWhatsAppShare(guest)}
                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-colors"
                                            title="Enviar WhatsApp"
                                        >
                                            <Send size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRemoveGuest(guest.id)}
                                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
