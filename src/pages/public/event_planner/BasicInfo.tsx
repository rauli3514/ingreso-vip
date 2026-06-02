import React from 'react';
import { Calendar, ArrowRight, X } from 'lucide-react';
import { EventData } from './types';

interface BasicInfoProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
    onNext: () => void;
    onClose: () => void;
}

export default function BasicInfo({ eventData, onChange, onNext, onClose }: BasicInfoProps) {
    const handleBasicInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (eventData.name.trim() !== '') {
            onNext();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
                >
                    <X size={24} />
                </button>

                <form onSubmit={handleBasicInfoSubmit}>
                    <div className="flex items-center gap-3 text-blue-400 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Calendar size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Datos del Evento</h2>
                    </div>
                    <p className="text-slate-400 mb-8">¿Qué tipo de fiesta estás organizando? Esto nos ayudará a preparar el entorno.</p>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre o Tipo de Fiesta</label>
                            <input 
                                type="text"
                                required
                                autoFocus
                                placeholder="Ej: Mis 15 Camila, Boda de Ana..."
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                value={eventData.name}
                                onChange={e => onChange({ ...eventData, name: e.target.value })}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Fecha (Opcional)</label>
                            <input 
                                type="date"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                value={eventData.date}
                                onChange={e => onChange({ ...eventData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button 
                            type="submit"
                            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]"
                        >
                            Ir al Organizador <ArrowRight size={20} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
