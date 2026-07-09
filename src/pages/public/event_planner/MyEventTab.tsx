// @ts-nocheck
import { useState } from 'react';
import { EventData, PlannerService } from './types';
import { ChevronDown, ChevronUp, CheckCircle2, Clock, Sparkles, Lightbulb, Target, Smartphone, MonitorPlay, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorProposalModal from './VendorProposalModal';
import PremiumUpgradeModal from './PremiumUpgradeModal';

interface MyEventTabProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
    onSaveRequest?: () => void;
    onNavigateToPro?: () => void;
}

export default function MyEventTab({ eventData, onChange, onSaveRequest, onNavigateToPro }: MyEventTabProps) {
    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
    const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
    const [activeVendorModal, setActiveVendorModal] = useState<PlannerService | null>(null);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('eventpix_auth') === 'true';

    // Premium Checks
    const hasInvitation = eventData.active_modules?.includes('invitation_pro');
    const hasVipAccess = eventData.active_modules?.includes('vip_access');

    // Grouping
    const imprescindible = eventData.services.filter(s => s.group === 'imprescindible');
    const muy_importante = eventData.services.filter(s => s.group === 'muy_importante');
    const opcional = eventData.services.filter(s => s.group === 'opcional');

    // Progress Calculation
    const hasGuests = eventData.guests.length > 0;
    const hasTables = eventData.tables.length > 0;
    const hasBudget = eventData.estimatedBudget > 0;
    const imprescindibleReady = imprescindible.filter(s => s.status === 'ready').length;
    
    let progress = 0;
    if (hasGuests) progress += 20;
    if (hasTables) progress += 20;
    if (hasBudget) progress += 10;
    if (imprescindible.length > 0) {
        progress += Math.floor((imprescindibleReady / imprescindible.length) * 50);
    }
    progress = Math.min(progress, 100);

    // Contextual Header Message ("IA Percibida")
    const getContextualHeader = () => {
        const guestCount = eventData.guests.length;
        const tablesCount = eventData.tables.length;
        const salon = imprescindible.find(s => s.category === 'Salón');
        
        if (guestCount === 0) {
            return "Empecemos a organizar tu evento, el primer paso es la lista de invitados 😉";
        }
        if (guestCount > 100 && tablesCount === 0) {
            return "Tu evento ya es grande 😄 Quizás sea momento de pensar distribución y tiempos.";
        }
        if (guestCount > 0 && (!salon || salon.status !== 'ready')) {
            return "Antes de avanzar mucho, probablemente quieras resolver el lugar 📍";
        }
        if (guestCount > 0 && salon?.status === 'ready' && progress < 60) {
            return "Perfecto. Ya resolviste una de las decisiones más importantes 🎉";
        }
        if (guestCount > 80 && tablesCount === 0) {
            return "Con 80 invitados, normalmente ya empiezan a definirse mesas y música 🎧";
        }
        if (progress > 80) {
            return "Una fiesta se disfruta más cuando no se improvisa todo al final. ¡Vas excelente! 😎";
        }
        return "Paso a paso también se arma una gran fiesta 🎉";
    };

    // Assistant Cards logic
    const getAssistantCard = () => {
        const salon = imprescindible.find(s => s.category === 'Salón');
        const musica = imprescindible.find(s => s.category === 'Música');
        const comida = imprescindible.find(s => s.category === 'Catering');

        // REGLAS PREMIUM EVENTPIX
        if (eventData.guests.length > 20 && eventData.tables.length === 0 && progress < 30) {
            return {
                icon: <Lightbulb size={20} className="text-indigo-500" />,
                title: "Idea útil",
                text: "Ya tenés invitados cargados 😄 Quizás te sirva tener confirmaciones automáticas.",
                action: "Ver invitación digital",
                color: "indigo",
                onClick: () => setIsPremiumModalOpen(true)
            };
        }
        
        if (eventData.tables.length > 0 && progress >= 30) {
            return {
                icon: <Sparkles size={20} className="text-emerald-500" />,
                title: "Ya estás bastante avanzado",
                text: "Muchas personas en esta etapa empiezan a preparar invitaciones.",
                action: "Ver invitación digital",
                color: "emerald",
                onClick: () => setIsPremiumModalOpen(true)
            };
        }
        
        if (progress > 50 && eventData.guests.length > 50) {
             return {
                icon: <Clock size={20} className="text-blue-500" />,
                title: "Tu evento ya se acerca",
                text: "El recepcionista virtual puede ayudarte mucho el día del ingreso.",
                action: "Ver cómo funciona",
                color: "blue",
                onClick: () => setIsPremiumModalOpen(true)
            };
        }

        // FALLBACKS NORMALES
        if (eventData.guests.length > 0 && (!comida || comida.status !== 'ready')) {
            return {
                icon: <Lightbulb size={20} className="text-amber-500" />,
                title: "Algo importante para revisar",
                text: "Todavía no definiste comida. Muchas personas lo resuelven temprano para evitar aumentos 😅",
                action: "Revisar opciones",
                color: "amber",
                onClick: () => {
                    if (comida) {
                        setExpandedServiceId(comida.id);
                        document.getElementById(`service-${comida.id}`)?.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            };
        }
        if (eventData.guests.length > 0 && eventData.tables.length === 0) {
            return {
                icon: <Target size={20} className="text-blue-500" />,
                title: "Te puede servir ahora",
                text: "Todavía no organizaste mesas.",
                action: "Organizar mesas",
                color: "blue",
                onClick: null 
            };
        }
        if (salon?.status === 'ready' && musica?.status === 'ready' && progress < 80) {
            return {
                icon: <Sparkles size={20} className="text-emerald-500" />,
                title: "Buen avance",
                text: "Ya resolviste el salón y la música. Eso suele llevar bastante tiempo 😄",
                action: null,
                color: "emerald"
            };
        }
        return null;
    };

    const assistantCard = getAssistantCard();

    // Budget
    const totalCost = eventData.services.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const totalPaid = eventData.services.reduce((acc, curr) => acc + (curr.paid || 0), 0);
    const balance = totalCost - totalPaid;
    
    const getBudgetMessage = () => {
        if (eventData.estimatedBudget === 0) return "Ingresá tu presupuesto estimado para llevar el control 💡";
        if (totalCost === 0) return "Todavía hay margen para sumar algo más 🎉";
        const ratio = totalCost / eventData.estimatedBudget;
        if (ratio < 0.75) return "Todavía estás dentro de lo planeado 😄";
        if (ratio <= 1.0) return "Casi al límite de tu presupuesto, ¡venís bien! 😎";
        return "Se está yendo un poquito de las manos 😅";
    };

    const handleServiceChange = (serviceId: string, updates: Partial<PlannerService>) => {
        const newServices = eventData.services.map(s => s.id === serviceId ? { ...s, ...updates } : s);
        onChange({ ...eventData, services: newServices });
        
        if (updates.status === 'ready') {
            const msgs = ["¡Buenísimo! Ya resolviste esto 🎉", "😄 Ya llevás bastante adelantado.", "Excelente paso dado 😎", "¡Un pendiente menos! ✨"];
            setCelebrationMessage(msgs[Math.floor(Math.random() * msgs.length)]);
            setTimeout(() => setCelebrationMessage(null), 3000);
        }
    };

    const formatMoney = (amount: number) => {
        let finalAmount = amount;
        if (eventData.includesIva) {
            finalAmount = amount * 1.21;
        }
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(finalAmount);
    };

    const renderServiceBlock = (services: PlannerService[], title: string, subtitle: string, icon: string) => {
        if (services.length === 0) return null;
        
        return (
            <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {icon} {title}
                </h3>
                <p className="text-slate-400 text-sm mb-5">{subtitle}</p>
                
                <div className="space-y-3">
                    {services.map(service => {
                        const isExpanded = expandedServiceId === service.id;
                        
                        return (
                            <div key={service.id} id={`service-${service.id}`} className={`bg-slate-900 border ${isExpanded ? 'border-blue-500/50' : 'border-slate-800'} rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700`}>
                                {/* Header */}
                                <button 
                                    onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors ${
                                            service.status === 'ready' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                            service.status === 'viewing' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                                            'bg-slate-800 border-slate-700 text-slate-500'
                                        }`}>
                                            {service.status === 'ready' ? <CheckCircle2 size={16} /> :
                                             service.status === 'viewing' ? <Clock size={16} /> :
                                             <div className="w-2 h-2 rounded-full bg-slate-500"></div>}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white flex items-center gap-2">
                                                {service.name}
                                            </h4>
                                            {service.status === 'ready' && service.cost > 0 && !isExpanded && (
                                                <p className="text-xs mt-0.5 flex gap-3">
                                                    <span className="text-slate-400">Total: {formatMoney(service.cost)}</span>
                                                    {service.paid ? <span className="text-emerald-400">Abonado: {formatMoney(service.paid)}</span> : null}
                                                    {service.cost > (service.paid || 0) && <span className="text-amber-400">Deuda: {formatMoney(service.cost - (service.paid || 0))}</span>}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-slate-500 flex items-center gap-3">
                                        {service.status === 'ready' && !isExpanded && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md hidden sm:block">¡Listo!</span>}
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </button>

                                {/* Body */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/50 bg-slate-900/50">
                                        
                                        {/* Status Context & Recommendation */}
                                        <div className="mb-5 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
                                            {service.status === 'ready' ? (
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h5 className="text-emerald-400 font-medium text-sm flex items-center gap-2 mb-1">
                                                            <CheckCircle2 size={16} /> Perfecto 🎉
                                                        </h5>
                                                        <p className="text-xs text-slate-400">Ya resolviste una parte importante.</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setActiveVendorModal(service)}
                                                        className="shrink-0 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 rounded-xl transition-colors"
                                                    >
                                                        Comparar otra opción
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h5 className="text-blue-400 font-medium text-sm flex items-center gap-2 mb-1">
                                                            <Lightbulb size={16} /> Idea para tu evento
                                                        </h5>
                                                        <p className="text-xs text-slate-300">
                                                            {service.category === 'Mobiliario' ? `Para ${eventData.guests.length || 50} invitados probablemente necesites entre ${Math.ceil((eventData.guests.length || 50)/10)} y ${Math.ceil((eventData.guests.length || 50)/8)} mesas.` :
                                                             service.category === 'Música' ? "Para la cantidad de invitados, normalmente se usa un sonido mediano." :
                                                             service.category === 'Salón' ? "Definí la fecha junto con el salón para evitar problemas de disponibilidad." :
                                                             service.category === 'Catering' ? (eventData.guests.length <= 40 ? "Para eventos chicos muchas personas suelen resolver comida simple o finger food 🍴" : "Con este número de invitados suele convenir cerrar catering y bebidas temprano 😄") :
                                                             "Revisar opciones con tiempo siempre te ayuda a conseguir mejores acuerdos."}
                                                        </p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setActiveVendorModal(service)}
                                                        className="shrink-0 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl transition-colors shadow-lg"
                                                    >
                                                        Ver opciones
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 mb-5">
                                            {/* Status Buttons */}
                                            <div className="flex bg-slate-950 p-1 rounded-xl w-fit border border-slate-800">
                                                <button 
                                                    onClick={() => handleServiceChange(service.id, { status: 'pending' })}
                                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${service.status === 'pending' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    Pendiente
                                                </button>
                                                <button 
                                                    onClick={() => handleServiceChange(service.id, { status: 'viewing' })}
                                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${service.status === 'viewing' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    Lo estoy viendo
                                                </button>
                                                <button 
                                                    onClick={() => handleServiceChange(service.id, { status: 'ready' })}
                                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${service.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    Ya lo tengo
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Detalle / Notas</label>
                                                <input 
                                                    type="text" 
                                                    value={service.note || ''}
                                                    onChange={(e) => handleServiceChange(service.id, { note: e.target.value })}
                                                    placeholder="Ej: Salón reservado para diciembre..."
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Costo Total</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={service.cost || ''}
                                                        onChange={(e) => handleServiceChange(service.id, { cost: Number(e.target.value) })}
                                                        placeholder="0"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Ya Pagado / Seña</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50">$</span>
                                                    <input 
                                                        type="number" 
                                                        value={service.paid || ''}
                                                        onChange={(e) => handleServiceChange(service.id, { paid: Number(e.target.value) })}
                                                        placeholder="0"
                                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2.5 text-sm text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    const showTools = progress > 25 || eventData.guests.length > 20;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-12 relative">
            
            {/* Celebration Toast */}
            {celebrationMessage && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300">
                    <Sparkles size={20} />
                    <span className="font-medium">{celebrationMessage}</span>
                </div>
            )}

            <div className="max-w-5xl mx-auto mt-4 px-4 sm:px-0">
                
                {/* HEADER & PROGRESS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-2">🎉 Así va tu evento</h2>
                        <p className="text-slate-300 font-medium text-lg mb-1">{getContextualHeader()}</p>
                        <p className="text-slate-500 text-sm">Vas mucho mejor de lo que parece 😉</p>
                        
                        <div className="mt-8 max-w-3xl">
                            <div className="flex justify-between items-end mb-3">
                                <span className="text-sm font-medium text-slate-400">Progreso general estimado</span>
                                <span className="text-2xl font-bold text-white">{progress}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GLOBAL BUDGET BAR (Moved to top) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                💰 Presupuesto Global
                            </h3>
                            <p className="text-sm font-medium text-slate-400">Controla lo que gastas sin estresarte</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Límite Estimado</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                    <input 
                                        type="number" 
                                        value={eventData.estimatedBudget || ''}
                                        onChange={(e) => onChange({ ...eventData, estimatedBudget: Number(e.target.value) })}
                                        placeholder="Ej: 2000000"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-white font-medium focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Costo Total</label>
                                <p className="text-xl font-bold text-white leading-none mt-2">{formatMoney(totalCost)}</p>
                            </div>
                            
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Abonado</label>
                                <p className="text-xl font-bold text-emerald-400 leading-none mt-2">{formatMoney(totalPaid)}</p>
                            </div>
                            
                            <div className="flex-1 min-w-[120px]">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Pendiente</label>
                                <p className="text-xl font-bold text-amber-400 leading-none mt-2">{formatMoney(balance)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 w-full max-w-xl">
                            {eventData.estimatedBudget > 0 ? (
                                <>
                                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                totalCost > eventData.estimatedBudget ? 'bg-red-500' : 
                                                totalCost > eventData.estimatedBudget * 0.8 ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${Math.min((totalCost / eventData.estimatedBudget) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                        <span className="shrink-0">💡</span> {getBudgetMessage()}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 italic">Define tu presupuesto arriba para ver el progreso ☝️</p>
                            )}
                        </div>

                        {/* IVA Toggle */}
                        <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-medium text-slate-400">Mostrar IVA (+21%)</span>
                            <button
                                onClick={() => onChange({ ...eventData, includesIva: !eventData.includesIva })}
                                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ease-in-out ${eventData.includesIva ? 'bg-blue-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out ${eventData.includesIva ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* TWO COLUMNS: CHECKLIST & ASSISTANT/BUDGET */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* LEFT COL: CHECKLIST */}
                    <div className="lg:col-span-2">
                        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                            <p className="text-blue-400 text-sm font-medium flex items-center gap-2">
                                <Lightbulb size={18} /> No hace falta que contrates todo hoy. Avanzá a tu ritmo, nosotros guardamos todo.
                            </p>
                        </div>
                        
                        {renderServiceBlock(imprescindible, "Imprescindible para que la fiesta exista", "Esto suele resolverse primero para que el evento realmente pueda suceder.", "🔴")}
                        
                        {progress > 10 && (
                            <p className="text-center text-sm text-slate-500 italic mb-10">
                                "Muchos descubren que terminan invitando más personas de las que pensaban 😅"
                            </p>
                        )}

                        {renderServiceBlock(muy_importante, "Muy importante", "Muchas personas resuelven esto cuando ya tienen una idea más real de invitados.", "🟡")}
                        {renderServiceBlock(opcional, "Opcional / Experiencia Premium", "Ese toque extra que hace más memorable tu evento 😉", "✨")}
                    </div>

                    {/* RIGHT COL: ASSISTANT */}
                    <div className="space-y-6">
                        
                        {/* ASSISTANT CARD */}
                        {assistantCard && (
                            <div className={`bg-${assistantCard.color}-500/10 border border-${assistantCard.color}-500/20 rounded-3xl p-6 relative overflow-hidden`}>
                                <div className="flex items-center gap-2 mb-3">
                                    {assistantCard.icon}
                                    <h3 className={`text-sm font-bold text-${assistantCard.color}-400 uppercase tracking-wider`}>
                                        {assistantCard.title}
                                    </h3>
                                </div>
                                <p className="text-slate-200 text-sm mb-4 leading-relaxed">
                                    {assistantCard.text}
                                </p>
                                {assistantCard.action && (
                                    <button 
                                        onClick={assistantCard.onClick || undefined}
                                        className={`bg-${assistantCard.color}-500 hover:bg-${assistantCard.color}-400 text-white text-xs font-bold py-2 px-4 rounded-xl transition-colors`}
                                    >
                                        {assistantCard.action}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* DIGITAL EXTRAS SECTION MOVED HERE */}

                    </div>
                </div>

                {/* SECCIÓN PREMIUM EVENTPIX */}
                {false && showTools && (
                    <div className="mt-20 border-t border-slate-800 pt-16">
                        <div className="text-center max-w-2xl mx-auto mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400 font-medium text-sm mb-6">
                                <Sparkles size={16} /> Premium EventPix
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">
                                Simplificá tu evento con EventPix Premium
                            </h2>
                            <p className="text-slate-400 text-lg">
                                Cuando tu evento empieza a tomar forma, estas herramientas hacen todo mucho más simple.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            
                            {/* Card 1 */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full shadow-lg shadow-black/50">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-colors"></div>
                                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Smartphone size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Invitación Digital EventPix</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    "Tus invitados confirman asistencia sin cadenas eternas de WhatsApp."
                                </p>
                                <ul className="space-y-2 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-blue-500" /> Confirmación automática</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-blue-500" /> Ubicación del evento</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-blue-500" /> Cuenta regresiva</li>
                                </ul>
                                <div className="space-y-3 mt-auto">
                                    {hasInvitation ? (
                                        <button 
                                            onClick={() => onNavigateToPro && onNavigateToPro()}
                                            className="block text-center w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                                        >
                                            Configurar
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setIsPremiumModalOpen(true)}
                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                                        >
                                            Agregar a mi evento
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => window.open('/invitacion/preview', '_blank')}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                                    >
                                        Ver ejemplo
                                    </button>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-emerald-500/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full shadow-lg shadow-black/50">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
                                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                    <MonitorPlay size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Recepcionista Virtual</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    "El día del evento evitá caos en el ingreso."
                                </p>
                                <ul className="space-y-2 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-emerald-500" /> Lista automática</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-emerald-500" /> Confirmados en tiempo real</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-emerald-500" /> Menos demoras</li>
                                </ul>
                                {hasVipAccess ? (
                                    <button 
                                        onClick={() => onNavigateToPro && onNavigateToPro()}
                                        className="block text-center mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        Configurar
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsPremiumModalOpen(true)}
                                        className="mt-auto w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl transition-colors"
                                    >
                                        Adquirir Ingreso VIP
                                    </button>
                                )}
                            </div>

                            {/* Card 3 */}
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-300 group relative overflow-hidden flex flex-col h-full shadow-lg shadow-black/50">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-colors"></div>
                                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                    <Camera size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">EventPix / Espejo Mágico</h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    "Un recuerdo divertido e interactivo para tus invitados."
                                </p>
                                <ul className="space-y-2 mb-8 flex-1">
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-purple-500" /> Fotos instantáneas</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-purple-500" /> Experiencia divertida</li>
                                    <li className="flex items-center gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-purple-500" /> Contenido compartible</li>
                                </ul>
                                {isPremium && eventData.cloudEventId ? (
                                    <Link 
                                        to={`/admin/event/${eventData.cloudEventId}`}
                                        className="block text-center mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
                                    >
                                        Configurar
                                    </Link>
                                ) : (
                                    <button 
                                        onClick={() => setIsPremiumModalOpen(true)}
                                        className="mt-auto w-full bg-slate-800 hover:bg-purple-600 text-white font-medium py-3 rounded-xl transition-colors"
                                    >
                                        Ver demo
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* SAVE PROGRESS BANNER */}
                {!isLoggedIn && (
                    <div className="mt-16 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 rounded-3xl p-8 text-center max-w-2xl mx-auto">
                        <h3 className="text-2xl font-bold text-white mb-2">🎉 Guardemos tu progreso</h3>
                        <p className="text-blue-200/70 mb-6">Ya empezaste a organizar tu evento. No pierdas todo tu avance ni tu presupuesto armado.</p>
                        <button 
                            onClick={onSaveRequest}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-8 rounded-xl transition-colors shadow-lg"
                        >
                            Continuar con email
                        </button>
                        <p className="text-xs text-blue-200/50 mt-4">Así podés seguir organizando tu fiesta desde cualquier lugar.</p>
                    </div>
                )}
            </div>

            {/* VENDOR PROPOSAL MODAL */}
            {activeVendorModal && (
                <VendorProposalModal 
                    isOpen={true} 
                    onClose={() => setActiveVendorModal(null)} 
                    service={activeVendorModal}
                    eventData={eventData}
                />
            )}
            {/* PREMIUM UPGRADE MODAL */}
            <PremiumUpgradeModal
                isOpen={isPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                onSuccess={() => {
                    setIsPremiumModalOpen(false);
                    
                    // Mark premium services as ready
                    const updatedServices = eventData.services.map(s => {
                        if (s.group === 'eventpix_premium') {
                            return { ...s, status: 'ready' as const };
                        }
                        return s;
                    });
                    
                    onChange({
                        ...eventData,
                        services: updatedServices
                    });
                }}
            />
        </div>
    );
}
