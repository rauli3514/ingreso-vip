import React, { useState } from 'react';
import { InvitationData } from '../../../../types';
import { supabase } from '../../../../lib/supabase';
import { Loader2, Upload } from 'lucide-react';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function GeneralSectionEditor({ invitation, onChange }: Props) {
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string = 'cover_image_url') => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${invitation.event_id}/${field}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        try {
            // Upload to 'invitations' bucket
            const { error: uploadError } = await supabase.storage
                .from('invitations')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('invitations')
                .getPublicUrl(filePath);

            // @ts-ignore
            onChange({ [field]: publicUrl });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Error al subir la imagen: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in duration-500">

            {/* Left Col: Visuals (4/12) */}
            <div className="md:col-span-4 space-y-4">

                {/* Theme */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">1. Tema Visual</label>
                    <div className="relative">
                        <select
                            value={invitation.theme_id || 'rustic'}
                            onChange={(e) => onChange({ theme_id: e.target.value })}
                            className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 pr-8 font-medium"
                        >
                            {/* Temas Originales */}
                            <option value="rustic">🌿 Hojas (Rústico)</option>
                            <option value="romantic">🌹 Romantic Pink</option>

                            {/* Nuevos Temas */}
                            <option value="ocean">🌊 Ocean Breeze</option>
                            <option value="coral">🧡 Sunset Coral</option>
                            <option value="forest">🌲 Forest Emerald</option>
                            <option value="lavender">💜 Lavender Dreams</option>
                            <option value="golden">✨ Golden Hour</option>
                            <option value="navy">⚓ Midnight Navy</option>
                            <option value="terracotta">🍂 Terracotta Earth</option>
                            <option value="mint">🌱 Mint Garden</option>
                            <option value="burgundy">🍷 Burgundy Wine</option>
                            <option value="peach">🍑 Peach Blush</option>
                            <option value="sage">🌾 Sage & Ivory</option>
                            <option value="plum">🔮 Plum Velvet</option>
                            <option value="rosegold">🌸 Rose Gold</option>
                            <option value="black">⚫ Black & Gold</option>
                            <option value="champagne">🥂 Champagne</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
                            <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Cover Image (Compact) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">2. Portada (Fondo)</label>
                    <div className="flex justify-center">
                        <label
                            className={`relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer transition-all overflow-hidden group
                            ${invitation.cover_image_url ? 'border-indigo-300' : 'border-slate-300 hover:bg-slate-50'}`}
                        >
                            {invitation.cover_image_url ? (
                                <>
                                    <img src={invitation.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="text-white w-6 h-6" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-2">
                                    {uploading ? <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" /> : <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />}
                                    <span className="text-[10px] text-slate-500 block leading-tight">Subir Foto Horizontal</span>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover_image_url')} disabled={uploading} />
                        </label>
                    </div>
                </div>

                {/* MAIN CARD (NEW) */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm ring-1 ring-indigo-100">
                    <label className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 block flex justify-between">
                        3. Tarjeta Principal <span className="bg-indigo-100 px-1.5 rounded text-[10px]">Nueva</span>
                    </label>
                    <div className="flex justify-center">
                        <label
                            className={`relative flex flex-col items-center justify-center w-32 h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all overflow-hidden group shadow-sm
                            ${(invitation as any).main_card_url ? 'border-indigo-300' : 'border-slate-300 hover:bg-slate-50'}`}
                        >
                            {(invitation as any).main_card_url ? (
                                <>
                                    <img src={(invitation as any).main_card_url} alt="Main Card" className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Upload className="text-white w-6 h-6" />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-2">
                                    {uploading ? <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" /> : <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />}
                                    <span className="text-[10px] text-slate-500 block leading-tight">Subir Tarjeta Vertical</span>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'main_card_url')} disabled={uploading} />
                        </label>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 text-center leading-tight">
                        Esta imagen aparecerá con efecto elegante tras la música.
                    </p>
                </div>

            </div>

            {/* Right Col: Content (8/12) */}
            <div className="md:col-span-8 space-y-4">

                {/* Texts */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block">3. Textos Principales</label>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título (Novios / Cumpleañero)</label>
                            <input
                                type="text"
                                value={invitation.hero_section?.title || ''}
                                onChange={(e) => onChange({ hero_section: { ...invitation.hero_section!, title: e.target.value } })}
                                placeholder="Ej: Laura & Raul"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Frase / Subtítulo</label>
                            <input
                                type="text"
                                value={invitation.hero_section?.subtitle || ''}
                                onChange={(e) => onChange({ hero_section: { ...invitation.hero_section!, subtitle: e.target.value } })}
                                placeholder="Ej: ¡Nos casamos!"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Typography */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block">4. Tipografía</label>

                    <div className="space-y-4">
                        {/* Primera fila: Fuente y Custom Upload */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fuente Principal</label>
                                <select
                                    value={(invitation as any).font_family || 'Great Vibes'}
                                    onChange={(e) => onChange({ ['font_family' as any]: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                >
                                    <option value="Great Vibes">Great Vibes (Cursiva)</option>
                                    <option value="Playfair Display">Playfair Display (Serif)</option>
                                    <option value="Montserrat">Montserrat (Moderna)</option>
                                    <option value="custom">Subir mi propia fuente (.ttf)</option>
                                </select>
                            </div>

                            {(invitation as any).font_family === 'custom' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Archivo de Fuente</label>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm border border-slate-300 transition-colors flex items-center gap-2 flex-1 justify-center relative overflow-hidden">
                                            <Upload size={14} />
                                            {(invitation as any).custom_font_url ? 'Fuente Cargada' : 'Subir .ttf'}
                                            <input
                                                type="file"
                                                accept=".ttf,.otf,.woff"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    if (!e.target.files || e.target.files.length === 0) return;
                                                    const file = e.target.files[0];
                                                    const fileName = `${invitation.event_id}/font-${Date.now()}-${file.name}`;
                                                    try {
                                                        const { error } = await supabase.storage.from('invitations').upload(fileName, file);
                                                        if (error) throw error;
                                                        const { data: { publicUrl } } = supabase.storage.from('invitations').getPublicUrl(fileName);
                                                        onChange({ ['custom_font_url' as any]: publicUrl });
                                                    } catch (err: any) {
                                                        alert('Error subiendo fuente: ' + err.message);
                                                    }
                                                }}
                                            />
                                        </label>
                                        {(invitation as any).custom_font_url && (
                                            <span className="text-xs text-green-600 font-medium">OK</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">Formatos: TTF, OTF, WOFF</p>
                                </div>
                            )}
                        </div>

                        {/* Segunda fila: Controles de estilo */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Tamaño de fuente */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tamaño Base (px)</label>
                                <input
                                    type="number"
                                    min="12"
                                    max="32"
                                    value={(invitation as any).font_size || 18}
                                    onChange={(e) => onChange({ ['font_size' as any]: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Recomendado: 16-20px</p>
                            </div>

                            {/* Peso/Estilo */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Peso/Estilo</label>
                                <select
                                    value={(invitation as any).font_weight || 'normal'}
                                    onChange={(e) => onChange({ ['font_weight' as any]: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                >
                                    <option value="300">Ligera (300)</option>
                                    <option value="normal">Normal (400)</option>
                                    <option value="500">Media (500)</option>
                                    <option value="600">Semi-Bold (600)</option>
                                    <option value="bold">Negrita (700)</option>
                                </select>
                            </div>

                            {/* Espaciado entre letras */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Espaciado (em)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="0.5"
                                    step="0.01"
                                    value={(invitation as any).letter_spacing || 0.03}
                                    onChange={(e) => onChange({ ['letter_spacing' as any]: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">0.03 - 0.10em</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Music */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>

                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 block flex items-center gap-2">
                        4. Música de Fondo <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full normal-case">Youtube</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link de Youtube</label>
                            <input
                                type="text"
                                value={(invitation.hero_section as any)?.music?.url || ''}
                                onChange={(e) => {
                                    const currentMusic = (invitation.hero_section as any)?.music || {};
                                    onChange({
                                        hero_section: {
                                            ...invitation.hero_section!,
                                            music: { ...currentMusic, url: e.target.value }
                                        }
                                    });
                                }}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Iniciar al seg.</label>
                            <input
                                type="number"
                                value={(invitation.hero_section as any)?.music?.start || 0}
                                onChange={(e) => {
                                    const currentMusic = (invitation.hero_section as any)?.music || {};
                                    onChange({
                                        hero_section: {
                                            ...invitation.hero_section!,
                                            music: { ...currentMusic, start: parseInt(e.target.value) || 0 }
                                        }
                                    });
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">La música sonará automáticamente cuando el invitado interactúe con la invitación.</p>
                </div>

            </div>
        </div>
    );
}
