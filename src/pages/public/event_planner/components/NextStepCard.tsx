import React from 'react';
import { Users, LayoutGrid, Star, ArrowRight } from 'lucide-react';
import { EventData } from '../types';

interface NextStepCardProps {
    eventData: EventData;
    onAction: (tab: 'list' | 'kanban' | 'my_event') => void;
}

export default function NextStepCard({ eventData, onAction }: NextStepCardProps) {
    const hasGuests = eventData.guests.length > 0;
    const hasTables = eventData.tables.length > 0;
    
    let title = "";
    let description = "";
    let buttonText = "";
    let buttonIcon = null;
    let targetTab: 'list' | 'kanban' | 'my_event' = 'list';
    let gradient = "";

    if (!hasGuests) {
        title = "Agregar invitados";
        description = "Todo buen evento empieza por la gente. Agregá al menos un par de invitados para empezar.";
        buttonText = "Ir a Invitados";
        buttonIcon = <Users size={18} />;
        targetTab = 'list';
        gradient = "from-blue-600 to-blue-800";
    } else if (!hasTables) {
        title = "Organizar mesas";
        description = "Ya cargaste invitados. Ahora podrías empezar a distribuirlos en las mesas para evitar caos ese día.";
        buttonText = "Ir a Mesas";
        buttonIcon = <LayoutGrid size={18} />;
        targetTab = 'kanban';
        gradient = "from-purple-600 to-purple-800";
    } else {
        title = "Controlar Servicios";
        description = "Ya tenés invitados y mesas armadas. Asegurate de tener cubiertos los servicios esenciales.";
        buttonText = "Ir a Mi Evento";
        buttonIcon = <Star size={18} />;
        targetTab = 'my_event';
        gradient = "from-amber-500 to-orange-600";
    }

    return (
        <div className="md:hidden px-4 pb-6 bg-slate-950">
            <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-b from-slate-700 to-slate-900 shadow-lg shadow-black/50">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${gradient} blur-3xl`}></div>
                </div>
                
                <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-5 relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md tracking-wide uppercase border border-slate-700 shadow-inner">
                            🎯 Próximo paso
                        </span>
                    </div>
                    
                    <h4 className="text-white font-bold text-xl mb-2">{title}</h4>
                    <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                        {description}
                    </p>
                    
                    <button 
                        onClick={() => onAction(targetTab)}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all bg-gradient-to-r ${gradient} shadow-lg active:scale-[0.98]`}
                    >
                        {buttonIcon}
                        {buttonText}
                        <ArrowRight size={18} className="ml-1" />
                    </button>
                </div>
            </div>
        </div>
    );
}
