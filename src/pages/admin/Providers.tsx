import { useState, useEffect } from 'react';
import { Search, Star, MapPin, ExternalLink, Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Provider } from '../../types';
import ProviderModal from './components/ProviderModal';

export default function Providers() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [providerToEdit, setProviderToEdit] = useState<Provider | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const fetchProviders = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('providers')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (error) throw error;
            setProviders(data || []);
        } catch (error) {
            console.error('Error fetching providers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, []);

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este proveedor?')) return;
        
        try {
            const { error } = await supabase
                .from('providers')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            fetchProviders();
        } catch (error) {
            console.error('Error deleting provider:', error);
            alert('Error al eliminar el proveedor');
        }
    };

    const openEditModal = (provider: Provider) => {
        setProviderToEdit(provider);
        setIsModalOpen(true);
    };

    const openNewModal = () => {
        setProviderToEdit(null);
        setIsModalOpen(true);
    };

    // Derived unique categories for the filter dropdown
    const allCategories = Array.from(new Set(providers.flatMap(p => p.services_offered)));

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.company_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              p.location.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === '' || p.services_offered.includes(categoryFilter);
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Directorio de Proveedores</h1>
                    <p className="text-slate-400">Gestiona los proveedores que reciben leads de la plataforma.</p>
                </div>
                <button 
                    onClick={openNewModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <Plus size={18} />
                    Nuevo Proveedor
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-slate-500" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Buscar proveedor o ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none min-w-[200px]"
                >
                    <option value="">Todas las categorías</option>
                    {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            ) : filteredProviders.length === 0 ? (
                <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron proveedores</h3>
                    <p className="text-slate-400">Prueba cambiando los filtros o agrega un nuevo proveedor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProviders.map((provider) => (
                        <div key={provider.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors relative overflow-hidden group">
                            {provider.tier === 'premium' && (
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
                            )}
                            
                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    {provider.logo_url ? (
                                        <img src={provider.logo_url} alt={provider.company_name} className="w-12 h-12 rounded-xl object-cover border border-slate-800" />
                                    ) : (
                                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xl">
                                            {provider.company_name.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            {provider.company_name}
                                            {provider.tier === 'premium' && (
                                                <span className="bg-blue-500/20 text-blue-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                                                    Premium
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-1">
                                            {provider.services_offered.slice(0, 2).map((s, i) => (
                                                <span key={i} className="bg-slate-800 px-1.5 py-0.5 rounded-md">{s}</span>
                                            ))}
                                            {provider.services_offered.length > 2 && <span className="bg-slate-800 px-1.5 py-0.5 rounded-md">+{provider.services_offered.length - 2}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 mb-6 relative z-10">
                                <div className="flex items-center gap-2 text-sm">
                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                    <span className="text-white font-medium">{provider.rating}</span>
                                    <span className="text-slate-500">({provider.reviews_count} reseñas)</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <MapPin size={16} />
                                    {provider.location}
                                </div>
                                <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 pt-2">
                                    Precio Base: ${provider.base_price.toLocaleString()}
                                </div>
                            </div>

                            <div className="flex gap-2 relative z-10">
                                <button 
                                    onClick={() => openEditModal(provider)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 flex items-center justify-center gap-2 rounded-xl transition-colors"
                                >
                                    <Edit2 size={16} /> Editar
                                </button>
                                <a 
                                    href={`https://wa.me/${provider.whatsapp_number.replace(/[^0-9]/g, '')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-400 rounded-xl transition-colors"
                                    title="Contactar por WhatsApp"
                                >
                                    <ExternalLink size={18} />
                                </a>
                                <button 
                                    onClick={() => handleDelete(provider.id)}
                                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 rounded-xl transition-colors"
                                    title="Eliminar proveedor"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProviderModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchProviders();
                }}
                providerToEdit={providerToEdit}
            />
        </div>
    );
}
