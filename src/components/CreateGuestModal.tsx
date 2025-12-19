import { useState } from 'react';
import { X, User, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Event, Guest } from '../types';

interface CreateGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    onGuestAdded: (newGuest: Guest) => void;
}

export default function CreateGuestModal({ isOpen, onClose, event, onGuestAdded }: CreateGuestModalProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [tableInfo, setTableInfo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            // Mock mode for local dev/testing with ID '123'
            if (event.id === '123') {
                await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
                const mockGuest: any = {
                    id: `mock-guest-${Date.now()}`,
                    event_id: '123',
                    first_name: firstName,
                    last_name: lastName,
                    display_name: `${firstName} ${lastName}`,
                    table_info: tableInfo || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                onGuestAdded(mockGuest);
                handleClose();
                return;
            }

            // Real Supabase Insert
            const newGuestData = {
                event_id: event.id,
                first_name: firstName,
                last_name: lastName,
                display_name: `${firstName} ${lastName}`,
                table_info: tableInfo || null,
                status: 'pending' // Default status
            };

            const { data, error } = await supabase
                .from('guests')
                .insert(newGuestData)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                onGuestAdded(data as Guest);
                handleClose();
            }
        } catch (err: any) {
            console.error('Error adding guest:', err);
            setError(err.message || 'Error al agregar el invitado.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFirstName('');
        setLastName('');
        setTableInfo('');
        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-md bg-[#030712] relative animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <h2 className="text-lg font-bold text-white">Nuevo Invitado</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
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

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
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
                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Invitado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
