import { useState, useEffect } from 'react';
import { X, User, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Event, Guest } from '../types';

interface CreateGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    guestToEdit?: Guest | null;
    onGuestAdded: (guest: Guest) => void;
    onGuestUpdated?: (guest: Guest) => void;
}

export default function CreateGuestModal({ isOpen, onClose, event, guestToEdit, onGuestAdded, onGuestUpdated }: CreateGuestModalProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [tableInfo, setTableInfo] = useState('');
    const [isAfterParty, setIsAfterParty] = useState(false);
    const [hasPuff, setHasPuff] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (guestToEdit) {
                setFirstName(guestToEdit.first_name);
                setLastName(guestToEdit.last_name);
                setTableInfo(guestToEdit.table_info || '');
                setIsAfterParty(guestToEdit.is_after_party || false);
                setHasPuff(guestToEdit.has_puff || false);
            } else {
                setFirstName('');
                setLastName('');
                setTableInfo('');
                setIsAfterParty(false);
                setHasPuff(false);
            }
            setError(null);
        }
    }, [isOpen, guestToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Validation
        if (!firstName.trim() || !lastName.trim()) {
            setError('El nombre y el apellido son obligatorios.');
            setLoading(false);
            return;
        }

        try {
            const guestData = {
                first_name: firstName,
                last_name: lastName,
                display_name: `${firstName} ${lastName}`,
                table_info: tableInfo || null,
                is_after_party: isAfterParty,
                has_puff: hasPuff,
            };

            if (guestToEdit) {
                // UPDATE Mode
                const { data, error } = await supabase
                    .from('guests')
                    .update(guestData)
                    .eq('id', guestToEdit.id)
                    .select()
                    .single();

                if (error) throw error;
                if (data && onGuestUpdated) {
                    onGuestUpdated(data as Guest);
                    onClose();
                }
            } else {
                // CREATE Mode
                const { data, error } = await supabase
                    .from('guests')
                    .insert({
                        event_id: event.id,
                        status: 'pending',
                        ...guestData
                    })
                    .select()
                    .single();

                if (error) throw error;
                if (data) {
                    onGuestAdded(data as Guest);
                    onClose(); // Don't clear fields here to allow rapid entry if needed, but for now we close
                }
            }

        } catch (err: any) {
            console.error('Error saving guest:', err);
            setError(err.message || 'Error al guardar el invitado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-md bg-[#030712] relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <h2 className="text-lg font-bold text-white">{guestToEdit ? 'Editar Invitado' : 'Nuevo Invitado'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="space-y-1.5 flex-1">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <User size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                        placeholder="Ej. Juan"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Apellido</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                    placeholder="Ej. Pérez"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mesa / Ubicación (Opcional)</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <MapPin size={16} />
                                </div>
                                <input
                                    type="text"
                                    value={tableInfo}
                                    onChange={(e) => setTableInfo(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                    placeholder="Ej. Mesa 5, VIP, Barra..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => setIsAfterParty(!isAfterParty)}>
                            <input
                                type="checkbox"
                                checked={isAfterParty}
                                onChange={(e) => setIsAfterParty(e.target.checked)}
                                className="checkbox checkbox-warning checkbox-sm"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Trasnoche</span>
                                <span className="text-[10px] text-slate-500">Acceso post-cena</span>
                            </div>
                        </div>
                        <div className="w-[1px] bg-white/10 h-8 self-center"></div>
                        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => setHasPuff(!hasPuff)}>
                            <input
                                type="checkbox"
                                checked={hasPuff}
                                onChange={(e) => setHasPuff(e.target.checked)}
                                className="checkbox checkbox-warning checkbox-sm"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Asignar Puff</span>
                                <span className="text-[10px] text-slate-500">Tiene lugar en Living</span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn btn-outline py-2.5 text-sm"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 btn btn-primary py-2.5 text-sm shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : (guestToEdit ? 'Guardar Cambios' : 'Guardar Invitado')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
