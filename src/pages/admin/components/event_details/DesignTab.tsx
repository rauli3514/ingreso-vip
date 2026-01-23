import { useRef, useState } from 'react';
import { Palette, Upload } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Event } from '../../../../types';
import ThemeSelector from '../../../../components/ThemeSelector';

interface DesignTabProps {
    event: Event;
    onUpdateEvent: (updates: Partial<Event>) => void;
}

export default function DesignTab({ event, onUpdateEvent }: DesignTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<'background' | 'logo' | null>(null);

    const handleUploadClick = (type: 'background' | 'logo') => {
        setUploadTarget(type);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.accept = 'image/*'; // Both are images usually, background can be video too?
            if (type === 'background') fileInputRef.current.accept = 'image/*,video/*,video/mp4,video/quicktime,.mov';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        setIsUploading(true);

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 100) {
            if (!confirm(`El archivo pesa ${sizeMB.toFixed(1)} MB. ¿Continuar?`)) {
                setIsUploading(false);
                return;
            }
        }

        try {
            const fileExt = file.name.split('.').pop();
            const safeName = Math.random().toString(36).substring(7);
            const fileName = `${event.id}/${safeName}.${fileExt}`;
            const bucket = 'event-assets';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            if (uploadTarget === 'background') {
                await supabase.from('events').update({ theme_background_url: publicUrl }).eq('id', event.id);
                onUpdateEvent({ theme_background_url: publicUrl });
            } else {
                await supabase.from('events').update({ theme_custom_logo_url: publicUrl }).eq('id', event.id);
                onUpdateEvent({ theme_custom_logo_url: publicUrl });
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al subir el archivo.');
        } finally {
            setIsUploading(false);
            setUploadTarget(null);
        }
    };

    const handleThemeChange = async (themeId: string) => {
        try {
            const { error } = await supabase
                .from('events')
                .update({ theme_id: themeId })
                .eq('id', event.id);

            if (error) throw error;
            onUpdateEvent({ theme_id: themeId });
            alert('Tema actualizado correctamente');
        } catch (error) {
            console.error('Error updating theme:', error);
            alert('Error al actualizar tema');
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-4xl space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                    <Palette size={18} className="text-[#FBBF24]" /> Personalización Visual
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Theme Selection */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tema del Evento</label>
                        <ThemeSelector
                            selectedThemeId={event.theme_id || 'default'}
                            onThemeSelect={handleThemeChange}
                            compact
                        />
                    </div>

                    {/* Background Upload */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fondo Personalizado (Imagen o Video Loop)</label>
                        <div
                            onClick={() => handleUploadClick('background')}
                            className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden"
                        >
                            {event.theme_background_url && (
                                <img src={event.theme_background_url} alt="Background Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                            )}
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto">
                                    {isUploading && uploadTarget === 'background' ? (
                                        <div className="loading loading-spinner text-[#FBBF24]"></div>
                                    ) : (
                                        <Upload size={20} className="text-slate-400 group-hover:text-white" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 font-medium">
                                    {event.theme_background_url ? 'Cambiar Fondo' : 'Click para subir'}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">1920x1080 recomendado. JPG, MP4</p>
                            </div>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Logo del Evento</label>
                        <div
                            onClick={() => handleUploadClick('logo')}
                            className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden"
                        >
                            {event.theme_custom_logo_url && (
                                <img src={event.theme_custom_logo_url} alt="Logo Preview" className="absolute inset-0 w-full h-full object-contain opacity-50 p-4" />
                            )}
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto">
                                    {isUploading && uploadTarget === 'logo' ? (
                                        <div className="loading loading-spinner text-[#FBBF24]"></div>
                                    ) : (
                                        <Upload size={20} className="text-slate-400 group-hover:text-white" />
                                    )}
                                </div>
                                <p className="text-sm text-slate-300 font-medium">{event.theme_custom_logo_url ? 'Cambiar Logo' : 'Subir Logo'}</p>
                                <p className="text-xs text-slate-500 mt-1">PNG transparente recomendado</p>
                            </div>
                        </div>
                    </div>

                    {/* Font Selection */}
                    <div className="space-y-4">
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tipografía</label>
                        <select
                            name="theme_font_family"
                            value={event.theme_font_family || 'Outfit'}
                            onChange={async (e) => {
                                const newFont = e.target.value;
                                try {
                                    const { error } = await supabase
                                        .from('events')
                                        .update({ theme_font_family: newFont })
                                        .eq('id', event.id);

                                    if (error) throw error;
                                    onUpdateEvent({ theme_font_family: newFont });
                                    alert('✅ Tipografía actualizada');
                                } catch (error) {
                                    console.error('Error updating font:', error);
                                    alert('Error al actualizar tipografía');
                                }
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                        >
                            <option value="Outfit" style={{ fontFamily: 'Outfit' }}>Outfit (Moderna y Limpia)</option>
                            <option value="Inter" style={{ fontFamily: 'Inter' }}>Inter (Profesional)</option>
                            <option value="Playfair Display" style={{ fontFamily: 'Playfair Display' }}>Playfair Display (Elegante)</option>
                            <option value="Montserrat" style={{ fontFamily: 'Montserrat' }}>Montserrat (Geométrica)</option>
                            <option value="Bebas Neue" style={{ fontFamily: 'Bebas Neue' }}>Bebas Neue (Impactante)</option>
                            <option value="Raleway" style={{ fontFamily: 'Raleway' }}>Raleway (Sofisticada)</option>
                            <option value="Oswald" style={{ fontFamily: 'Oswald' }}>Oswald (Condensada)</option>
                            <option value="Dancing Script" style={{ fontFamily: 'Dancing Script' }}>Dancing Script (Cursiva)</option>
                            <option value="Righteous" style={{ fontFamily: 'Righteous' }}>Righteous (Retro)</option>
                            <option value="Anton" style={{ fontFamily: 'Anton' }}>Anton (Bold Display)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">La fuente se aplicará en el QR y la pantalla del usuario</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
