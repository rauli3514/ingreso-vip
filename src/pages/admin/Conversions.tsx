import { Filter, ArrowRight, UserPlus, MousePointerClick, CheckCircle } from 'lucide-react';

export default function Conversions() {
    const funnelSteps = [
        { label: 'Visitas a Landing', value: 12450, icon: MousePointerClick, color: 'blue', dropoff: '45%' },
        { label: 'Inician Planificador', value: 6840, icon: ArrowRight, color: 'indigo', dropoff: '32%' },
        { label: 'Agregan Invitados', value: 4650, icon: UserPlus, color: 'purple', dropoff: '15%' },
        { label: 'Guardan Cuenta', value: 3952, icon: CheckCircle, color: 'emerald', dropoff: '0%' },
    ];

    const maxVal = funnelSteps[0].value;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Filter className="text-blue-500" />
                    Embudo de Conversión
                </h1>
                <p className="text-slate-400">Analiza cómo los usuarios interactúan y se registran en EventPix.</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-bold text-white">Rendimiento del Funnel (Últimos 30 días)</h3>
                    <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 focus:outline-none">
                        <option>Todos los canales</option>
                        <option>Orgánico</option>
                        <option>Instagram Ads</option>
                        <option>Google Ads</option>
                    </select>
                </div>

                <div className="space-y-8">
                    {funnelSteps.map((step, index) => {
                        const Icon = step.icon;
                        const percentage = Math.round((step.value / maxVal) * 100);
                        const isLast = index === funnelSteps.length - 1;

                        return (
                            <div key={index} className="relative">
                                {/* Connection line */}
                                {!isLast && (
                                    <div className="absolute left-6 top-14 bottom-[-32px] w-0.5 bg-slate-800 z-0"></div>
                                )}
                                
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl bg-${step.color}-500/10 flex items-center justify-center shrink-0 border border-${step.color}-500/20`}>
                                        <Icon className={`text-${step.color}-500`} size={24} />
                                    </div>
                                    
                                    <div className="flex-1 pt-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-lg font-bold text-white">{step.label}</h4>
                                            <div className="text-right">
                                                <span className="text-lg font-bold text-white block">{step.value.toLocaleString()}</span>
                                                <span className="text-xs text-slate-500">{percentage}% del total</span>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-${step.color}-500 rounded-full transition-all duration-1000 ease-out`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>

                                        {!isLast && (
                                            <p className="text-xs text-slate-500 mt-4 ml-2 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-rose-500/50"></span>
                                                Caída del {step.dropoff} hacia el siguiente paso
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h4 className="font-bold text-white mb-4">Mejores Canales de Adquisición</h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Instagram Ads</span>
                            <span className="text-sm font-bold text-white">45%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Búsqueda Orgánica</span>
                            <span className="text-sm font-bold text-white">30%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-300">Recomendaciones</span>
                            <span className="text-sm font-bold text-white">15%</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h4 className="font-bold text-white mb-4">Tiempo Promedio de Conversión</h4>
                    <div className="flex items-center gap-4 h-full pb-4">
                        <div className="text-5xl font-bold text-emerald-400">12<span className="text-2xl text-slate-500">min</span></div>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Desde que entran a la landing hasta que guardan su cuenta con el evento inicial creado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
