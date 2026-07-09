import { useEffect, useState } from 'react';
import { Crown, TrendingUp, Users, Zap, Save, Loader2, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AppSettings {
    id: number;
    plan_esencial_price: number;
    plan_premium_price: number;
}

interface PaymentRecord {
    id: string;
    event_id: string;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
    events?: { name: string };
}

export default function Premium() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [esencialPrice, setEsencialPrice] = useState(0);
    const [premiumPrice, setPremiumPrice] = useState(0);

    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch settings
            const { data: settingsData } = await supabase
                .from('app_settings')
                .select('*')
                .eq('id', 1)
                .single();
                
            if (settingsData) {
                setSettings(settingsData);
                setEsencialPrice(settingsData.plan_esencial_price);
                setPremiumPrice(settingsData.plan_premium_price);
            }

            // Fetch payments
            const { data: paymentsData } = await supabase
                .from('payments')
                .select(`
                    *,
                    events ( name )
                `)
                .order('created_at', { ascending: false });

            if (paymentsData) {
                setPayments(paymentsData);
                const total = paymentsData.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                setTotalRevenue(total);
            }
        } catch (error) {
            console.error("Error fetching admin premium data:", error);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Crown className="text-yellow-500" />
                    Módulo Premium y Pagos
                </h1>
                <p className="text-slate-400">Gestiona los precios de tus planes y visualiza los pagos recibidos.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-500/10 to-slate-900 border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                            <Users className="text-yellow-500" size={24} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Pagos Totales Registrados</p>
                    <h3 className="text-3xl font-bold text-white">{payments.length}</h3>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <DollarSign className="text-emerald-500" size={24} />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Ingresos Totales (Bruto)</p>
                    <h3 className="text-3xl font-bold text-white">${totalRevenue.toLocaleString('es-AR')}</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuración de Precios */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Zap className="text-blue-500" />
                        Configuración de Precios
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Precio Plan Invitación Digital (Esencial)</label>
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
                            <label className="block text-sm font-medium text-slate-400 mb-2">Precio Plan Ingreso VIP (Premium)</label>
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
                            Los cambios impactarán en tiempo real en los modales de pago de los clientes.
                        </p>
                    </div>
                </div>

                {/* Feature Usage (Mantener existente temporalmente o reemplazar por algo útil) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6">Uso de Herramientas Premium</h3>
                    
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

            {/* Historial de Pagos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-800">
                    <h3 className="text-xl font-bold text-white">Historial de Pagos</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50">
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Fecha</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Evento</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Plan Adquirido</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Monto</th>
                                <th className="p-4 text-sm font-medium text-slate-400 border-b border-slate-800">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No hay pagos registrados todavía.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 text-sm text-slate-300">
                                            {new Date(payment.created_at).toLocaleDateString('es-AR', {
                                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-white">
                                            {payment.events?.name || 'Evento Desconocido'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                payment.plan_name === 'premium' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                            }`}>
                                                {payment.plan_name === 'premium' ? 'Ingreso VIP' : 'Invitación Digital'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-emerald-400">
                                            ${payment.amount.toLocaleString('es-AR')}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="flex items-center gap-1 text-emerald-400">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                                Aprobado
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
