import { useState } from 'react';
import { X, Users, MapPin, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated: () => void;
}

export default function CreateEventModal({ isOpen, onClose, onEventCreated }: CreateEventModalProps) {
    const { user, role } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [guestCount, setGuestCount] = useState<number | ''>('');

    const [tableType, setTableType] = useState<'none' | 'partial' | 'full'>('none');
    const [tableCount, setTableCount] = useState<number | ''>('');
    const [guestsPerTable, setGuestsPerTable] = useState<number>(10);

    const [hasLiving, setHasLiving] = useState(false);
    const [hasAfter, setHasAfter] = useState(false);

    // New state for guest import dropdown
    const [isGuestImportOpen, setIsGuestImportOpen] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // 🔒 BLOQUEO: Solo superadmin puede crear eventos
        if (role !== 'superadmin') {
            setError('⛔ Acceso denegado. Solo superadmins pueden crear eventos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Ensure Profile Exists (Fix for FK Error)
            const { error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code === 'PGRST116') {
                // Profile doesn't exist (or select failed), try UPSERT to be safe (create or update)
                const { error: insertError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    email: user.email,
                    role: 'provider' // Default role
                });

                if (insertError) {
                    console.error('Error auto-creating profile:', insertError);
                    throw new Error(`Error técnico al crear perfil: ${insertError.message} (Código: ${insertError.code})`);
                }
            }

            // 2. Create Event
            const { error: eventError } = await supabase.from('events').insert({
                owner_id: user.id,
                name,
                date,
                guest_count_total: Number(guestCount),
                table_assignment: tableType,
                table_count: Number(tableCount) || 0,
                guests_per_table_default: guestsPerTable,
                has_living_room: hasLiving,
                has_after_party: hasAfter,
                status: 'pending' // Default Red
            });

            if (eventError) throw eventError;

            onEventCreated();
            onClose();
        } catch (error: any) {
            console.error('Error creating event:', error);
            setError(error.message || error.details || 'Error desconocido al crear el evento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 md:pt-20 bg-black/80 backdrop-blur-sm">
            <div className="glass-card w-full max-w-2xl bg-[#030712] relative animate-in zoom-in-95 duration-200 flex flex-col shadow-2xl shadow-black/50 border border-white/10 max-h-[85vh]">

                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <div>
                        <h2 className="text-lg font-bold text-white">Nuevo Evento</h2>
                        <p className="text-[10px] text-slate-400">Completa los datos principales</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {error && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                    <form id="create-event-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Dropdown for bulk data upload */}
                        <div className="border border-white/5 rounded-xl overflow-hidden bg-white/[0.02]">
                            <button
                                type="button"
                                onClick={() => setIsGuestImportOpen(!isGuestImportOpen)}
                                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-[#FBBF24]/10 text-[#FBBF24]">
                                        <Users size={16} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-white">Carga Masiva (Opcional)</p>
                                        <p className="text-[10px] text-slate-400">Importar lista de invitados ahora</p>
                                    </div>
                                </div>
                                {isGuestImportOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                            </button>

                            {isGuestImportOpen && (
                                <div className="p-4 border-t border-white/5 bg-black/20">
                                    <p className="text-xs text-slate-400 mb-3 text-center">
                                        Podrás importar tu lista de invitados una vez creado el evento desde el panel de administración.
                                    </p>
                                    <div className="p-3 border border-dashed border-white/10 rounded-lg bg-white/5 text-center">
                                        <p className="text-xs text-slate-500 italic">La importación estará disponible en el paso siguiente.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* General Info */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-widest leading-none">General</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Nombre</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Ej. Casamiento de Ana y Juan"
                                        required
                                        className="bg-white/5 focus:bg-white/10 border-white/5 focus:border-[#FBBF24]/50 text-sm"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fecha</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                        className="bg-white/5 focus:bg-white/10 border-white/5 focus:border-[#FBBF24]/50 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Invitados Totales</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                    <input
                                        type="number"
                                        value={guestCount}
                                        onChange={e => setGuestCount(Number(e.target.value))}
                                        placeholder="0"
                                        required
                                        min="1"
                                        className="bg-white/5 focus:bg-white/10 border-white/5 focus:border-[#FBBF24]/50 pl-9 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Tables Config */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-widest leading-none">Distribución</h3>

                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'none', label: 'Sin Mesas', icon: Users },
                                    { id: 'partial', label: 'Parcial', icon: MapPin },
                                    { id: 'full', label: 'Completa', icon: MapPin }
                                ].map((type) => (
                                    <button
                                        key={type.id}
                                        type="button"
                                        onClick={() => setTableType(type.id as any)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${tableType === type.id
                                            ? 'bg-[#FBBF24] border-[#FBBF24] text-black shadow-lg shadow-yellow-500/20'
                                            : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <type.icon size={18} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            {tableType !== 'none' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Cantidad Mesas</label>
                                        <input
                                            type="number"
                                            value={tableCount}
                                            onChange={e => setTableCount(Number(e.target.value))}
                                            placeholder="Ej. 15"
                                            required
                                            min="1"
                                            className="bg-white/5 focus:bg-white/10 border-white/5 focus:border-[#FBBF24]/50 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pers. por Mesa</label>
                                        <input
                                            type="number"
                                            value={guestsPerTable}
                                            onChange={e => setGuestsPerTable(Number(e.target.value))}
                                            placeholder="10"
                                            required
                                            min="1"
                                            className="bg-white/5 focus:bg-white/10 border-white/5 focus:border-[#FBBF24]/50 text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-white/5" />

                        {/* Extras */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold text-[#FBBF24] uppercase tracking-widest leading-none">Extras</h3>

                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${hasLiving ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}>
                                    <span className="text-sm font-medium">Habilitar Living</span>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${hasLiving ? 'bg-[#FBBF24] border-[#FBBF24] text-black' : 'border-slate-600'}`}>
                                        {hasLiving && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={hasLiving} onChange={e => setHasLiving(e.target.checked)} />
                                </label>

                                <label className={`flex-1 flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${hasAfter ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}>
                                    <span className="text-sm font-medium">Habilitar Trasnoche</span>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${hasAfter ? 'bg-[#FBBF24] border-[#FBBF24] text-black' : 'border-slate-600'}`}>
                                        {hasAfter && <Check size={10} strokeWidth={4} />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={hasAfter} onChange={e => setHasAfter(e.target.checked)} />
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions - Sticky Bottom */}
                <div className="p-5 border-t border-white/5 bg-black/40 flex gap-3 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-outline flex-1 py-2.5 text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="create-event-form"
                        disabled={loading}
                        className="btn btn-primary flex-1 py-2.5 text-sm shadow-lg shadow-yellow-500/20"
                    >
                        {loading ? 'Creando...' : 'Crear Evento'}
                    </button>
                </div>
            </div>
        </div>
    );
}
