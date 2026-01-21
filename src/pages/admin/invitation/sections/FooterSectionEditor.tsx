import { InvitationData } from '../../../../types';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function FooterSectionEditor({ invitation, onChange }: Props) {
    const sectionData = (invitation as any).footer_section || {
        show: true,
        show_branding: true,
        links: {
            confirm_ceremony: true,
            confirm_party: true,
            suggest_song: true,
            calendar_ceremony: true,
            calendar_party: true
        }
    };

    const updateSection = (updates: any) => {
        onChange({
            ['footer_section' as any]: {
                ...sectionData,
                ...updates
            }
        });
    };

    const updateLink = (key: string, value: boolean) => {
        updateSection({
            links: {
                ...sectionData.links,
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Pie de Página y Confirmación</h3>
                        <p className="text-sm text-slate-500">Menú final con accesos directos y formularios de asistencia.</p>
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
                        </label>
                    </div>
                </div>

                <div className={`space-y-6 transition-all duration-300 ${!sectionData.show ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* 1. Branding */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-medium text-slate-900 mb-3">Estilo</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">Mostrar Nombres (Logo) al final</span>
                                <input
                                    type="checkbox"
                                    checked={sectionData.show_branding ?? true}
                                    onChange={(e) => updateSection({ show_branding: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Se usarán los nombres definidos en la sección "General".</p>
                        </div>

                        {/* 2. Enlaces Visibles */}
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <h4 className="font-medium text-slate-900 mb-3">Enlaces Visibles</h4>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Confirmar Asistencia a Ceremonia</span>
                                    <input type="checkbox" checked={sectionData.links?.confirm_ceremony ?? true} onChange={(e) => updateLink('confirm_ceremony', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Confirmar Asistencia a Fiesta</span>
                                    <input type="checkbox" checked={sectionData.links?.confirm_party ?? true} onChange={(e) => updateLink('confirm_party', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                </label>
                                <hr className="border-slate-200" />
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Sugerir Canción</span>
                                    <input type="checkbox" checked={sectionData.links?.suggest_song ?? true} onChange={(e) => updateLink('suggest_song', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                </label>
                                <hr className="border-slate-200" />
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Agendar Ceremonia (Calendar)</span>
                                    <input type="checkbox" checked={sectionData.links?.calendar_ceremony ?? true} onChange={(e) => updateLink('calendar_ceremony', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                </label>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm text-slate-700">Agendar Fiesta (Calendar)</span>
                                    <input type="checkbox" checked={sectionData.links?.calendar_party ?? true} onChange={(e) => updateLink('calendar_party', e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                                </label>
                            </div>
                        </div>

                    </div>

                    <div className="p-4 bg-indigo-50 text-indigo-800 text-sm rounded-lg flex gap-3 items-start border border-indigo-100">
                        <span className="text-lg">ℹ️</span>
                        <div>
                            <strong>Nota sobre Confirmación:</strong>
                            <p className="mt-1 text-xs text-indigo-700">
                                Al hacer clic en "Confirmar", se abrirá un formulario emergente donde el invitado podrá ingresar su nombre, un mensaje y confirmar sí/no.
                                <br />Esta información llegará al <strong>Email de Notificaciones</strong> configurado en la pestaña "Detalles".
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
