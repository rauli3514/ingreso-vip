import React, { useState, useEffect } from 'react';
import { Crown, Link, Shield, ArrowRight, CheckCircle2, Users, Loader2 } from 'lucide-react';
import { EventData } from './types';
import DigitalInvitationWizard from './invitation/DigitalInvitationWizard';
import AdvancedInvitationEditor from './invitation/AdvancedInvitationEditor';
import VipAccessHub from './vip/VipAccessHub';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import { supabase } from '../../../lib/supabase';

interface ProServicesTabProps {
    eventData: EventData;
    onUpdateEvent: (data: Partial<EventData>) => void;
    onSaveRequest?: () => void;
}

export default function ProServicesTab({ eventData, onUpdateEvent, onSaveRequest }: ProServicesTabProps) {
    const [view, setView] = useState<'hub' | 'invitation_wizard' | 'advanced_editor' | 'vip_hub' | 'rsvps'>('hub');
    const [rsvps, setRsvps] = useState<any[]>([]);
    const [loadingRsvps, setLoadingRsvps] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    const isInvitationUnlocked = eventData.active_modules?.includes('invitation_pro') || false;
    const isVipAccessUnlocked = eventData.active_modules?.includes('vip_access') || false;

    // Helper to mock unlocking a feature for local dev
    const handleUnlock = (module: string) => {
        const currentModules = eventData.active_modules || [];
        if (!currentModules.includes(module)) {
            onUpdateEvent({ active_modules: [...currentModules, module] });
        }
    };

    useEffect(() => {
        if (view === 'rsvps') {
            fetchRsvps();
        }
    }, [view]);

    const fetchRsvps = async () => {
        if (!eventData.cloudEventId) return;
        setLoadingRsvps(true);
        try {
            const { data, error } = await supabase
                .from('invitation_responses')
                .select('*')
                .eq('event_id', eventData.cloudEventId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setRsvps(data || []);
        } catch (error) {
            console.error('Error fetching RSVPs:', error);
        } finally {
            setLoadingRsvps(false);
        }
    };

    const handleWizardComplete = (settings: any) => {
        onUpdateEvent({ invitation_settings: settings });
        setView('hub'); // Goes back to hub which will show the configured state
    };

    if (view === 'invitation_wizard') {
        return (
            <DigitalInvitationWizard 
                eventData={eventData}
                onComplete={handleWizardComplete}
                onCancel={() => setView('hub')}
            />
        );
    }

    if (view === 'advanced_editor') {
        return (
            <AdvancedInvitationEditor 
                eventData={eventData}
                onClose={() => setView('hub')}
            />
        );
    }

    if (view === 'rsvps') {
        return (
            <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto space-y-6 animate-in fade-in">
                <div className="w-full flex items-center justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Users className="text-emerald-500" /> Confirmaciones Web
                        </h2>
                        <p className="text-slate-400 mt-1">Acá caen los invitados que confirman por la invitación digital.</p>
                    </div>
                    <button 
                        onClick={() => setView('hub')}
                        className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                    >
                        Volver
                    </button>
                </div>

                <div className="w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    {loadingRsvps ? (
                        <div className="p-12 flex justify-center text-slate-500">
                            <Loader2 className="animate-spin" size={32} />
                        </div>
                    ) : rsvps.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Aún no hay confirmaciones web.</p>
                            <p className="text-sm">Comparte tu invitación para empezar a recibirlas.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 text-sm border-b border-slate-800">
                                        <th className="p-4 font-semibold">Nombre del Invitado</th>
                                        <th className="p-4 font-semibold">Respuesta</th>
                                        <th className="p-4 font-semibold">Mensaje / Canción</th>
                                        <th className="p-4 font-semibold">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rsvps.map((rsvp) => (
                                        <tr key={rsvp.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                                            <td className="p-4 font-medium text-white">{rsvp.full_name}</td>
                                            <td className="p-4">
                                                {rsvp.type === 'song' ? (
                                                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold">🎵 Sugerencia</span>
                                                ) : rsvp.attending ? (
                                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold">✅ Asistirá</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold">❌ No asistirá</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-slate-300 max-w-xs truncate">{rsvp.message || '-'}</td>
                                            <td className="p-4 text-sm text-slate-500">
                                                {new Date(rsvp.created_at).toLocaleDateString('es-AR')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'vip_hub') {
        return (
            <VipAccessHub 
                eventData={eventData} 
                onBack={() => setView('hub')} 
                onUpdateEvent={onUpdateEvent}
            />
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto w-full max-w-5xl mx-auto space-y-6">
            
            <div className="text-center space-y-2 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-sm font-bold border border-amber-500/20 mb-2">
                    <Crown size={16} /> Modo Pro
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">Potenciá tu Evento</h2>
                <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto">
                    Convertí tu fiesta en una experiencia premium. Agregá invitaciones digitales interactivas y control de acceso profesional VIP.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                
                {/* INVITACIÓN DIGITAL */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                        <Link size={28} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">Invitación Digital</h3>
                    <p className="text-slate-400 text-sm mb-6 flex-grow">
                        Diseñá una web hermosa para tu evento. Tus invitados podrán ver los detalles, dress code, ubicación y confirmar su asistencia directamente desde su celular.
                    </p>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Diseño intuitivo y moderno
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Formulario de confirmación (RSVP)
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Integración con mapa y música
                        </div>
                    </div>

                    {isInvitationUnlocked ? (
                        eventData.invitation_settings ? (
                            <div className="space-y-3">
                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tu Enlace Público</span>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            readOnly 
                                            value={`https://event-pix.com.ar/invitacion/${eventData.cloudEventId || 'preview'}`}
                                            className="w-full bg-slate-900 text-slate-300 text-xs py-2 px-3 rounded-lg border border-slate-700 outline-none"
                                        />
                                        <button 
                                            onClick={() => navigator.clipboard.writeText(`https://event-pix.com.ar/invitacion/${eventData.cloudEventId || 'preview'}`)}
                                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                                            title="Copiar Enlace"
                                        >
                                            📋
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setView('rsvps')}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        <Users size={18} className="text-emerald-500" />
                                        Respuestas Web
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => window.open(`/invitacion/${eventData.cloudEventId || 'preview'}`, '_blank')}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all text-center"
                                    >
                                        Ver Previsualización
                                    </button>
                                    <button 
                                        onClick={() => setView('advanced_editor')}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all text-center"
                                    >
                                        Editor Avanzado
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setView('invitation_wizard')}
                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                            >
                                Configurar Invitación <ArrowRight size={18} />
                            </button>
                        )
                    ) : (
                        <button 
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            Mejorar Plan
                        </button>
                    )}
                </div>

                {/* INGRESO VIP */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                        <Shield size={28} />
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">Ingreso VIP</h3>
                    <p className="text-slate-400 text-sm mb-6 flex-grow">
                        Controlá la puerta como un profesional. Descargá los códigos QR para cada mesa y escanealos en la entrada para una recepción fluida y sin listas de papel.
                    </p>

                    <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Códigos QR únicos por mesa
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Escaneo ultra rápido
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Mensajes de bienvenida personalizados
                        </div>
                    </div>

                    {isVipAccessUnlocked ? (
                        <button 
                            onClick={() => setView('vip_hub')}
                            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            Gestionar Ingreso <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                        >
                            Mejorar Plan
                        </button>
                    )}
                </div>

            </div>
            
            <PremiumUpgradeModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)} 
                onSuccess={() => setIsUpgradeModalOpen(false)} 
                onSaveRequest={onSaveRequest}
            />
        </div>
    );
}
