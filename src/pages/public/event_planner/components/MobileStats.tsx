import React from 'react';
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

    return (
        <div className="md:hidden px-4 py-6 bg-slate-950">
            <div className="grid grid-cols-2 gap-3">
                {/* Total Guests */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-2 mb-1.5 z-10">
                        <Users size={14} className="text-blue-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Invitados</span>
                    </div>
                    <div className="text-3xl font-bold text-white z-10">{totalGuests}</div>
                </div>

                {/* Confirmed Guests */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-2 mb-1.5 z-10">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Confirmados</span>
                    </div>
                    <div className="text-3xl font-bold text-white z-10">{confirmedGuests}</div>
                </div>

                {/* Pending Guests */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-2 mb-1.5 z-10">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pendientes</span>
                    </div>
                    <div className="text-3xl font-bold text-white z-10">{pendingGuests}</div>
                </div>

                {/* Tables */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-purple-500/5 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-2 mb-1.5 z-10">
                        <LayoutGrid size={14} className="text-purple-400" />
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mesas</span>
                    </div>
                    <div className="text-3xl font-bold text-white z-10">{totalTables}</div>
                </div>
            </div>
        </div>
    );
}
