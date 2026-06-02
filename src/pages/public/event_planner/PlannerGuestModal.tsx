import React, { useState, useEffect } from 'react';
import { MapPin, Tag, X, User } from 'lucide-react';
import { PlannerGuest } from './types';

interface PlannerGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    guestToEdit?: PlannerGuest | null;
    onGuestAdded: (guest: PlannerGuest) => void;
    onGuestUpdated?: (guest: PlannerGuest) => void;
}

export default function PlannerGuestModal({ isOpen, onClose, guestToEdit, onGuestAdded, onGuestUpdated }: PlannerGuestModalProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [tableInfo, setTableInfo] = useState('');
    const [group, setGroup] = useState('');
    const [isAfterParty, setIsAfterParty] = useState(false);
    const [hasPuff, setHasPuff] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (guestToEdit) {
                setFirstName(guestToEdit.first_name);
                setLastName(guestToEdit.last_name);
                setTableInfo(guestToEdit.table_info || '');
                setGroup(guestToEdit.group || '');
                setIsAfterParty(guestToEdit.is_after_party || false);
                setHasPuff(guestToEdit.has_puff || false); // (if we extend PlannerGuest to include these)
            } else {
                setFirstName('');
                setLastName('');
                setTableInfo('');
                setGroup('');
                setIsAfterParty(false);
                setHasPuff(false);
            }
            setError(null);
        }
    }, [isOpen, guestToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!firstName.trim() && !lastName.trim()) {
            setError('El nombre o el apellido son obligatorios.');
            return;
        }

        if (guestToEdit) {
            const updatedGuest = {
                ...guestToEdit,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                display_name: `${firstName} ${lastName}`.trim(),
                table_info: tableInfo.trim(),
                group: group.trim()
            };
            if (onGuestUpdated) {
                onGuestUpdated(updatedGuest);
            }
        } else {
            const newGuest: PlannerGuest = {
                id: Math.random().toString(36).substr(2, 9),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                display_name: `${firstName} ${lastName}`.trim(),
                status: 'pending',
                group: group.trim(),
                table_info: tableInfo.trim()
            };
            onGuestAdded(newGuest);
        }

        onClose(); 
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="glass-card w-full max-w-md bg-[#030712] relative animate-in zoom-in-95 duration-200 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">

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

                        <div className="flex gap-4">
                            <div className="space-y-1.5 flex-1">
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
                                        placeholder="Ej. Mesa 1, VIP, Barra..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Grupo (Opcional)</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <Tag size={16} />
                                    </div>
                                    <input
                                        type="text"
                                        value={group}
                                        onChange={(e) => setGroup(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                        placeholder="Ej. Familia, Trabajo..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex-1 flex items-center gap-3 cursor-pointer" onClick={() => setIsAfterParty(!isAfterParty)}>
                            <input
                                type="checkbox"
                                checked={isAfterParty}
                                onChange={(e) => setIsAfterParty(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
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
                                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
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
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]"
                        >
                            {guestToEdit ? 'Guardar Cambios' : 'Guardar Invitado'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
