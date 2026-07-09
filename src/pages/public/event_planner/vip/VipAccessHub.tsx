import { useState, useRef } from 'react';
import { Shield, QrCode, Download, ArrowLeft, Smartphone, Upload, CheckCircle2, Video, Search } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import QRCode from 'qrcode';
import { EventData } from '../types';

interface VipAccessHubProps {
    eventData: EventData;
    onBack: () => void;
    onUpdateEvent: (data: Partial<EventData>) => void;
}

export default function VipAccessHub({ eventData, onBack, onUpdateEvent }: VipAccessHubProps) {
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const videoOption = eventData.videoOption || 'none';

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

        if (!eventData.cloudEventId) {
            alert('⚠️ Primero debes guardar el evento o configurar la Invitación Digital para obtener un ID en la nube.');
            return;
        }

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
            const fileName = `${eventData.cloudEventId}/${safeName}.${fileExt}`;
            const bucket = uploadTarget.type === 'guest_video' ? 'guest-videos' : 'event-assets';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            if (uploadTarget.type === 'default_video') {
                await supabase.from('events').update({ video_url_default: publicUrl }).eq('id', eventData.cloudEventId);
                onUpdateEvent({ video_url_default: publicUrl });
            }
            else if (uploadTarget.type === 'table_video' && uploadTarget.id) {
                const currentConfig = eventData.video_configuration || {};
                const newConfig = { ...currentConfig, [uploadTarget.id]: publicUrl };
                await supabase.from('events').update({ video_configuration: newConfig }).eq('id', eventData.cloudEventId);
                onUpdateEvent({ video_configuration: newConfig });
            }
            else if (uploadTarget.type === 'guest_video') {
                const guestIds = Array.from(selectedGuestsForVideo);
                if (guestIds.length === 0) return;

                await supabase.from('guests')
                    .update({ assigned_video_url: publicUrl })
                    .in('id', guestIds);

                const updatedGuests = (eventData.guests || []).map(g => 
                    guestIds.includes(g.id) ? { ...g, assigned_video_url: publicUrl } : g
                );
                onUpdateEvent({ guests: updatedGuests });
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

    const getGuestUrl = () => {
        const baseUrl = window.location.pathname.startsWith('/ingreso-vip') ? '/ingreso-vip' : '';
        // Si no tiene cloudEventId, usamos 'demo'
        const eventId = eventData.cloudEventId || 'demo';
        return `${window.location.origin}${baseUrl}/evento/${eventId}`;
    };

    const generateQRPoster = async (orientation: 'portrait' | 'landscape') => {
        if (!eventData.cloudEventId) {
            alert('⚠️ Primero debes configurar la Invitación Digital para obtener un link online de tu evento.');
            return;
        }

        setIsGeneratingQR(true);
        console.log('🎨 Iniciando generación de QR poster...', { orientation });

        try {
            // Theme colors hardcoded for standard VIP look (dark purple/gold)
            const themeColors = {
                primary: '#6b21a8',
                secondary: '#581c87',
                accent: '#FBBF24',
                background: '#1a1030'
            };

            // 1. Generate QR Code
            const qrDataUrl = await QRCode.toDataURL(getGuestUrl(), {
                width: 800,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' },
                errorCorrectionLevel: 'H'
            });

            // 2. Create Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No se pudo crear contexto de canvas');

            const width = orientation === 'landscape' ? 1920 : 1080;
            const height = orientation === 'landscape' ? 1080 : 1920;
            canvas.width = width;
            canvas.height = height;

            // 3. Background Gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, themeColors.secondary);
            gradient.addColorStop(0.5, themeColors.primary);
            gradient.addColorStop(1, themeColors.background);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 4. Load and draw QR image
            const qrImg = new Image();
            qrImg.src = qrDataUrl;

            await new Promise((resolve, reject) => {
                qrImg.onload = resolve;
                qrImg.onerror = () => reject(new Error('Error cargando imagen QR'));
                setTimeout(() => reject(new Error('Timeout cargando QR')), 5000);
            });

            // 5. Calculate QR position
            const qrSize = orientation === 'landscape' ? 350 : 450;
            const qrX = (width - qrSize) / 2;
            const qrY = height * 0.70 - qrSize / 2;

            // Draw white container with shadow
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.fillRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);
            ctx.shadowBlur = 0;

            // Draw QR
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // 6. Add texts
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 30;

            // Event name
            ctx.font = `bold ${orientation === 'landscape' ? '70' : '80'}px system-ui, sans-serif`;
            ctx.fillText(eventData.name || 'Tu Evento', width / 2, qrY - 80);

            // Instruction
            ctx.font = `${orientation === 'landscape' ? '40' : '45'}px system-ui, sans-serif`;
            ctx.fillText('Escanea para encontrar tu mesa', width / 2, qrY + qrSize + 90);

            // Branding
            ctx.font = `${orientation === 'landscape' ? '24' : '28'}px system-ui, sans-serif`;
            ctx.fillStyle = themeColors.accent;
            ctx.fillText('INGRESO VIP • by Tecno Eventos', width / 2, height - 60);

            // Download
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = `${(eventData.name || 'evento').replace(/[^a-z0-9]/gi, '_')}_QR_${orientation}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`✅ Poster QR ${orientation === 'landscape' ? 'horizontal' : 'vertical'} generado correctamente`);

        } catch (error) {
            console.error('❌ Error generando QR poster:', error);
            alert('❌ Error al generar QR');
        } finally {
            setIsGeneratingQR(false);
        }
    };

    return (
        <div className="flex-1 w-full flex flex-col bg-slate-950 overflow-hidden relative z-50">
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-800 bg-slate-900 px-4 md:px-8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft size={20} /> Volver
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">Hub de Ingreso VIP</h2>
                        <p className="text-xs text-slate-400 leading-tight">Acelerá la entrada a tu evento</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    
                    {/* Header Info */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-slate-900 border border-purple-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-purple-500/30">
                            <Shield size={48} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-white mb-2">Recepción Self-Service</h3>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                Olvidate de las listas de papel. Imprimí el Póster QR, ponelo en la entrada y dejá que tus invitados escaneen el código con sus celulares para saber qué mesa les tocó, al instante.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* QR Downloads Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                                    <QrCode size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-white">Posters QR</h4>
                                    <p className="text-sm text-slate-400">Listos para imprimir</p>
                                </div>
                            </div>

                            <p className="text-slate-400 mb-6 text-sm">
                                Elegí el formato que mejor se adapte a tu entrada (Atril vertical o Pantalla horizontal).
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => generateQRPoster('portrait')}
                                    disabled={isGeneratingQR}
                                    className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-between transition-all group border border-slate-700"
                                >
                                    <span className="flex items-center gap-3">
                                        <Smartphone size={20} className="text-slate-400" /> 
                                        Formato Vertical (Atril)
                                    </span>
                                    {isGeneratingQR ? <span className="animate-spin text-amber-500">⏳</span> : <Download size={20} className="text-slate-500 group-hover:text-white transition-colors" />}
                                </button>

                                <button
                                    onClick={() => generateQRPoster('landscape')}
                                    disabled={isGeneratingQR}
                                    className="w-full py-4 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-between transition-all group border border-slate-700"
                                >
                                    <span className="flex items-center gap-3">
                                        <Smartphone size={20} className="text-slate-400 rotate-90" /> 
                                        Formato Horizontal (TV)
                                    </span>
                                    {isGeneratingQR ? <span className="animate-spin text-amber-500">⏳</span> : <Download size={20} className="text-slate-500 group-hover:text-white transition-colors" />}
                                </button>
                            </div>
                        </div>

{/* Video Configuration Card */}
<input
    type="file"
    ref={fileInputRef}
    className="hidden"
    onChange={handleFileChange}
/>
<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

    <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Smartphone size={24} />
        </div>
        <div>
            <h4 className="text-xl font-bold text-white">Video en Recepción</h4>
            <p className="text-sm text-slate-400">Elige cómo se mostrará el video en la zona de recepción.</p>
        </div>
    </div>

    <div className="space-y-3 mb-6">
        <label className="flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input type="radio" name="videoOption" value="none" checked={videoOption === 'none'} onChange={() => onUpdateEvent({ videoOption: 'none' })} className="form-radio text-purple-500 focus:ring-purple-500 h-4 w-4" />
            Sin video
        </label>
        <label className="flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input type="radio" name="videoOption" value="global" checked={videoOption === 'global'} onChange={() => onUpdateEvent({ videoOption: 'global' })} className="form-radio text-purple-500 focus:ring-purple-500 h-4 w-4" />
            Video general
        </label>
        <label className="flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input type="radio" name="videoOption" value="perTable" checked={videoOption === 'perTable'} onChange={() => onUpdateEvent({ videoOption: 'perTable' })} className="form-radio text-purple-500 focus:ring-purple-500 h-4 w-4" />
            Video por mesa
        </label>
        <label className="flex items-center gap-3 text-slate-300 cursor-pointer hover:text-white transition-colors">
            <input type="radio" name="videoOption" value="perGuest" checked={videoOption === 'perGuest'} onChange={() => onUpdateEvent({ videoOption: 'perGuest' })} className="form-radio text-purple-500 focus:ring-purple-500 h-4 w-4" />
            Video por invitado
        </label>
    </div>

    {videoOption === 'global' && (
        <div className="animate-in fade-in p-5 rounded-2xl bg-slate-950/50 border border-slate-800/80">
            <h4 className="font-medium text-white mb-1">Video General</h4>
            <p className="text-xs text-slate-400 mb-4">Se reproducirá este video para todos los invitados que escaneen su QR.</p>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                    {eventData.video_url_default ? (
                        <div className="text-sm text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Video activo
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 italic">Ningún video subido aún</div>
                    )}
                </div>
                <button
                    onClick={() => handleUploadClick('default_video')}
                    disabled={isUploading}
                    className="w-full md:w-auto px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-purple-500/50 hover:border-purple-400"
                >
                    {isUploading && uploadTarget?.type === 'default_video' ? (
                        <span className="animate-spin text-amber-500">⏳</span>
                    ) : (
                        <Upload size={16} />
                    )}
                    {eventData.video_url_default ? 'Cambiar Video' : 'Subir Video'}
                </button>
            </div>
        </div>
    )}

    {videoOption === 'perTable' && (
        <div className="animate-in fade-in space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Asignar por Mesa</h4>
            {(!eventData.tables || eventData.tables.length === 0) && (
                <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 text-center">
                    <p className="text-sm text-slate-500">No tienes mesas configuradas. Configura tus mesas en la sección principal primero.</p>
                </div>
            )}
            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {eventData.tables?.map((table) => {
                    const tableName = table.label || `Mesa ${table.id}`;
                    const hasVideo = !!eventData.video_configuration?.[tableName];
                    return (
                        <div key={table.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-purple-500/30 transition-colors gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${hasVideo ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                                    <Video size={16} />
                                </div>
                                <div>
                                    <span className="text-sm font-bold text-white block">{tableName}</span>
                                    {hasVideo ? (
                                        <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                                            <CheckCircle2 size={12} /> Asignado
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-500 italic mt-1 block">Sin video</span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleUploadClick('table_video', tableName)}
                                disabled={isUploading}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border ${
                                    hasVideo 
                                    ? 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800' 
                                    : 'bg-purple-600/10 text-purple-400 border-purple-500/30 hover:bg-purple-600/20'
                                }`}
                            >
                                {isUploading && uploadTarget?.type === 'table_video' && uploadTarget.id === tableName ? (
                                    <span className="animate-spin text-amber-500">⏳</span>
                                ) : (
                                    <Upload size={16} />
                                )}
                                {hasVideo ? 'Cambiar' : 'Subir Video'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    )}

    {videoOption === 'perGuest' && (
        <div className="animate-in fade-in space-y-4 pt-2">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Asignar por Invitado</h4>
            
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 bg-slate-950/50 p-4 flex flex-col border border-slate-800/80 rounded-2xl">
                    <div className="mb-4 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Buscar invitado..."
                            value={videoSearchQuery}
                            onChange={(e) => setVideoSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-purple-500/50 text-white"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar space-y-2 pr-2">
                        {(!eventData.guests || eventData.guests.length === 0) && (
                            <p className="text-xs text-slate-500 italic text-center mt-4">No hay invitados en la lista.</p>
                        )}
                        {eventData.guests
                            ?.filter(g =>
                                g.first_name.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
                                g.last_name.toLowerCase().includes(videoSearchQuery.toLowerCase())
                            )
                            .map(guest => (
                                <div
                                    key={guest.id}
                                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors border ${selectedGuestsForVideo.has(guest.id) ? 'bg-purple-500/10 border-purple-500/30' : 'bg-slate-900 hover:bg-slate-800 border-slate-800'}`}
                                    onClick={() => {
                                        const newSet = new Set(selectedGuestsForVideo);
                                        if (newSet.has(guest.id)) newSet.delete(guest.id);
                                        else newSet.add(guest.id);
                                        setSelectedGuestsForVideo(newSet);
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedGuestsForVideo.has(guest.id) ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600'}`}>
                                            {selectedGuestsForVideo.has(guest.id) && <CheckCircle2 size={14} />}
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${selectedGuestsForVideo.has(guest.id) ? 'text-purple-400' : 'text-slate-200'}`}>
                                                {guest.last_name}, {guest.first_name}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                {guest.table_info || 'Sin Mesa'} 
                                                {guest.assigned_video_url && <><Video size={10} className="text-emerald-500 ml-1"/> <span className="text-emerald-500">Video Asignado</span></>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                        <span>{selectedGuestsForVideo.size} seleccionados</span>
                        {selectedGuestsForVideo.size > 0 && (
                            <button
                                onClick={() => setSelectedGuestsForVideo(new Set())}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                Desmarcar todos
                            </button>
                        )}
                    </div>
                </div>

                <div className="lg:w-1/3 flex flex-col justify-center">
                    <div className="bg-slate-950/50 p-6 rounded-2xl border border-slate-800/80 text-center flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 border border-purple-500/20">
                            <Video size={24} />
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">Asignar Video</h3>
                        <p className="text-xs text-slate-400 mb-6">
                            Sube un video específico para los {selectedGuestsForVideo.size} invitados seleccionados.
                        </p>
                        <button
                            onClick={() => handleUploadClick('guest_video')}
                            disabled={selectedGuestsForVideo.size === 0 || isUploading}
                            className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border border-purple-500/50 hover:border-purple-400"
                        >
                            {isUploading && uploadTarget?.type === 'guest_video' ? (
                                <span className="animate-spin text-amber-500">⏳</span>
                            ) : (
                                <Upload size={16} />
                            )}
                            Subir y Asignar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}
</div>

                    </div>
                </div>
            </div>
        </div>
    );
}
