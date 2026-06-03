import { useState, useEffect } from 'react';
import { X, Sparkles, MapPin, ExternalLink, Globe, Instagram, Loader2, Star, CheckCircle2 } from 'lucide-react';
import { EventData, PlannerService } from './types';
import { supabase } from '../../../../lib/supabase';
import { Provider } from '../../../../types';

interface VendorProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: PlannerService;
    eventData: EventData;
}

export default function VendorProposalModal({ isOpen, onClose, service, eventData }: VendorProposalModalProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [justContacted, setJustContacted] = useState<string | null>(null); // To show "¡Solicitud registrada!" 

    useEffect(() => {
        if (!isOpen) return;

        const fetchProviders = async () => {
            setIsLoading(true);
            try {
                // Fetch providers where services_offered JSONB array contains the exact service name
                // Supabase supports .contains() for JSONB arrays
                const { data, error } = await supabase
                    .from('providers')
                    .select('*')
                    .contains('services_offered', `["${service.name}"]`);

                if (error) throw error;
                
                // Sort premium first, then by rating
                const sorted = (data || []).sort((a, b) => {
                    if (a.tier === 'premium' && b.tier !== 'premium') return -1;
                    if (a.tier !== 'premium' && b.tier === 'premium') return 1;
                    return b.rating - a.rating;
                });
                
                setProviders(sorted);
            } catch (err) {
                console.error("Error fetching providers for service:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProviders();
    }, [isOpen, service.name]);

    if (!isOpen) return null;

    const handleWhatsAppClick = async (provider: Provider) => {
        setJustContacted(provider.id);
        
        try {
            // Silently create the lead in the background
            const guestsCount = eventData.guests ? eventData.guests.length : 0;
            
            await supabase.from('leads').insert([{
                provider_id: provider.id,
                event_id: eventData.cloudEventId || null,
                client_name: eventData.name || 'Organizador de Evento',
                estimated_budget: eventData.estimatedBudget || 0,
                event_details: {
                    guests_count: guestsCount,
                    date: eventData.date,
                    service_requested: service.name
                },
                status: 'nuevo'
            }]);
        } catch (err) {
            console.error("Error creating lead in background:", err);
        }

        // Redirect to WhatsApp
        const waNumber = provider.whatsapp_number.replace(/[^0-9]/g, '');
        const message = encodeURIComponent(`¡Hola! Te contacto desde el Planificador de EventPix. Estoy organizando mi evento (${eventData.name}) para ${eventData.guests?.length || 0} invitados y me interesa pedirte un presupuesto para el servicio de ${service.name}.`);
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            setJustContacted(null);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Proveedores para: <span className="text-blue-400">{service.name}</span>
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                            <MapPin size={14} /> Sugerencias basadas en tu zona
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/30">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                            <p className="text-slate-400 font-medium">Buscando proveedores disponibles...</p>
                        </div>
                    ) : providers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                                <Sparkles size={32} className="text-slate-500" />
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Pronto sumaremos opciones recomendadas</h4>
                            <p className="text-slate-400 max-w-md">
                                Actualmente estamos analizando y sumando nuevos profesionales de <span className="text-blue-400">{service.name}</span> para tu zona. ¡Vuelve a revisar pronto!
                            </p>
                            <button 
                                onClick={onClose}
                                className="mt-8 bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors"
                            >
                                Volver al Planificador
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {providers.map(provider => (
                                <div 
                                    key={provider.id} 
                                    className={`bg-slate-900 border ${provider.tier === 'premium' ? 'border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'border-slate-800'} rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all`}
                                >
                                    {provider.tier === 'premium' && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                    )}
                                    
                                    <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-start">
                                        {/* Logo */}
                                        <div className="shrink-0">
                                            {provider.logo_url ? (
                                                <img src={provider.logo_url} alt={provider.company_name} className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-lg" />
                                            ) : (
                                                <div className="w-16 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-2xl border border-slate-700">
                                                    {provider.company_name.charAt(0)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <h4 className="font-bold text-lg text-white">{provider.company_name}</h4>
                                                {provider.tier === 'premium' && (
                                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                                                        <Sparkles size={10} /> Recomendado
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Star size={14} className="text-amber-400 fill-amber-400" /> 
                                                    <span className="text-slate-300 font-medium">{provider.rating}</span>
                                                    <span className="text-xs">({provider.reviews_count})</span>
                                                </span>
                                                <span className="flex items-center gap-1 text-xs">
                                                    <MapPin size={12} /> {provider.location}
                                                </span>
                                            </div>

                                            {/* Links / Contact Actions */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button 
                                                    onClick={() => handleWhatsAppClick(provider)}
                                                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
                                                >
                                                    Contactar por WhatsApp
                                                </button>
                                                
                                                {provider.instagram_url && (
                                                    <a 
                                                        href={provider.instagram_url} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-pink-400 rounded-xl transition-colors border border-slate-700"
                                                        title="Ver Instagram"
                                                    >
                                                        <Instagram size={18} />
                                                    </a>
                                                )}

                                                {provider.website_url && (
                                                    <a 
                                                        href={provider.website_url} target="_blank" rel="noopener noreferrer"
                                                        className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl transition-colors border border-slate-700"
                                                        title="Ver Sitio Web"
                                                    >
                                                        <Globe size={18} />
                                                    </a>
                                                )}
                                            </div>

                                            {/* Success Message Inline */}
                                            {justContacted === provider.id && (
                                                <div className="mt-3 text-xs font-medium text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                                                    <CheckCircle2 size={14} /> ¡Solicitud registrada en EventPix!
                                                </div>
                                            )}
                                        </div>

                                        {/* Price block (Optional) */}
                                        {provider.base_price > 0 && (
                                            <div className="sm:text-right w-full sm:w-auto bg-slate-800/50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Precio Base Est.</p>
                                                <p className="text-emerald-400 font-bold">${provider.base_price.toLocaleString('es-AR')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
