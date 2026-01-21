import { InvitationData } from '../../../../types';
import { Mail, Shirt, ClipboardList, Music } from 'lucide-react';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function ExtraInfoSectionEditor({ invitation, onChange }: Props) {
    // Definimos estructura perezosa para no chocar con types estrictos por ahora
    const sectionData = (invitation as any).extra_info_section || {
        show: true,
        title: 'Más Detalles',
        subtitle: 'Información útil para tener en cuenta',
        notification_email: '',
        blocks: {
            music: { show: true, title: 'Música' },
            dress_code: { show: true, title: 'Dress Code', content: '' },
            tips: { show: true, title: 'Tips y Notas', content: '' }
        }
    };

    const updateSection = (updates: any) => {
        onChange({
            ['extra_info_section' as any]: {
                ...sectionData,
                ...updates
            }
        });
    };

    const updateBlock = (blockKey: string, blockUpdates: any) => {
        updateSection({
            blocks: {
                ...sectionData.blocks,
                [blockKey]: {
                    ...sectionData.blocks[blockKey],
                    ...blockUpdates
                }
            }
        });
    };

    // Helper seguro para acceder a bloques anidados
    const musicBlock = sectionData.blocks?.music || { show: true, title: 'Música' };
    const dressBlock = sectionData.blocks?.dress_code || { show: true, title: 'Dress Code', content: '' };
    const tipsBlock = sectionData.blocks?.tips || { show: true, title: 'Tips y Notas', content: '' };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {/* Header Global de la Sección */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Más Detalles (Dress Code, Tips, Música)</h3>
                        <p className="text-sm text-slate-500">Configura los bloques informativos y notificaciones.</p>
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

                <div className={`space-y-8 transition-all duration-300 ${!sectionData.show ? 'opacity-50 pointer-events-none grayscale' : ''}`}>

                    {/* 1. CONFIGURACIÓN DE CORREO (CRÍTICO) */}
                    <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-indigo-600 mt-1" />
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-indigo-900 mb-1">Email para Notificaciones</label>
                                <p className="text-xs text-indigo-700 mb-2">Aquí recibirás las sugerencias de canciones y las confirmaciones de asistencia.</p>
                                <input
                                    type="email"
                                    value={sectionData.notification_email || ''}
                                    onChange={(e) => updateSection({ notification_email: e.target.value })}
                                    placeholder="tunombre@email.com"
                                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-md text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Títulos Principales de la Sección */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título General</label>
                            <input type="text" value={sectionData.title || 'Fiesta'} onChange={(e) => updateSection({ title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo</label>
                            <input type="text" value={sectionData.subtitle || ''} onChange={(e) => updateSection({ subtitle: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none text-sm" />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* BLOQUES INFORMACIÓN */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Bloque: MÚSICA */}
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-3 text-slate-700">
                                <Music size={18} />
                                <span className="font-semibold text-sm">1. Música</span>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={musicBlock.title}
                                    onChange={(e) => updateBlock('music', { title: e.target.value })}
                                    placeholder="Título (ej: Música)"
                                    className="w-full text-xs px-2 py-1.5 border rounded text-slate-900 bg-white"
                                />
                                <p className="text-xs text-slate-500 italic">
                                    Este bloque mostrará un botón "Sugerir Canción". Al hacer click, el invitado llenará un formulario que llegará a tu email configurado arriba.
                                </p>
                            </div>
                        </div>

                        {/* Bloque: DRESS CODE */}
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-3 text-slate-700">
                                <Shirt size={18} />
                                <span className="font-semibold text-sm">2. Dress Code</span>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={dressBlock.title}
                                    onChange={(e) => updateBlock('dress_code', { title: e.target.value })}
                                    placeholder="Título (ej: Dress Code)"
                                    className="w-full text-xs px-2 py-1.5 border rounded text-slate-900 bg-white"
                                />
                                <textarea
                                    rows={4}
                                    value={dressBlock.content}
                                    onChange={(e) => updateBlock('dress_code', { content: e.target.value })}
                                    placeholder="Ej: Formal, Sport Elegante, De blanco..."
                                    className="w-full text-xs px-2 py-1.5 border rounded resize-none text-slate-900 bg-white"
                                />
                            </div>
                        </div>

                        {/* Bloque: TIPS Y NOTAS */}
                        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex items-center gap-2 mb-3 text-slate-700">
                                <ClipboardList size={18} />
                                <span className="font-semibold text-sm">3. Tips y Notas</span>
                            </div>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={tipsBlock.title}
                                    onChange={(e) => updateBlock('tips', { title: e.target.value })}
                                    placeholder="Título (ej: Tips y Notas)"
                                    className="w-full text-xs px-2 py-1.5 border rounded text-slate-900 bg-white"
                                />
                                <textarea
                                    rows={4}
                                    value={tipsBlock.content}
                                    onChange={(e) => updateBlock('tips', { content: e.target.value })}
                                    placeholder="Ej: Solo adultos, estacionamiento gratuito..."
                                    className="w-full text-xs px-2 py-1.5 border rounded resize-none text-slate-900 bg-white"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
