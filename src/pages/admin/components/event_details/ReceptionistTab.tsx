import { useState, useRef } from 'react';
import { Video, Upload, CheckCircle2, Search } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Event, Guest } from '../../../../types';

interface ReceptionistTabProps {
    event: Event;
    guests: Guest[];
    onUpdateEvent: (updates: Partial<Event>) => void;
    onUpdateGuests: (updatedGuests: Guest[]) => void;
}

export default function ReceptionistTab({ event, guests, onUpdateEvent, onUpdateGuests }: ReceptionistTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'default_video' | 'table_video' | 'guest_video', id?: string } | null>(null);
    const [videoSearchQuery, setVideoSearchQuery] = useState('');
    const [selectedGuestsForVideo, setSelectedGuestsForVideo] = useState<Set<string>>(new Set());

    const handleUploadClick = (type: 'default_video' | 'table_video' | 'guest_video', id?: string) => {
        setUploadTarget({ type, id });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.accept = 'video/*,video/mp4,video/x-m4v,video/quicktime,.mov,.avi,.mkv';
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        setIsUploading(true);

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 100) {
            if (!confirm(`El archivo pesa ${sizeMB.toFixed(1)} MB. Puede tardar en subir. ¿Continuar?`)) {
                setIsUploading(false);
                return;
            }
        }

        try {
            const fileExt = file.name.split('.').pop();
            const safeName = Math.random().toString(36).substring(7);
            const fileName = `${event.id}/${safeName}.${fileExt}`;
            const bucket = uploadTarget.type === 'guest_video' ? 'guest-videos' : 'event-assets';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            if (uploadTarget.type === 'default_video') {
                await supabase.from('events').update({ video_url_default: publicUrl }).eq('id', event.id);
                onUpdateEvent({ video_url_default: publicUrl });
            }
            else if (uploadTarget.type === 'table_video' && uploadTarget.id) {
                const currentConfig = event.video_configuration || {};
                const newConfig = { ...currentConfig, [uploadTarget.id]: publicUrl };

                await supabase.from('events').update({ video_configuration: newConfig }).eq('id', event.id);
                onUpdateEvent({ video_configuration: newConfig });
            }
            else if (uploadTarget.type === 'guest_video') {
                const guestIds = Array.from(selectedGuestsForVideo);
                if (guestIds.length === 0) return;

                await supabase.from('guests')
                    .update({ assigned_video_url: publicUrl })
                    .in('id', guestIds);

                // Update local guests
                const updatedGuests = guests.map(g => guestIds.includes(g.id) ? { ...g, assigned_video_url: publicUrl } : g);
                onUpdateGuests(updatedGuests);

                setSelectedGuestsForVideo(new Set());
                alert(`Video asignado a ${guestIds.length} invitados correctamente.`);
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al subir el archivo.');
        } finally {
            setIsUploading(false);
            setUploadTarget(null);
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
                    <Video size={18} className="text-[#FBBF24]" /> Configuración de Multimedia
                </h3>

                {/* Default Video */}
                <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="flex-1">
                            <h4 className="font-medium text-white mb-1">Video por Defecto</h4>
                            <p className="text-xs text-slate-400">Se reproduce para invitados que no tengan video específico asignado.</p>
                            {event.video_url_default && (
                                <div className="mt-2 text-xs text-[#FBBF24] flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Video activo
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => handleUploadClick('default_video')}
                            disabled={isUploading}
                            className="btn btn-primary text-xs py-2 px-4 flex items-center gap-2"
                        >
                            {isUploading && uploadTarget?.type === 'default_video' ? 'Subiendo...' : <><Upload size={14} /> {event.video_url_default ? 'Cambiar Video' : 'Subir Video Default'}</>}
                        </button>
                    </div>
                </div>

                {/* Table Videos */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Videos por Mesa</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {[...Array.from({ length: event.table_count || 5 }, (_, i) => `Mesa ${i + 1}`)].map(tableName => (
                            <div key={tableName} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                        {tableName.replace('Mesa ', '')}
                                    </div>
                                    <span className="text-sm text-slate-200 font-medium">{tableName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {event.video_configuration?.[tableName] ? (
                                        <span className="text-xs text-[#FBBF24] mr-2 flex items-center gap-1"><Video size={10} /> Asignado</span>
                                    ) : (
                                        <span className="text-xs text-slate-500 italic mr-2">Sin video asignado</span>
                                    )}
                                    <button
                                        onClick={() => handleUploadClick('table_video', tableName)}
                                        className={`p-2 rounded-lg transition-colors ${event.video_configuration?.[tableName] ? 'text-[#FBBF24] bg-[#FBBF24]/10' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <Upload size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Personal Videos */}
                <div className="pt-6 border-t border-white/5">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Videos Personalizados (Uno o Varios Invitados)</h4>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                        {/* Selection Panel */}
                        <div className="glass-card p-4 flex flex-col border border-white/10">
                            <div className="mb-4 relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Buscar invitado..."
                                    value={videoSearchQuery}
                                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FBBF24]/50 text-white"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                {guests
                                    .filter(g =>
                                        g.first_name.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
                                        g.last_name.toLowerCase().includes(videoSearchQuery.toLowerCase())
                                    )
                                    .map(guest => (
                                        <div
                                            key={guest.id}
                                            className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${selectedGuestsForVideo.has(guest.id) ? 'bg-[#FBBF24]/10 border border-[#FBBF24]/30' : 'hover:bg-white/5 border border-transparent'}`}
                                            onClick={() => {
                                                const newSet = new Set(selectedGuestsForVideo);
                                                if (newSet.has(guest.id)) newSet.delete(guest.id);
                                                else newSet.add(guest.id);
                                                setSelectedGuestsForVideo(newSet);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGuestsForVideo.has(guest.id) ? 'bg-[#FBBF24] border-[#FBBF24]' : 'border-slate-600'}`}>
                                                    {selectedGuestsForVideo.has(guest.id) && <CheckCircle2 size={12} className="text-black" />}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-medium ${selectedGuestsForVideo.has(guest.id) ? 'text-[#FBBF24]' : 'text-slate-300'}`}>
                                                        {guest.last_name}, {guest.first_name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {guest.table_info || 'Sin Mesa'} {guest.assigned_video_url && '• Tiene video asignado'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
                                <span>{selectedGuestsForVideo.size} seleccionados</span>
                                {selectedGuestsForVideo.size > 0 && (
                                    <button
                                        onClick={() => setSelectedGuestsForVideo(new Set())}
                                        className="text-slate-500 hover:text-white"
                                    >
                                        Desmarcar todos
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Upload Actions */}
                        <div className="flex flex-col justify-center gap-4">
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
                                <div className="w-12 h-12 rounded-full bg-[#FBBF24]/20 flex items-center justify-center mx-auto mb-4 text-[#FBBF24]">
                                    <Video size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Asignar Video</h3>
                                <p className="text-sm text-slate-400 mb-6">
                                    Sube un video específico para los {selectedGuestsForVideo.size} invitados seleccionados.
                                    Cuando ellos ingresen, verán este video en lugar del default.
                                </p>
                                <button
                                    onClick={() => handleUploadClick('guest_video')}
                                    disabled={selectedGuestsForVideo.size === 0 || isUploading}
                                    className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading && uploadTarget?.type === 'guest_video' ? 'Subiendo...' : 'Subir y Asignar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
