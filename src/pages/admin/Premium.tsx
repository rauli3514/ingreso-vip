import { Crown, TrendingUp, Users, Zap } from 'lucide-react';

export default function Premium() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Crown className="text-yellow-500" />
                    Módulo Premium
                </h1>
                <p className="text-slate-400">Gestiona las suscripciones y herramientas avanzadas de EventPix.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-500/10 to-slate-900 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <Users className="text-yellow-500" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> +15%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Suscriptores Activos</p>
                    <h3 className="text-3xl font-bold text-white">412</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                            <Zap className="text-blue-500" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                            <TrendingUp size={14} /> +5%
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Tasa de Conversión</p>
                    <h3 className="text-3xl font-bold text-white">14.5%</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Crown className="text-emerald-500" size={24} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">
                            Mensual
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Ingresos MRR Premium</p>
                    <h3 className="text-3xl font-bold text-white">$2.4K</h3>
                </div>
            </div>

            {/* Feature Usage */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6">Uso de Herramientas Premium</h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white font-medium">Invitaciones Web</span>
                            <span className="text-slate-400">85% de adopción</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white font-medium">Recepcionista Virtual</span>
                            <span className="text-slate-400">42% de adopción</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '42%' }}></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-white font-medium">Espejo Mágico</span>
                            <span className="text-slate-400">18% de adopción</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: '18%' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
