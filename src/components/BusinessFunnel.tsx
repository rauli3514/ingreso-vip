import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Loader2, Info, TrendingDown, UserPlus, CalendarPlus, CreditCard, Percent } from 'lucide-react';
import {
    BusinessData, Period, PERIOD_LABELS, buildFunnel, fetchBusinessData, inPeriod, isPaidEvent
} from '../lib/adminMetrics';

// Embudo real del organizador, con datos de la base: de los eventos creados en
// el período, cuántos cargaron invitados, armaron la invitación y pagaron.

export default function BusinessFunnel() {
    const [data, setData] = useState<BusinessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [period, setPeriod] = useState<Period>('30d');

    useEffect(() => {
        fetchBusinessData()
            .then(setData)
            .catch((error) => {
                console.error('Error fetching business metrics:', error);
                setLoadError(error.message || 'No se pudieron cargar las métricas');
            })
            .finally(() => setLoading(false));
    }, []);

    const view = useMemo(() => {
        if (!data) return null;
        const funnel = buildFunnel(data, period);
        const created = funnel.steps[0].value;
        const paid = funnel.steps[funnel.steps.length - 1].value;
        const emailById = new Map(data.profiles.map(p => [p.id, p.email]));

        const recent = data.events
            .filter(e => inPeriod(e.created_at, period))
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .slice(0, 10)
            .map(e => ({
                ...e,
                ownerEmail: e.owner_id ? emailById.get(e.owner_id) : null,
                hasGuests: data.eventIdsWithGuests.has(e.id),
                hasInvitation: data.eventIdsWithInvitation.has(e.id),
                paid: isPaidEvent(e),
            }));

        return {
            ...funnel,
            created,
            paid,
            conversion: created ? Math.round((paid / created) * 100) : 0,
            recent,
        };
    }, [data, period]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                <p className="text-slate-400 font-medium">Calculando métricas...</p>
            </div>
        );
    }

    if (loadError || !view) {
        return (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-6">
                No se pudieron cargar las métricas: {loadError}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <BarChart3 className="text-blue-500" /> Embudo de clientes
                    </h1>
                    <p className="text-slate-400 text-sm">
                        De los eventos creados, cuántos llegan a cada paso hasta pagar. Datos reales de la base.
                    </p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Kpi icon={UserPlus} label="Cuentas nuevas" value={view.accounts} hint="Se registraron" />
                <Kpi icon={CalendarPlus} label="Eventos creados" value={view.created} hint="Empezaron a planificar" />
                <Kpi icon={CreditCard} label="Pagaron un plan" value={view.paid} hint="De los eventos creados" />
                <Kpi icon={Percent} label="Conversión a pago" value={`${view.conversion}%`} hint="Pagaron ÷ eventos creados" />
            </div>

            {/* Embudo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-1">Paso a paso</h2>
                <p className="text-sm text-slate-500 mb-8">Eventos creados: {PERIOD_LABELS[period].toLowerCase()}.</p>

                {view.created === 0 ? (
                    <p className="text-slate-500 text-center py-8">No se crearon eventos en este período.</p>
                ) : (
                    <div className="space-y-6">
                        {view.steps.map((step, index) => {
                            const percentage = Math.round((step.value / view.created) * 100);
                            const previous = index > 0 ? view.steps[index - 1].value : 0;
                            const dropOff = index > 0 && previous > 0 ? 100 - Math.round((step.value / previous) * 100) : 0;
                            return (
                                <div key={step.label}>
                                    {index > 0 && dropOff > 0 && (
                                        <p className="flex items-center gap-1 text-xs text-rose-400 font-medium mb-2 ml-1">
                                            <TrendingDown size={12} /> {dropOff}% se quedó en el paso anterior
                                        </p>
                                    )}
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                        <div className="md:w-56 shrink-0">
                                            <p className="text-sm font-semibold text-white">{index + 1}. {step.label}</p>
                                            <p className="text-xs text-slate-500">{step.help}</p>
                                        </div>
                                        <div className="flex-1 bg-slate-950 rounded-full h-9 overflow-hidden relative border border-slate-800">
                                            <div
                                                className="h-full bg-blue-600/60 border-r-2 border-blue-400 transition-all duration-700"
                                                style={{ width: `${Math.max(percentage, step.value > 0 ? 2 : 0)}%` }}
                                            ></div>
                                            <div className="absolute inset-0 flex items-center px-4 text-sm font-bold text-white">
                                                {step.value} evento{step.value !== 1 ? 's' : ''} · {percentage}%
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Últimos eventos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6">Últimos eventos creados</h2>
                {view.recent.length === 0 ? (
                    <p className="text-slate-500 text-sm">No hay eventos en este período.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase border-b border-slate-800">
                                <tr>
                                    <th className="px-4 py-3">Creado</th>
                                    <th className="px-4 py-3">Evento / Cliente</th>
                                    <th className="px-4 py-3">Hasta dónde llegó</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {view.recent.map(e => (
                                    <tr key={e.id} className="hover:bg-slate-800/40">
                                        <td className="px-4 py-3 whitespace-nowrap text-slate-400">
                                            {new Date(e.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-white">{e.name || 'Sin nombre'}</p>
                                            {e.ownerEmail && <p className="text-xs text-slate-500">{e.ownerEmail}</p>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                <Step done label="Evento" />
                                                <Step done={e.hasGuests} label="Invitados" />
                                                <Step done={e.hasInvitation} label="Invitación" />
                                                <Step done={e.paid} label="Pagó" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-slate-400">
                <Info className="shrink-0 text-blue-400" size={20} />
                <p>
                    Las <strong className="text-slate-200">visitas a la página</strong> todavía no se miden: lo que se mostraba antes
                    se guardaba solo en el navegador de quien miraba esta pantalla. Para medirlas, se puede activar Vercel Analytics
                    o Google Analytics en el sitio.
                </p>
            </div>
        </div>
    );
}

function Kpi({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint: string }) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-500/10 text-blue-400">
                <Icon size={20} />
            </div>
            <p className="text-slate-400 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{hint}</p>
        </div>
    );
}

function Step({ done, label }: { done: boolean; label: string }) {
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full border ${done ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
            {done ? '✓ ' : ''}{label}
        </span>
    );
}
