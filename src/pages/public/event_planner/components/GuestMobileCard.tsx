import React from 'react';
import { Edit, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { PlannerGuest } from '../types';

interface GuestMobileCardProps {
    guest: PlannerGuest;
    tableName: string;
    onEdit: (guest: PlannerGuest) => void;
    onDelete: (guestId: string) => void;
}

export default function GuestMobileCard({ guest, tableName, onEdit, onDelete }: GuestMobileCardProps) {
    const isConfirmed = guest.status === 'confirmed';

    return (
        <div className="md:hidden bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-3 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${isConfirmed ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
            
            <div className="pl-2 flex justify-between items-start mb-3">
                <div className="flex-1 pr-2">
                    <h4 className="text-white font-bold text-lg mb-1 truncate">{guest.display_name}</h4>
                    {guest.group && (
                        <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs font-medium mb-2 border border-slate-700">
                            {guest.group}
                        </span>
                    )}
                </div>
                
                <div className="flex gap-1">
                    <button 
                        onClick={() => onEdit(guest)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-colors active:bg-blue-500/20"
                    >
                        <Edit size={18} />
                    </button>
                    <button 
                        onClick={() => {
                            if(window.confirm('¿Eliminar invitado?')) {
                                onDelete(guest.id);
                            }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors active:bg-rose-500/20"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
            
            <div className="pl-2 grid grid-cols-2 gap-3 mt-2 pt-3 border-t border-slate-800">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Mesa</span>
                    <span className="text-sm font-medium text-slate-300 truncate">{tableName || 'Sin asignar'}</span>
                </div>
                
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Estado</span>
                    <div className={`flex items-center gap-1.5 text-sm font-medium ${isConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isConfirmed ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {isConfirmed ? 'Confirmado' : 'Pendiente'}
                    </div>
                </div>
                
                {guest.note && (
                    <div className="col-span-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1 block">Nota</span>
                        <p className="text-sm text-slate-400 italic bg-slate-950 p-2 rounded-lg border border-slate-800/50">"{guest.note}"</p>
                    </div>
                )}
            </div>
        </div>
    );
}
