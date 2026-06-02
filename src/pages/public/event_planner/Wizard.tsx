import React, { useState } from 'react';
import { ChevronRight, ArrowRight, Upload, Users, Calendar, ArrowLeft, CheckCircle2, Sparkles, Download, SkipForward } from 'lucide-react';
import { EventData, PlannerGuest } from './types';
import Papa from 'papaparse';

interface WizardProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
    onComplete: () => void;
}

export default function Wizard({ eventData, onChange, onComplete }: WizardProps) {
    const [step, setStep] = useState(1);
    
    // Step 1: Basic Info
    const handleBasicInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (eventData.name.trim() !== '') {
            setStep(2);
        }
    };

    // Step 2: Guests
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsedGuests: PlannerGuest[] = results.data.map((row: any) => {
                    const first = row.first_name || row.Nombre || row.nombre || '';
                    const last = row.last_name || row.Apellido || row.apellido || '';
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        first_name: first,
                        last_name: last,
                        display_name: `${first} ${last}`.trim() || 'Invitado',
                        status: 'pending' as const,
                        group: row.group || row.Grupo || row.grupo || ''
                    };
                }).filter(g => g.first_name || g.last_name);

                onChange({ ...eventData, guests: [...eventData.guests, ...parsedGuests] });
            }
        });
    };

    const downloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Nombre,Apellido,Grupo\nJuan,Pérez,Familia Novio\nAna,Gómez,Amigos";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_invitados.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-3xl mx-auto px-6 py-12 w-full">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 -z-10 rounded-full"></div>
                <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500" 
                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                ></div>

                {[1, 2, 3].map((s) => (
                    <div 
                        key={s} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
                            step >= s ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-900 text-slate-500 border-2 border-slate-800'
                        }`}
                    >
                        {step > s ? <CheckCircle2 size={20} /> : s}
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl backdrop-blur-sm">
                
                {/* STEP 1 */}
                {step === 1 && (
                    <form onSubmit={handleBasicInfoSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-blue-400 mb-6">
                            <Calendar size={28} />
                            <h2 className="text-3xl font-bold text-white">Comencemos</h2>
                        </div>
                        <p className="text-slate-400 mb-8 text-lg">¿Qué evento estás organizando?</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Evento</label>
                                <input 
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ej: Boda de Ana y Juan"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    value={eventData.name}
                                    onChange={e => onChange({ ...eventData, name: e.target.value })}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Fecha (Opcional)</label>
                                <input 
                                    type="date"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                    value={eventData.date}
                                    onChange={e => onChange({ ...eventData, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button 
                                type="submit"
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                            >
                                Siguiente <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-pink-400 mb-6">
                            <Users size={28} />
                            <h2 className="text-3xl font-bold text-white">Tus Invitados</h2>
                        </div>
                        <p className="text-slate-400 mb-8 text-lg">La parte más difícil la hacemos fácil. Sube tu lista de invitados.</p>
                        
                        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center hover:bg-slate-800/50 transition-colors group relative cursor-pointer">
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-blue-400 group-hover:scale-110 transition-all">
                                <Upload size={32} />
                            </div>
                            <h3 className="text-xl font-medium text-slate-200 mb-2">Sube tu Excel o CSV</h3>
                            <p className="text-slate-500">Haz clic o arrastra tu archivo aquí.</p>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button 
                                onClick={downloadTemplate}
                                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20"
                            >
                                <Download size={16} /> Descargar plantilla CSV
                            </button>
                            <button 
                                onClick={() => setStep(3)}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700"
                            >
                                <SkipForward size={16} /> ¡No la tengo! Lo haré más adelante
                            </button>
                        </div>

                        {eventData.guests.length > 0 && (
                            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
                                <CheckCircle2 size={24} />
                                <div>
                                    <p className="font-medium">¡Lista importada!</p>
                                    <p className="text-sm opacity-80">{eventData.guests.length} invitados cargados exitosamente.</p>
                                </div>
                            </div>
                        )}

                        <div className="mt-10 flex justify-between">
                            <button 
                                onClick={() => setStep(1)}
                                className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                            >
                                <ArrowLeft size={20} /> Atrás
                            </button>
                            <button 
                                onClick={() => setStep(3)}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                            >
                                Siguiente <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-emerald-400 mb-6">
                            <Sparkles size={28} />
                            <h2 className="text-3xl font-bold text-white">¡Todo Listo!</h2>
                        </div>
                        <p className="text-slate-400 mb-8 text-lg">Ya podemos pasar al organizador visual para que acomodes a todos.</p>
                        
                        <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 mb-8">
                            <h3 className="text-lg font-medium mb-4 text-slate-200">Resumen:</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-center justify-between">
                                    <span>Evento:</span>
                                    <span className="text-white font-medium">{eventData.name}</span>
                                </li>
                                <li className="flex items-center justify-between">
                                    <span>Invitados cargados:</span>
                                    <span className="text-white font-medium">{eventData.guests.length}</span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-10 flex justify-between">
                            <button 
                                onClick={() => setStep(2)}
                                className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium flex items-center gap-2 transition-all"
                            >
                                <ArrowLeft size={20} /> Atrás
                            </button>
                            <button 
                                onClick={onComplete}
                                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium flex items-center gap-2 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] transition-all"
                            >
                                Ir al organizador <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
