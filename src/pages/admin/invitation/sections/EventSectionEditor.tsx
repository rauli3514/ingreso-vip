import { InvitationData } from '../../../../types';

interface Props {
    sectionKey: 'ceremony_section' | 'party_section';
    title: string;
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function EventSectionEditor({ sectionKey, title, invitation, onChange }: Props) {
    const sectionData = invitation[sectionKey] || { show: true };

    const updateSection = (updates: any) => {
        onChange({
            [sectionKey]: {
                ...sectionData,
                ...updates
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        <p className="text-sm text-slate-500">Configura los detalles de la {title.toLowerCase()}.</p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={sectionData.show ?? true}
                                onChange={(e) => updateSection({ show: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            <span className="ml-3 text-sm font-medium text-slate-900">
                                {sectionData.show ? 'Visible' : 'Oculto'}
                            </span>
                        </label>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300 ${!sectionData.show ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                    {/* Left Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Sección</label>
                            <input
                                type="text"
                                value={sectionData.title || ''}
                                onChange={(e) => updateSection({ title: e.target.value })}
                                placeholder={`Ej: ${title}`}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Lugar</label>
                            <input
                                type="text"
                                value={sectionData.location_name || ''}
                                onChange={(e) => updateSection({ location_name: e.target.value })}
                                placeholder="Ej: Parroquia San José / Salón Los Olivos"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Exacta</label>
                            <input
                                type="text"
                                value={sectionData.address || ''}
                                onChange={(e) => updateSection({ address: e.target.value })}
                                placeholder="Ej: Av. Libertador 1234, Ciudad"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y Hora</label>
                            <input
                                type="datetime-local"
                                value={sectionData.start_time || ''}
                                onChange={(e) => updateSection({ start_time: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link de Google Maps</label>
                            <input
                                type="text"
                                value={sectionData.map_url || ''}
                                onChange={(e) => updateSection({ map_url: e.target.value })}
                                placeholder="Pegar enlace de Google Maps aquí"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                            <p className="text-xs text-slate-400 mt-1">Se usará para el botón "Ver Ubicación".</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nota o Descripción (Opcional)</label>
                            <textarea
                                value={sectionData.description || ''}
                                onChange={(e) => updateSection({ description: e.target.value })}
                                rows={3}
                                placeholder="Ej: Traje formal, solo adultos, etc."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
