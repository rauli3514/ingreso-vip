import React, { useState } from 'react';
import { InvitationData } from '../../../../types';
import { supabase } from '../../../../lib/supabase';
import { Loader2, Upload, Trash2 } from 'lucide-react';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (updates: Partial<InvitationData>) => void;
}

// Extender InvitationData para incluir gallery_section si no existe en types.ts
// Usamos "any" temporalmente para evitar errores de TS si el tipo no está actualizado.
// En producción, deberíamos actualizar types.ts

export default function GallerySectionEditor({ invitation, onChange }: Props) {
    const [uploading, setUploading] = useState(false);

    // Casteamos a any para acceder a gallery_section sin errores de tipo
    const sectionData = (invitation as any).gallery_section || { show: true, title: 'Retratos de Nuestro Amor', subtitle: 'Momentos inolvidables', images: [] };
    const images: string[] = sectionData.images || [];

    const updateSection = (updates: any) => {
        onChange({
            ['gallery_section' as any]: {
                ...sectionData,
                ...updates
            }
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const files = Array.from(e.target.files);
        setUploading(true);

        try {
            const uploadedUrls = [];

            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${invitation.event_id}/gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('invitations')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('invitations')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }

            // Añadir nuevas imágenes al array existente
            updateSection({ images: [...images, ...uploadedUrls] });

        } catch (error: any) {
            console.error('Error uploading images:', error);
            alert('Error al subir imágenes: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        const newImages = images.filter((_, index) => index !== indexToRemove);
        updateSection({ images: newImages });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Galería de Fotos</h3>
                        <p className="text-sm text-slate-500">Crea un carrusel de fotos para compartir momentos.</p>
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

                    {/* Titles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Título de Galería</label>
                            <input
                                type="text"
                                value={sectionData.title || ''}
                                onChange={(e) => updateSection({ title: e.target.value })}
                                placeholder="Ej: Retratos de Nuestro Amor"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo / Frase</label>
                            <input
                                type="text"
                                value={sectionData.subtitle || ''}
                                onChange={(e) => updateSection({ subtitle: e.target.value })}
                                placeholder="Ej: Un minuto, un segundo..."
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-slate-700">Fotos ({images.length})</label>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {/* Upload Button */}
                            <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors group">
                                {uploading ? (
                                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-6 h-6 text-slate-400 mb-1 group-hover:text-indigo-500 transition-colors" />
                                        <span className="text-xs text-slate-500 font-medium">Agregar</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>

                            {/* Image Items */}
                            {images.map((url, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden group border border-slate-200 shadow-sm">
                                    <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                                            title="Eliminar foto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                        #{index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-400">Te recomendamos subir al menos 3 fotos para que el carrusel se vea bien.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
