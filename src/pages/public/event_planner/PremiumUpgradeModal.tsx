import { useState } from 'react';
import { X, Check, Loader2, Crown } from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';

interface PremiumUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (plan: string) => void;
}

export default function PremiumUpgradeModal({ isOpen, onClose, onSuccess }: PremiumUpgradeModalProps) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubscribe = (planName: string) => {
        setLoadingPlan(planName);
        trackEvent('premium_checkout_started', { plan: planName });
        
        // Simulación de conexión a MercadoPago y pago exitoso
        setTimeout(() => {
            setLoadingPlan(null);
            setSuccess(true);
            trackEvent('premium_checkout_success', { plan: planName });
        }, 3000);
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-10 shadow-2xl shadow-emerald-500/20 max-w-md w-full text-center relative overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
                    
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check size={40} className="text-emerald-500" strokeWidth={3} />
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-4">🎉 ¡Bienvenido a EventPix Premium!</h2>
                    <p className="text-slate-300 text-lg mb-8">Ya podés empezar a simplificar tu evento 😄</p>
                    
                    <button 
                        onClick={() => {
                            setSuccess(false);
                            onSuccess(loadingPlan || 'premium');
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        Ir a mi evento
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#030712] border border-white/5 rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-black">
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-start bg-black/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <Crown className="text-yellow-500" />
                            Elegí tu plan EventPix
                        </h2>
                        <p className="text-slate-400">Simplificá la organización de tu evento y disfrutá más el proceso.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-white/5 rounded-full transition-colors relative z-10">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-slate-950">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* PLAN GRATIS */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-slate-300 mb-2">Gratis</h3>
                            <p className="text-slate-500 text-sm mb-6 min-h-[40px]">Todo lo básico para organizar tu evento sin complicaciones.</p>
                            
                            <div className="text-4xl font-bold text-white mb-8">$0</div>
                            
                            <div className="space-y-4 flex-1 mb-8">
                                {[
                                    'Organizador de invitados',
                                    'Importación/Exportación Excel',
                                    'Organización de mesas',
                                    'Checklist inteligente',
                                    'Presupuesto simple'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Check size={18} className="text-slate-600 mt-0.5 shrink-0" />
                                        <span className="text-sm text-slate-400">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={onClose}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                            >
                                Continuar Gratis
                            </button>
                        </div>

                        {/* PLAN ESENCIAL */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
                            <h3 className="text-xl font-bold text-white mb-2">Esencial</h3>
                            <p className="text-slate-400 text-sm mb-6 min-h-[40px]">Ideal para empezar a automatizar las confirmaciones.</p>
                            
                            <div className="flex items-end gap-1 mb-8">
                                <span className="text-4xl font-bold text-white">$45.000</span>
                                <span className="text-slate-500 text-sm mb-1">/ pago único</span>
                            </div>
                            
                            <div className="space-y-4 flex-1 mb-8">
                                {[
                                    'Todo lo del plan Gratis',
                                    'Invitación Web EventPix',
                                    'Confirmaciones RSVP automáticas',
                                    'Guardado permanente en la nube',
                                    'Acceso desde cualquier lugar'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Check size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <span className="text-sm text-slate-200">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => handleSubscribe('esencial')}
                                disabled={loadingPlan !== null}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {loadingPlan === 'esencial' ? <Loader2 className="animate-spin" /> : 'Pagar con MercadoPago'}
                            </button>
                        </div>

                        {/* PLAN PREMIUM (RECOMENDADO) */}
                        <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900 border-2 border-indigo-500/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-indigo-500/10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                                ⭐ Más elegido
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-2">Premium EventPix</h3>
                            <p className="text-indigo-200/70 text-sm mb-6 min-h-[40px]">La experiencia completa. Todo organizado y además simplificado.</p>
                            
                            <div className="flex items-end gap-1 mb-8">
                                <span className="text-4xl font-bold text-white">$85.000</span>
                                <span className="text-indigo-300 text-sm mb-1">/ pago único</span>
                            </div>
                            
                            <div className="space-y-4 flex-1 mb-8">
                                {[
                                    'Todo lo del plan Esencial',
                                    'Recepcionista Virtual para ingreso',
                                    'EventPix / Espejo Mágico interactivo',
                                    'Herramientas premium completas',
                                    'Soporte prioritario'
                                ].map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check size={12} className="text-indigo-400 font-bold" />
                                        </div>
                                        <span className="text-sm font-medium text-white">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                onClick={() => handleSubscribe('premium')}
                                disabled={loadingPlan !== null}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                            >
                                {loadingPlan === 'premium' ? <Loader2 className="animate-spin" /> : 'Pagar con MercadoPago'}
                            </button>
                        </div>
                        
                    </div>
                    
                    <div className="text-center mt-8">
                        <p className="text-xs text-slate-500">
                            Pagos procesados de forma segura mediante MercadoPago. No se guardan datos de tarjetas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
