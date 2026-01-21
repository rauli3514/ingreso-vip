import React, { useState } from 'react';
import { InvitationData } from '../../../../types';
import { supabase } from '../../../../lib/supabase';
import { Loader2, Upload, Instagram, Camera, Link as LinkIcon } from 'lucide-react';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function SocialSectionEditor({ invitation, onChange }: Props) {
    const [uploading, setUploading] = useState(false);

    // Estructura de datos para la sección social
    const sectionData = (invitation as any).social_section || {
        show: true,
        title: 'Compartimos este día junto a vos',
        subtitle: 'Compartí tus fotos y videos de ese hermoso día',
        hashtag: '#NuestraBoda',
        background_url: '',
        buttons: [
            { id: 'btn1', label: 'VER EN INSTAGRAM', url: '', icon: 'instagram', show: true },
            { id: 'btn2', label: 'SUBIR A EVENTPIX', url: '', icon: 'camera', show: false }
        ]
    };

    const updateSection = (updates: any) => {
        onChange({
            ['social_section' as any]: {
                ...sectionData,
                ...updates
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${invitation.event_id}/social-bg-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('invitations')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('invitations')
                .getPublicUrl(filePath);

            updateSection({ background_url: publicUrl });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const updateButton = (index: number, updates: any) => {
        const newButtons = [...(sectionData.buttons || [])];
        if (!newButtons[index]) return;
        newButtons[index] = { ...newButtons[index], ...updates };
        updateSection({ buttons: newButtons });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Redes Sociales y Fotos</h3>
                        <p className="text-sm text-slate-500">Configura el hashtag y enlaces para compartir fotos.</p>
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

                    {/* 1. Fondo e Info Básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Carga de Imagen de Fondo */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Imagen de Fondo</label>
                            <label className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer overflow-hidden group
                                ${sectionData.background_url ? 'border-indigo-300' : 'border-slate-300 hover:bg-slate-50'}`}>

                                {sectionData.background_url ? (
                                    <>
                                        <img src={sectionData.background_url} className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white text-sm font-medium flex items-center gap-2">
                                                <Upload size={16} /> Cambiar Fondo
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        {uploading ? <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" /> : <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />}
                                        <p className="text-sm font-medium text-slate-600">Subir Imagen de Fondo</p>
                                    </div>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                            <p className="text-xs text-slate-400 mt-2">Esta imagen se mostrará detrás del texto (efecto parallax opcional).</p>
                        </div>

                        {/* Textos y Hashtag */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                                <input type="text" value={sectionData.title} onChange={(e) => updateSection({ title: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo</label>
                                <input type="text" value={sectionData.subtitle} onChange={(e) => updateSection({ subtitle: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-indigo-900 mb-1">Hashtag (#)</label>
                                <input type="text" value={sectionData.hashtag} onChange={(e) => updateSection({ hashtag: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border border-indigo-200 rounded-lg text-slate-900 text-lg font-bold outline-none" placeholder="#NuestraBoda" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 2. Botones de Acción */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-4">Botones de Acción</h4>

                        <div className="space-y-4">
                            {/* Botón 1: Instagram (por defecto) */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <Instagram size={18} />
                                        <span>Botón 1 (Instagram)</span>
                                    </div>
                                    <input type="checkbox" checked={sectionData.buttons[0]?.show} onChange={(e) => updateButton(0, { show: e.target.checked })} className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={sectionData.buttons[0]?.label} onChange={(e) => updateButton(0, { label: e.target.value })} placeholder="Texto del botón" className="w-full text-sm px-3 py-2 border rounded text-slate-900 bg-white" />
                                    <input type="text" value={sectionData.buttons[0]?.url} onChange={(e) => updateButton(0, { url: e.target.value })} placeholder="URL de Instagram" className="w-full text-sm px-3 py-2 border rounded text-slate-900 bg-white" />
                                </div>
                            </div>

                            {/* Botón 2: EventPix (por defecto) */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2 font-medium text-slate-700">
                                        <Camera size={18} />
                                        <span>Botón 2 (EventPix / Web Externa)</span>
                                    </div>
                                    <input type="checkbox" checked={sectionData.buttons[1]?.show} onChange={(e) => updateButton(1, { show: e.target.checked })} className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={sectionData.buttons[1]?.label} onChange={(e) => updateButton(1, { label: e.target.value })} placeholder="Texto (ej: SUBIR A EVENTPIX)" className="w-full text-sm px-3 py-2 border rounded text-slate-900 bg-white" />
                                    <input type="text" value={sectionData.buttons[1]?.url} onChange={(e) => updateButton(1, { url: e.target.value })} placeholder="Link de EventPix" className="w-full text-sm px-3 py-2 border rounded text-slate-900 bg-white" />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Usa este botón para linkear a tu álbum de EventPix o cualquier otra plataforma.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
