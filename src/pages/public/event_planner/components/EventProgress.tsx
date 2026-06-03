import React from 'react';
import { EventData } from '../types';

interface EventProgressProps {
    eventData: EventData;
}

export default function EventProgress({ eventData }: EventProgressProps) {
    const hasGuests = eventData.guests.length > 0;
    const hasTables = eventData.tables.length > 0;
    const hasSalon = eventData.services.some(s => s.category.includes('Salón') && s.status === 'ready');
    const hasCatering = eventData.services.some(s => s.category.includes('Catering') && s.status === 'ready');
    const hasDJ = eventData.services.some(s => s.category.includes('Música') && s.status === 'ready');
    const hasBebidas = eventData.services.some(s => s.category.includes('Bebidas') && s.status === 'ready');
    const hasDeco = eventData.services.some(s => s.category.includes('Decoración') && s.status === 'ready');
    const hasFoto = eventData.services.some(s => s.category.includes('Fotografía') && s.status === 'ready');

    const checklist = [
        { label: 'Invitados', done: hasGuests, icon: '👥' },
        { label: 'Mesas', done: hasTables, icon: '🪑' },
        { label: 'Salón', done: hasSalon, icon: '🏠' },
        { label: 'Catering', done: hasCatering, icon: '🍽️' },
        { label: 'Bebidas', done: hasBebidas, icon: '🥤' },
        { label: 'DJ / Música', done: hasDJ, icon: '🎧' },
        { label: 'Decoración', done: hasDeco, icon: '🎨' },
        { label: 'Foto/Video', done: hasFoto, icon: '📸' }
    ];

    const completedCount = checklist.filter(item => item.done).length;
    const percentage = Math.round((completedCount / checklist.length) * 100);

    return (
        <div className="md:hidden px-4 pb-6 bg-slate-950">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    🎉 Así va tu evento
                </h3>

                <div className="mb-5">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-medium">Progreso general</span>
                        <span className="text-blue-400 font-bold text-xl">{percentage}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000 ease-out rounded-full"
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                    {percentage > 0 && (
                        <p className="text-slate-400 text-xs mt-2 italic">
                            ¡Ya organizaste el {percentage}% de tu fiesta! 😄
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                    {checklist.map((item, idx) => (
                        <div key={idx} className={`flex items-center gap-2 ${item.done ? 'opacity-100' : 'opacity-40 grayscale'} transition-all`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.done ? 'bg-emerald-500/20 text-emerald-400' : 'border border-slate-700 text-transparent'}`}>
                                {item.done && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <span className="text-sm text-slate-200 truncate" title={item.label}>
                                {item.icon} {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
