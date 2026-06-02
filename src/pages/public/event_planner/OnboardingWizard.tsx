import React, { useState } from 'react';
import { Sparkles, ArrowRight, Upload, Edit3, Heart, MapPin, Building, Music, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import { EventData, PlannerGuest } from './types';
import { trackEvent } from '../../../lib/analytics';

interface OnboardingWizardProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
    onComplete: () => void;
    onOpenManualGuest: () => void;
}

export default function OnboardingWizard({ eventData, onChange, onComplete, onOpenManualGuest }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [uploading, setUploading] = useState(false);
    const [guestCount, setGuestCount] = useState(100);

    // Step 2: Event Type
    const eventTypes = [
        { id: 'boda', label: 'Casamiento', icon: Heart },
        { id: '15', label: '15 Años', icon: Sparkles },
        { id: 'cumple', label: 'Cumpleaños', icon: Music },
        { id: 'empresarial', label: 'Empresarial', icon: Building },
        { id: 'otro', label: 'Otro', icon: MapPin },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                let newTables = [...eventData.tables];
                const parsedGuests: PlannerGuest[] = results.data.map((row: any) => {
                    const first = row.first_name || row.Nombre || row.nombre || '';
                    const last = row.last_name || row.Apellido || row.apellido || '';
                    const confirmadoStr = (row.Confirmado || row.confirmado || '').toLowerCase();
                    const statusVal = (confirmadoStr === 'sí' || confirmadoStr === 'si' || confirmadoStr === 'yes') ? 'confirmed' : 'pending';
                    const mesaVal = row.Mesa || row.mesa || '';
                    
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        first_name: first,
                        last_name: last,
                        display_name: `${first} ${last}`.trim() || 'Invitado',
                        status: statusVal as 'pending' | 'confirmed',
                        group: row.group || row.Grupo || row.grupo || '',
                        table_info: mesaVal,
                        note: row.Nota || row.nota || ''
                    };
                }).filter(g => g.first_name || g.last_name);

                // Auto-create tables for CSV guests
                const finalGuests = parsedGuests.map(g => {
                    if (g.table_info && g.table_info.trim() !== '') {
                        let label = g.table_info.trim();
                        if (/^\d+$/.test(label)) label = `Mesa ${label}`;
                        
                        let table = newTables.find(t => t.label.toLowerCase() === label.toLowerCase());
                        if (!table) {
                            table = {
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'round', x: 0, y: 0, rotation: 0,
                                label: label,
                                capacity: 10 // default 10 for wizard
                            };
                            newTables.push(table);
                        }
                        return { ...g, table_id: table.id };
                    }
                    return g;
                });

                trackEvent('excel_uploaded', { guest_count: finalGuests.length });
                onChange({ ...eventData, guests: [...eventData.guests, ...finalGuests], tables: newTables });
                setUploading(false);
                onComplete(); // Move to dashboard once uploaded
            }
        });
    };

    const downloadTemplate = () => {
        trackEvent('excel_downloaded');
        // Usar punto y coma para Excel en español y BOM para UTF-8
        const csvContent = "\uFEFFNombre;Apellido;Mesa;Grupo;Confirmado;Nota\nJuan;Pérez;1;Familia Novio;Sí;Vegetariano\nAna;Gómez;VIP;Amigos;Pendiente;\nLuis;García;;Trabajo;Sí;";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_invitados.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-500 my-8 relative">
                
                {/* Progress bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 rounded-t-3xl overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                        style={{ width: `${(step / 5) * 100}%` }}
                    ></div>
                </div>

                {/* STEP 1: Bienvenida */}
                {step === 1 && (
                    <div className="text-center space-y-8 animate-in fade-in duration-300">
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-400 border border-blue-500/20">
                            <Sparkles size={40} />
                        </div>
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-4">Vamos a organizar tu evento juntos 🎉</h2>
                            <p className="text-xl text-slate-400">En pocos minutos vas a tener un panorama real de tu fiesta.</p>
                        </div>
                        <div className="p-4 bg-slate-800/50 rounded-xl max-w-md mx-auto">
                            <p className="text-sm text-slate-300">💡 No hace falta tener todo resuelto. Vamos paso a paso 😉</p>
                        </div>
                        <button 
                            onClick={() => setStep(2)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium inline-flex items-center gap-3 transition-all shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_-5px_rgba(37,99,235,0.6)]"
                        >
                            Empezar <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* STEP 2: Tipo de Evento */}
                {step === 2 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-3">¿Qué estás organizando?</h2>
                            <p className="text-slate-400">Elegí el tipo de evento para adaptar la experiencia.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {eventTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => {
                                        onChange({ ...eventData, name: type.label });
                                        setStep(3);
                                    }}
                                    className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                                        eventData.name === type.label 
                                        ? 'bg-blue-600/20 border-blue-500 text-white' 
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <type.icon size={32} className={eventData.name === type.label ? 'text-blue-400' : ''} />
                                    <span className="font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: Nombre y Fecha (NEW) */}
                {step === 3 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 duration-300 text-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-3">Dale vida a tu evento</h2>
                            <p className="text-slate-400">Un nombre y una fecha lo hacen real.</p>
                        </div>
                        
                        <div className="max-w-md mx-auto space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Nombre del Evento</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: Casamiento de Ana y Luis"
                                    value={eventData.name || ''}
                                    onChange={(e) => onChange({ ...eventData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    autoFocus
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Fecha (Opcional)</label>
                                <input 
                                    type="date" 
                                    value={eventData.date || ''}
                                    onChange={(e) => onChange({ ...eventData, date: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <button 
                            disabled={!eventData.name?.trim()}
                            onClick={() => setStep(4)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium inline-flex items-center gap-3 transition-all"
                        >
                            Continuar <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* STEP 4: Cantidad */}
                {step === 4 && (
                    <div className="space-y-10 animate-in slide-in-from-right-8 duration-300 text-center">
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-3">¿Cuántas personas creés que asistirán?</h2>
                            <p className="text-slate-400">Un número aproximado está perfecto por ahora.</p>
                        </div>

                        <div className="max-w-md mx-auto bg-slate-950 p-8 rounded-3xl border border-slate-800">
                            <div className="text-6xl font-black text-blue-400 mb-8 font-display">
                                {guestCount}
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="500" 
                                step="10"
                                value={guestCount}
                                onChange={(e) => setGuestCount(Number(e.target.value))}
                                className="w-full accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer mb-6"
                            />
                            <p className="text-sm text-slate-500">Deslizá para ajustar</p>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-xl max-w-sm mx-auto">
                            <p className="text-sm text-slate-300 text-center">💡 La mayoría termina ajustando este número después 😉</p>
                        </div>

                        <button 
                            onClick={() => setStep(5)}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium inline-flex items-center gap-3 transition-all"
                        >
                            Continuar <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* STEP 5: Carga */}
                {step === 5 && (
                    <div className="space-y-8 animate-in slide-in-from-right-8 duration-300">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-white mb-3">¿Ya tenés tu lista de invitados?</h2>
                            <p className="text-slate-400">Podés subir un archivo o empezar manualmente.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Opción Excel */}
                            <div className="relative group h-full">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                                <div className="relative h-full bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-slate-900 transition-colors">
                                    <input 
                                        type="file" 
                                        accept=".csv"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={uploading}
                                    />
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                        {uploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Importar Excel</h3>
                                    <p className="text-slate-400 mb-8 flex-1 text-sm">Si ya la tenés armada, cargala en segundos.</p>
                                    
                                    {!uploading && (
                                        <div className="relative z-20">
                                            {/* Tooltip con flecha */}
                                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-lg shadow-blue-500/20 animate-bounce">
                                                💡 Podés descargarla y armar tu lista tranquilo en tu compu ☕
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
                                            </div>
                                            <button className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-medium px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); downloadTemplate(); }}>
                                                <Download size={14} /> Descargar plantilla
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Opción Manual */}
                            <div className="relative h-full bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center hover:bg-slate-900 transition-colors cursor-pointer group"
                                onClick={() => {
                                    trackEvent('manual_guest_started');
                                    onComplete();
                                    onOpenManualGuest();
                                }}
                            >
                                <div className="w-16 h-16 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 border border-pink-500/20 group-hover:scale-110 transition-transform">
                                    <Edit3 size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Cargar manualmente</h3>
                                <p className="text-slate-400 mb-8 flex-1 text-sm">Empecemos juntos agregando invitados uno a uno.</p>
                                
                                <button className="flex items-center gap-2 text-sm text-slate-300 font-medium px-4 py-2 border border-slate-700 rounded-lg group-hover:bg-slate-800 transition-colors">
                                    Agregar invitados <ArrowRight size={16} />
                                </button>
                            </div>

                        </div>
                        
                        <div className="text-center mt-6">
                            <button 
                                onClick={onComplete}
                                className="text-sm text-slate-500 hover:text-white transition-colors"
                            >
                                Prefiero saltear esto por ahora y ver el organizador
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
