import { Users, LayoutGrid, Star, ArrowRight } from 'lucide-react';
import { EventData } from '../types';

interface NextStepCardProps {
    eventData: EventData;
    onAction: (tab: 'list' | 'kanban' | 'my_event') => void;
}

// Un solo mensaje para guiar al cliente: qué conviene hacer ahora.
export default function NextStepCard({ eventData, onAction }: NextStepCardProps) {
    const guests = eventData.guests.length;
    const unseated = eventData.guests.filter(g => !g.table_id).length;

    let text: string;
    let button: string;
    let icon = <Users size={16} />;
    let target: 'list' | 'kanban' | 'my_event' = 'list';

    if (guests === 0) {
        text = 'Empezá por tu lista: agregá invitados uno por uno o subí tu Excel.';
        button = '';
    } else if (eventData.tables.length === 0 || unseated > 0) {
        text = eventData.tables.length === 0
            ? `Ya tenés ${guests} invitados. Próximo paso: armar las mesas.`
            : `Quedan ${unseated} invitado${unseated !== 1 ? 's' : ''} sin mesa.`;
        button = 'Ir a Mesas';
        icon = <LayoutGrid size={16} />;
        target = 'kanban';
    } else {
        text = '¡Lista y mesas listas! Ahora revisá los servicios de tu fiesta.';
        button = 'Ir a Mi Evento';
        icon = <Star size={16} />;
        target = 'my_event';
    }

    return (
        <div className="px-4 md:px-6 pt-4 md:pt-2 bg-slate-950">
            <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
                <p className="text-sm text-slate-300">
                    <span className="font-bold text-blue-400 mr-1">Próximo paso:</span> {text}
                </p>
                {button && (
                    <button
                        onClick={() => onAction(target)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                    >
                        {icon} <span className="hidden sm:inline">{button}</span> <ArrowRight size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}
