import { useState } from 'react';
import { X, Send, Sparkles, MapPin, CheckCircle2 } from 'lucide-react';
import { EventData, PlannerService } from './types';

interface VendorProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: PlannerService;
    eventData: EventData;
}

export default function VendorProposalModal({ isOpen, onClose, service, eventData }: VendorProposalModalProps) {
    const [step, setStep] = useState<'options' | 'form' | 'success'>('options');
    const [zone, setZone] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate network request
        setTimeout(() => {
            setIsSubmitting(false);
            setStep('success');
            // Reset after 3 seconds and close
            setTimeout(() => {
                setStep('options');
                onClose();
            }, 3000);
        }, 1200);
    };

    const guestsCount = eventData.guests.length || 50;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {service.name}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'options' && (
                        <div className="space-y-5 animate-in slide-in-from-left-4 fade-in duration-300">
                            <p className="text-sm text-slate-400">
                                Basándonos en tu evento de aprox. <span className="text-white font-bold">{guestsCount} invitados</span>, estas opciones suelen funcionar bien.
                            </p>

                            {/* Premium Vendor */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Sparkles size={16} className="text-indigo-400" />
                                            <h4 className="font-bold text-white">Proveedor Recomendado</h4>
                                        </div>
                                        <ul className="text-xs text-indigo-200/70 space-y-1">
                                            <li className="flex items-center gap-1">✔ Ideal para eventos medianos</li>
                                            <li className="flex items-center gap-1">✔ Incluye armado y personal</li>
                                            <li className="flex items-center gap-1">✔ Flexible según cantidad</li>
                                        </ul>
                                    </div>
                                    <button 
                                        onClick={() => setStep('form')}
                                        className="shrink-0 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
                                    >
                                        Solicitar propuesta
                                    </button>
                                </div>
                            </div>

                            {/* Economy Option */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Opción Económica</h4>
                                        <p className="text-xs text-slate-400">Servicio estándar, ideal si buscas ajustar el presupuesto manteniendo buena calidad.</p>
                                    </div>
                                    <button 
                                        onClick={() => setStep('form')}
                                        className="shrink-0 w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium py-2.5 px-5 rounded-xl transition-colors"
                                    >
                                        Consultar disponibilidad
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => setStep('form')}
                                className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-300 py-2 transition-colors underline decoration-slate-700 underline-offset-4"
                            >
                                Quiero comparar otras opciones
                            </button>
                        </div>
                    )}

                    {step === 'form' && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                            <p className="text-sm text-slate-400 mb-6">
                                Completá estos datos para que los proveedores te envíen propuestas exactas. El resto (invitados, tipo de evento) ya lo completamos nosotros 😉
                            </p>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">📍 Zona / Ciudad del Evento</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPin size={18} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={zone}
                                        onChange={e => setZone(e.target.value)}
                                        placeholder="Ej: CABA, Zona Norte, etc."
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">📝 Comentario (Opcional)</label>
                                <textarea 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Algún detalle especial que deban saber..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setStep('options')}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Volver
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!zone || isSubmitting}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Enviar solicitud
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={40} className="text-emerald-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">¡Solicitud enviada!</h3>
                            <p className="text-slate-400 max-w-[280px]">
                                Los proveedores recomendados recibirán tus datos y te contactarán pronto con una propuesta.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
