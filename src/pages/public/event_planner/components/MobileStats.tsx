import { Users, CheckCircle2, Clock, LayoutGrid } from 'lucide-react';
import { EventData } from '../types';

interface MobileStatsProps {
    eventData: EventData;
}

export default function MobileStats({ eventData }: MobileStatsProps) {
    const totalGuests = eventData.guests.length;
    const confirmedGuests = eventData.guests.filter(g => g.status === 'confirmed').length;
    const pendingGuests = totalGuests - confirmedGuests;
    const totalTables = eventData.tables.length;

    const items = [
        { label: 'Invitados', value: totalGuests, icon: <Users size={14} className="text-blue-400" /> },
        { label: 'Confirmados', value: confirmedGuests, icon: <CheckCircle2 size={14} className="text-emerald-400" /> },
        { label: 'Pendientes', value: pendingGuests, icon: <Clock size={14} className="text-slate-400" /> },
        { label: 'Mesas', value: totalTables, icon: <LayoutGrid size={14} className="text-slate-400" /> },
    ];

    // Compacto (una fila) para que la lista de invitados quede cerca del principio.
    return (
        <div className="md:hidden px-4 pt-4 bg-slate-950">
            <div className="grid grid-cols-4 gap-2">
                {items.map(item => (
                    <div key={item.label} className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-2.5 text-center">
                        <div className="flex justify-center mb-1">{item.icon}</div>
                        <div className="text-xl font-bold text-white leading-none">{item.value}</div>
                        <div className="text-[10px] text-slate-500 mt-1 truncate">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
