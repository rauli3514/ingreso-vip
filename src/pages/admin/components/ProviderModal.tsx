import { useState, useEffect } from 'react';
import { X, Save, Building, MapPin, DollarSign, Image as ImageIcon, Phone } from 'lucide-react';
import { Provider } from '../../../types';
import { supabase } from '../../../lib/supabase';

interface ProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    providerToEdit?: Provider | null;
}

const AVAILABLE_SERVICES = [
    'Música / DJ',
    'Salón',
    'Catering',
    'Fotografía',
    'Video',
    'Bebidas',
    'Decoración',
    'Entretenimiento',
    'Vajilla',
    'Invitaciones',
    'Otro'
];

export default function ProviderModal({ isOpen, onClose, onSuccess, providerToEdit }: ProviderModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        company_name: '',
        location: '',
        whatsapp_number: '',
        base_price: '',
        logo_url: '',
        website_url: '',
        instagram_url: '',
        tier: 'standard' as 'standard' | 'premium',
        services_offered: [] as string[]
    });

    useEffect(() => {
        if (providerToEdit) {
            setFormData({
                company_name: providerToEdit.company_name || '',
                location: providerToEdit.location || '',
                whatsapp_number: providerToEdit.whatsapp_number || '',
                base_price: providerToEdit.base_price?.toString() || '',
                logo_url: providerToEdit.logo_url || '',
                website_url: providerToEdit.website_url || '',
                instagram_url: providerToEdit.instagram_url || '',
                tier: providerToEdit.tier || 'standard',
                services_offered: providerToEdit.services_offered || []
            });
        } else {
            setFormData({
                company_name: '',
                location: '',
                whatsapp_number: '',
                base_price: '',
                logo_url: '',
                website_url: '',
                instagram_url: '',
                tier: 'standard',
                services_offered: []
            });
        }
    }, [providerToEdit, isOpen]);

    if (!isOpen) return null;

    const toggleService = (service: string) => {
        setFormData(prev => {
            if (prev.services_offered.includes(service)) {
                return { ...prev, services_offered: prev.services_offered.filter(s => s !== service) };
            } else {
                return { ...prev, services_offered: [...prev.services_offered, service] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (formData.services_offered.length === 0) {
                throw new Error("Debe seleccionar al menos un servicio.");
            }

            const dataToSave = {
                company_name: formData.company_name,
                location: formData.location,
                whatsapp_number: formData.whatsapp_number,
                base_price: parseFloat(formData.base_price) || 0,
                logo_url: formData.logo_url,
                website_url: formData.website_url,
                instagram_url: formData.instagram_url,
                tier: formData.tier,
                services_offered: formData.services_offered,
                updated_at: new Date().toISOString()
            };

            if (providerToEdit) {
                const { error: dbError } = await supabase
                    .from('providers')
                    .update(dataToSave)
                    .eq('id', providerToEdit.id);
                if (dbError) throw dbError;
            } else {
                const { error: dbError } = await supabase
                    .from('providers')
                    .insert([{ ...dataToSave, rating: 5.0, reviews_count: 0 }]);
                if (dbError) throw dbError;
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Error al guardar el proveedor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {providerToEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form id="provider-form" onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Nombre de la Empresa
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building size={16} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.company_name}
                                        onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="Ej: DJ Maxi Sonido"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Ubicación / Zona de Cobertura
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin size={16} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="Ej: CABA y GBA Norte"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    WhatsApp de Contacto
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone size={16} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        required
                                        value={formData.whatsapp_number}
                                        onChange={(e) => setFormData({...formData, whatsapp_number: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="Ej: +5491122334455"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Precio Base Estimado ($)
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-slate-500" />
                                    </div>
                                    <input 
                                        type="number" 
                                        min="0"
                                        step="1000"
                                        value={formData.base_price}
                                        onChange={(e) => setFormData({...formData, base_price: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="Ej: 50000"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Categorías / Servicios que ofrece (Seleccionar al menos uno)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_SERVICES.map(service => (
                                    <button
                                        key={service}
                                        type="button"
                                        onClick={() => toggleService(service)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                                            formData.services_offered.includes(service)
                                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >
                                        {service}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Logo URL (Opcional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <ImageIcon size={16} className="text-slate-500" />
                                </div>
                                <input 
                                    type="url" 
                                    value={formData.logo_url}
                                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                    placeholder="https://ejemplo.com/logo.png"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Página Web (Opcional)
                                </label>
                                <div className="relative">
                                    <input 
                                        type="url" 
                                        value={formData.website_url}
                                        onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="https://tuweb.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">
                                    Instagram URL (Opcional)
                                </label>
                                <div className="relative">
                                    <input 
                                        type="url" 
                                        value={formData.instagram_url}
                                        onChange={(e) => setFormData({...formData, instagram_url: e.target.value})}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 focus:outline-none transition-colors"
                                        placeholder="https://instagram.com/usuario"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Nivel de Destacado
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="tier" 
                                        value="standard" 
                                        checked={formData.tier === 'standard'}
                                        onChange={() => setFormData({...formData, tier: 'standard'})}
                                        className="text-blue-500 bg-slate-800 border-slate-700"
                                    />
                                    <span className="text-slate-300">Estándar</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="tier" 
                                        value="premium" 
                                        checked={formData.tier === 'premium'}
                                        onChange={() => setFormData({...formData, tier: 'premium'})}
                                        className="text-blue-500 bg-slate-800 border-slate-700"
                                    />
                                    <span className="text-blue-400 font-medium tracking-wide flex items-center gap-1">
                                        Premium <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase">Top</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        form="provider-form"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={18} />
                        )}
                        {providerToEdit ? 'Guardar Cambios' : 'Crear Proveedor'}
                    </button>
                </div>
            </div>
        </div>
    );
}
