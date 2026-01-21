import { InvitationData } from '../../../../types';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function GiftsSectionEditor({ invitation, onChange }: Props) {
    // Cast to any to access gifts_section safely if not in types
    const sectionData = (invitation as any).gifts_section || {
        show: true,
        title: 'Regalos',
        subtitle: 'Si deseas regalarnos algo más que tu hermosa presencia...',
        content: ''
    };

    const updateSection = (updates: any) => {
        onChange({
            ['gifts_section' as any]: {
                ...sectionData,
                ...updates
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Sección de Regalos</h3>
                        <p className="text-sm text-slate-500">Configura la información para recibir presentes.</p>
                    </div>

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

                {/* Content */}
                <div className={`space-y-6 transition-all duration-300 ${!sectionData.show ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Sección</label>
                                <input
                                    type="text"
                                    value={sectionData.title || ''}
                                    onChange={(e) => updateSection({ title: e.target.value })}
                                    placeholder="Ej: Regalos"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo / Frase</label>
                                <textarea
                                    rows={3}
                                    value={sectionData.subtitle || ''}
                                    onChange={(e) => updateSection({ subtitle: e.target.value })}
                                    placeholder="Ej: Si deseas regalarnos algo más que tu hermosa presencia..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Contenido del Modal (Datos Bancarios)</label>
                                <textarea
                                    rows={6}
                                    value={sectionData.content || ''}
                                    onChange={(e) => updateSection({ content: e.target.value })}
                                    placeholder="Ej:\nCBU: 0000000000\nAlias: mi.alias.banco\nTitular: Juan Perez\n\nO dirección para envío de presentes."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono leading-relaxed"
                                />
                                <p className="text-xs text-slate-400 mt-2">Esta información se mostrará solo cuando el invitado haga clic en "Ver Más".</p>
                            </div>
                        </div>
                    </div>

                    {/* Preview Hint */}
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                        <div className="text-slate-400 mt-0.5">🎁</div>
                        <div className="text-xs text-slate-500">
                            <strong>Nota:</strong> En la invitación final, aparecerá un icono de regalo. Al hacer clic, se abrirá una ventana emergente con la información que escribiste en "Contenido del Modal".
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
