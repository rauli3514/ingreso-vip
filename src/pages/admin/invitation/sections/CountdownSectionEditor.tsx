import React from 'react';
import { InvitationData } from '../../../../types';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function CountdownSectionEditor({ invitation, onChange }: Props) {

    const updateSection = (updates: any) => {
        onChange({
            countdown_section: {
                ...invitation.countdown_section,
                ...updates
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Cuenta Regresiva</h3>
                        <p className="text-sm text-slate-500">Muestra un contador de días, horas y minutos.</p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={invitation.countdown_section?.show ?? true}
                                onChange={(e) => updateSection({ show: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-900">
                                {invitation.countdown_section?.show ? 'Visible' : 'Oculto'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className={`space-y-4 transition-all duration-300 ${!invitation.countdown_section?.show ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Sección</label>
                        <input
                            type="text"
                            value={invitation.countdown_section?.title || ''}
                            onChange={(e) => updateSection({ title: e.target.value })}
                            placeholder="Ej: Solo faltan..."
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y Hora del Evento</label>
                        <input
                            type="datetime-local"
                            value={invitation.countdown_section?.target_date || ''}
                            onChange={(e) => updateSection({ target_date: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">El contador llegará a cero en esta fecha exacta.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Frase debajo de la fecha</label>
                        <input
                            type="text"
                            value={(invitation.countdown_section as any)?.subtitle || ''}
                            onChange={(e) => updateSection({ subtitle: e.target.value })}
                            placeholder="Ej: Será un día inolvidable"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Aparecerá centrada debajo de la cuenta regresiva.</p>
                    </div>
                </div>
            </div>

            {/* Preview Banner */}
            <div className={`p-4 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center gap-3 ${!invitation.countdown_section?.show ? 'hidden' : ''}`}>
                <div className="p-2 bg-white rounded-full shadow-sm text-indigo-600">
                    ⏱️
                </div>
                <div>
                    <p className="text-sm text-indigo-900 font-medium">Recomendación</p>
                    <p className="text-xs text-indigo-700">Asegúrate de que la fecha coincida con la de la sección "Ceremonia".</p>
                </div>
            </div>
        </div>
    );
}
