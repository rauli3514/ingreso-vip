import { Search, Star, MapPin, ExternalLink, Plus } from 'lucide-react';

export default function Providers() {
    const providers = [
        { id: '1', name: 'DJ Maxi Sonido', category: 'Música / DJ', rating: 4.9, reviews: 124, location: 'CABA y GBA', tier: 'premium' },
        { id: '2', name: 'Salón Los Pinos', category: 'Salón', rating: 4.7, reviews: 89, location: 'Pilar', tier: 'standard' },
        { id: '3', name: 'Catering Gourmet', category: 'Catering', rating: 4.8, reviews: 210, location: 'CABA', tier: 'premium' },
        { id: '4', name: 'Foto y Video Pro', category: 'Fotografía', rating: 4.5, reviews: 56, location: 'Zona Norte', tier: 'standard' },
        { id: '5', name: 'Barra Libre VIP', category: 'Bebidas', rating: 4.9, reviews: 312, location: 'Todo el país', tier: 'premium' },
        { id: '6', name: 'Deco Dreams', category: 'Decoración', rating: 4.6, reviews: 45, location: 'CABA', tier: 'standard' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Directorio de Proveedores</h1>
                    <p className="text-slate-400">Gestiona los proveedores que reciben leads de la plataforma.</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-5 rounded-xl transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 w-full sm:w-auto">
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
                        placeholder="Buscar proveedor..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <select className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-300 focus:outline-none focus:border-blue-500 transition-colors appearance-none">
                    <option value="">Todas las categorías</option>
                    <option value="salon">Salón</option>
                    <option value="musica">Música / DJ</option>
                    <option value="catering">Catering</option>
                </select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {providers.map((provider) => (
                    <div key={provider.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors relative overflow-hidden group">
                        {provider.tier === 'premium' && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
                        )}
                        
                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {provider.name}
                                    {provider.tier === 'premium' && (
                                        <span className="bg-blue-500/20 text-blue-400 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">
                                            Premium
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-slate-400">{provider.category}</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                                {provider.name.charAt(0)}
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 relative z-10">
                            <div className="flex items-center gap-2 text-sm">
                                <Star size={16} className="text-amber-400 fill-amber-400" />
                                <span className="text-white font-medium">{provider.rating}</span>
                                <span className="text-slate-500">({provider.reviews} reseñas)</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <MapPin size={16} />
                                {provider.location}
                            </div>
                        </div>

                        <div className="flex gap-2 relative z-10">
                            <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2 rounded-xl transition-colors">
                                Editar
                            </button>
                            <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
                                <ExternalLink size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
