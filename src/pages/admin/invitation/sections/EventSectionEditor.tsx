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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    let updates: any = { map_url: val };

                                    // Try to extract coordinates from URL
                                    // Priorities:
                                    // 1. Specific Pin Location (!3d...!4d) - Most accurate
                                    // 2. Query Coordinates (q=...)
                                    // 3. Viewport Center (@...) - Least accurate (can be blocks away)

                                    const pinMatch = val.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                                    const queryMatch = val.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                                    const viewportMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

                                    const latLngMatch = pinMatch || queryMatch || viewportMatch;

                                    if (latLngMatch) {
                                        updates.lat = latLngMatch[1];
                                        updates.lng = latLngMatch[2];
                                    }

                                    updateSection(updates);
                                }}
                                placeholder="Pegar enlace de Google Maps aquí"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                            <p className="text-xs text-slate-400 mt-1">
                                Se usará para el botón "Ver Ubicación".
                                <span className="text-indigo-500 ml-1">
                                    (Si pegas el link largo de la barra de direcciones, intentaremos extraer las coordenadas automáticamente).
                                </span>
                            </p>
                        </div>

                        {/* GPS Coordinates Manual Override */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span>📍 Coordenadas Exactas</span>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${sectionData.lat},${sectionData.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`text-[10px] bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50 ${(!sectionData.lat || !sectionData.lng) ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    Probar en Maps
                                </a>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Latitud</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={sectionData.lat || ''}
                                        onChange={(e) => updateSection({ lat: e.target.value })}
                                        placeholder="-34.6037"
                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-slate-500 mb-1">Longitud</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={sectionData.lng || ''}
                                        onChange={(e) => updateSection({ lng: e.target.value })}
                                        placeholder="-58.3816"
                                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none text-xs font-mono"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                                Estos números controlan a dónde lleva el botón de <b>Uber/Waze</b>. <br />
                                <span className="italic">Haz click derecho en Google Maps sobre el lugar exacto para ver y copiar estos números.</span>
                            </p>
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
