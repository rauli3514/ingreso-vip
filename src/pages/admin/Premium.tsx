import { useEffect, useMemo, useState } from 'react';
import { Crown, Zap, Save, Loader2, DollarSign, ShoppingBag, Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
    BusinessData, Period, PERIOD_LABELS, fetchBusinessData, formatARS, hasModule, inPeriod, isVerifiedPayment
} from '../../lib/adminMetrics';

const PLAN_LABELS: Record<string, string> = {
    esencial: 'Invitación Digital',
    premium: 'Ingreso VIP',
};

type PaymentFilter = 'all' | 'verified' | 'legacy';

export default function Premium() {
    const [data, setData] = useState<BusinessData | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [period, setPeriod] = useState<Period>('30d');
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

    // Form state
    const [esencialPrice, setEsencialPrice] = useState(0);
    const [premiumPrice, setPremiumPrice] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [{ data: settingsData }, businessData] = await Promise.all([
                supabase.from('app_settings').select('*').eq('id', 1).single(),
                fetchBusinessData(),
            ]);

            if (settingsData) {
                setEsencialPrice(settingsData.plan_esencial_price);
                setPremiumPrice(settingsData.plan_premium_price);
            }
            setData(businessData);
        } catch (error: any) {
            console.error("Error fetching admin premium data:", error);
            setLoadError(error.message || 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePrices = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('app_settings')
                .update({
                    plan_esencial_price: esencialPrice,
                    plan_premium_price: premiumPrice,
                    updated_at: new Date().toISOString()
                })
                .eq('id', 1);

            if (error) throw error;
            alert('Precios actualizados correctamente.');
        } catch (error) {
            console.error("Error saving prices:", error);
            alert('Error al guardar los precios.');
        } finally {
            setSaving(false);
        }
    };

    const view = useMemo(() => {
        if (!data) return null;
        const eventsById = new Map(data.events.map(e => [e.id, e]));
        const emailById = new Map(data.profiles.map(p => [p.id, p.email]));

        const verified = data.payments.filter(isVerifiedPayment);
        const legacy = data.payments.filter(p => !isVerifiedPayment(p));
        const verifiedInPeriod = verified.filter(p => inPeriod(p.created_at, period));
        const revenue = verifiedInPeriod.reduce((acc, p) => acc + p.amount, 0);

        const byPlan = (['esencial', 'premium'] as const).map(plan => {
            const rows = verifiedInPeriod.filter(p => p.plan_name === plan);
            return { plan, count: rows.length, total: rows.reduce((acc, p) => acc + p.amount, 0) };
        });

        const vipEvents = data.events.filter(e => hasModule(e, 'vip_access')).length;
        const invitationOnlyEvents = data.events.filter(e => hasModule(e, 'invitation_pro') && !hasModule(e, 'vip_access')).length;

        const rows = data.payments
            .filter(p => paymentFilter === 'all' || (paymentFilter === 'verified' ? isVerifiedPayment(p) : !isVerifiedPayment(p)))
            .sort((a, b) => b.created_at.localeCompare(a.created_at))
            .map(p => {
                const event = p.event_id ? eventsById.get(p.event_id) : undefined;
                return {
                    ...p,
                    eventName: event?.name || (p.event_id ? 'Evento borrado' : 'Sin evento'),
                    ownerEmail: event?.owner_id ? emailById.get(event.owner_id) : null,
                };
            });

        return {
            revenue,
            salesCount: verifiedInPeriod.length,
            averageTicket: verifiedInPeriod.length ? revenue / verifiedInPeriod.length : 0,
            byPlan,
            legacyCount: legacy.length,
            legacyTotal: legacy.reduce((acc, p) => acc + p.amount, 0),
            vipEvents,
            invitationOnlyEvents,
            rows,
        };
    }, [data, period, paymentFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    if (loadError || !view) {
        return (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-6">
                No se pudieron cargar los pagos: {loadError}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Crown className="text-yellow-500" />
                        Ventas y Pagos
                    </h1>
                    <p className="text-slate-400">Lo que cobraste por los planes, confirmado por MercadoPago.</p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as Period)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                    {Object.entries(PERIOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Kpi icon={DollarSign} color="emerald" label="Cobrado" value={formatARS(view.revenue)} hint={`${PERIOD_LABELS[period]} · confirmado por MercadoPago`} />
                <Kpi icon={ShoppingBag} color="yellow" label="Ventas" value={String(view.salesCount)} hint={`Planes vendidos · ${PERIOD_LABELS[period].toLowerCase()}`} />
                <Kpi icon={Receipt} color="blue" label="Ticket promedio" value={view.salesCount ? formatARS(view.averageTicket) : '—'} hint="Cobrado ÷ ventas" />
            </div>

            {view.legacyCount > 0 && (
                <div className="flex gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-200">
                    <AlertTriangle className="shrink-0 text-amber-400" size={20} />
                    <p>
                        Hay <strong>{view.legacyCount} registro{view.legacyCount !== 1 ? 's' : ''} viejo{view.legacyCount !== 1 ? 's' : ''}</strong> ({formatARS(view.legacyTotal)}) de antes del cobro seguro.
                        No tienen comprobante de MercadoPago, así que <strong>no se cuentan en lo cobrado</strong>: algunos pueden ser
                        planes activados sin pagar. Para confirmarlos, buscalos en tu cuenta de MercadoPago.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ventas por plan y planes activos */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Ventas por plan</h3>
                    <div className="space-y-4">
                        {view.byPlan.map(({ plan, count, total }) => (
                            <div key={plan} className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">{PLAN_LABELS[plan]}</p>
                                    <p className="text-xs text-slate-500">{count} venta{count !== 1 ? 's' : ''}</p>
                                </div>
                                <p className="text-lg font-bold text-emerald-400">{formatARS(total)}</p>
                            </div>
                        ))}
                    </div>

                    <h3 className="text-xl font-bold text-white mt-10 mb-2">Eventos con plan activo hoy</h3>
                    <p className="text-xs text-slate-500 mb-6">Incluye los que activaste a mano desde Clientes.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <p className="text-3xl font-bold text-white">{view.invitationOnlyEvents}</p>
                            <p className="text-sm text-slate-400">Invitación Digital</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                            <p className="text-3xl font-bold text-white">{view.vipEvents}</p>
                            <p className="text-sm text-slate-400">Ingreso VIP</p>
                        </div>
                    </div>
                </div>

                {/* Configuración de Precios */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-blue-500" />
                        Precios de los planes
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Plan Invitación Digital</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                <input
                                    type="number"
                                    value={esencialPrice}
                                    onChange={(e) => setEsencialPrice(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Plan Ingreso VIP</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                <input
                                    type="number"
                                    value={premiumPrice}
                                    onChange={(e) => setPremiumPrice(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSavePrices}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            {saving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                            Guardar Precios
                        </button>
                        <p className="text-xs text-slate-500 text-center">
                            El precio nuevo se cobra desde el próximo pago. Los pagos ya hechos no cambian.
                        </p>
                    </div>
                </div>
            </div>

            {/* Historial de Pagos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-white">Historial de pagos</h3>
                    <div className="flex bg-slate-950 rounded-lg border border-slate-800 p-1 text-xs">
                        {([['all', 'Todos'], ['verified', 'Confirmados'], ['legacy', 'Sin comprobante']] as const).map(([value, label]) => (
                            <button
                                key={value}
                                onClick={() => setPaymentFilter(value)}
                                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${paymentFilter === value ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Fecha</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Evento / Cliente</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Plan</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Monto</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Comprobante</th>
                            </tr>
                        </thead>
                        <tbody>
                            {view.rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No hay pagos para mostrar.
                                    </td>
                                </tr>
                            ) : (
                                view.rows.map((payment) => {
                                    const verified = isVerifiedPayment(payment);
                                    return (
                                        <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                            <td className="p-4 text-sm text-slate-300 whitespace-nowrap">
                                                {new Date(payment.created_at).toLocaleString('es-AR', {
                                                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <p className="font-medium text-white">{payment.eventName}</p>
                                                {payment.ownerEmail && <p className="text-xs text-slate-500">{payment.ownerEmail}</p>}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${payment.plan_name === 'premium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                    }`}>
                                                    {PLAN_LABELS[payment.plan_name] || payment.plan_name}
                                                </span>
                                            </td>
                                            <td className={`p-4 text-sm font-bold ${verified ? 'text-emerald-400' : 'text-slate-500 line-through decoration-slate-600'}`}>
                                                {formatARS(payment.amount)}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {verified ? (
                                                    <span className="flex items-center gap-1.5 text-emerald-400 whitespace-nowrap">
                                                        <CheckCircle2 size={14} /> MercadoPago #{payment.mp_payment_id}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-amber-400 whitespace-nowrap" title="Registrado antes del cobro seguro: no se puede verificar">
                                                        <AlertTriangle size={14} /> Sin comprobante (sistema viejo)
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Kpi({ icon: Icon, color, label, value, hint }: { icon: any; color: 'emerald' | 'yellow' | 'blue'; label: string; value: string; hint: string }) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-500',
        yellow: 'bg-yellow-500/10 text-yellow-500',
        blue: 'bg-blue-500/10 text-blue-500',
    };
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colors[color]}`}>
                <Icon size={24} />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            <p className="text-xs text-slate-500 mt-2">{hint}</p>
        </div>
    );
}
