import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Event } from '../../../../types';

interface SettingsTabProps {
    event: Event;
    onUpdateEvent: (updates: Partial<Event>) => void;
}

export default function SettingsTab({ event, onUpdateEvent }: SettingsTabProps) {
    const [formData, setFormData] = useState<Partial<Event>>({ ...event });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData({ ...event });
    }, [event]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('events')
                .update(formData)
                .eq('id', event.id);

            if (error) throw error;
            onUpdateEvent(formData);
            alert('✅ Evento actualizado correctamente');
        } catch (error) {
            console.error('Error updating event:', error);
            alert('❌ Error al actualizar el evento');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-2xl">
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Información General</h3>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre del Evento</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Descripción (Opcional)</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={handleChange}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600 resize-none"
                                placeholder="Detalles adicionales del evento..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date || ''}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600 appearance-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</label>
                                <select
                                    name="status"
                                    value={formData.status || 'pending'}
                                    onChange={handleChange}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                                >
                                    <option value="pending">Pendiente</option>
                                    <option value="active">Activo</option>
                                    <option value="disabled">Deshabilitado</option>
                                    <option value="closed">Cerrado</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Configuración de Mesas y Áreas</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cantidad de Mesas</label>
                            <input
                                type="number"
                                name="table_count"
                                value={formData.table_count || 10}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Invitados por Mesa</label>
                            <input
                                type="number"
                                name="guests_per_table_default"
                                value={formData.guests_per_table_default || 10}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                            <div className="text-sm font-medium text-white">Habilitar Living / Sin Asignar</div>
                            <div className="text-xs text-slate-500">Área sin numeración estricta</div>
                        </div>
                        <input
                            type="checkbox"
                            name="has_living_room"
                            checked={!!formData.has_living_room}
                            onChange={handleCheckboxChange}
                            className="toggle toggle-warning toggle-sm"
                        />
                    </div>

                    <div className="flex flex-col gap-2 p-3 rounded-lg bg-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-medium text-white">Habilitar Trasnoche</div>
                                <div className="text-xs text-slate-500">Invitados post-cena</div>
                            </div>
                            <input
                                type="checkbox"
                                name="has_after_party"
                                checked={!!formData.has_after_party}
                                onChange={handleCheckboxChange}
                                className="toggle toggle-warning toggle-sm"
                            />
                        </div>

                        {formData.has_after_party && (
                            <div className="mt-2 text-sm border-t border-white/5 pt-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <Clock size={14} className="text-[#FBBF24]" />
                                <label className="text-xs text-slate-400 uppercase font-bold">Hora de Inicio:</label>
                                <input
                                    type="time"
                                    name="after_party_time"
                                    value={formData.after_party_time || "00:00"}
                                    onChange={handleChange}
                                    className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white text-sm focus:border-[#FBBF24] outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                    <button type="button" className="btn btn-ghost text-slate-400 hover:text-white" onClick={() => setFormData({ ...event })}>Cancelar</button>
                    <button type="submit" disabled={isSaving} className="btn btn-primary py-2.5 px-6 shadow-lg shadow-yellow-500/20 disabled:opacity-50">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
}
