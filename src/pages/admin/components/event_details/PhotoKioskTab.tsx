import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Event } from '../../../../types';
import {
    Camera, Save, Loader2, Eye, Power, PowerOff,
    Link2, Type, Image, Palette, ToggleLeft, ToggleRight,
    ExternalLink, Copy, CheckCheck, AlertCircle, Upload, Trash2
} from 'lucide-react';

interface PhotoKioskConfig {
    enabled: boolean;
    title: string;
    subtitle: string;
    drive_url: string;
    drive_enabled: boolean;
    background_type: 'color' | 'gradient' | 'image';
    background_color: string;
    background_gradient_from: string;
    background_gradient_to: string;
    background_image_url: string;
    font_family: string;
    text_color: string;
    accent_color: string;
    logo_url: string;
    show_logo: boolean;
    // QRs del hardware del espejo mágico
    qr_content: string;           // 1. INICIAR sesión de fotos
    qr_reset_content: string;     // 2. REINICIAR captura
    qr_reset_enabled: boolean;
    qr_standby_content: string;   // 3. Lector SIEMPRE ACTIVO (nunca standby)
    qr_standby_enabled: boolean;
    qr_sleep_content: string;     // 4. APAGAR / standby a los 30s
    qr_sleep_enabled: boolean;
    qr_instruction: string;
    footer_text: string;
}

const DEFAULT_CONFIG: PhotoKioskConfig = {
    enabled: false,
    title: '¡Vamos a tomarnos unas fotos! 📸',
    subtitle: '',
    drive_url: '',
    drive_enabled: false,
    background_type: 'gradient',
    background_color: '#0a0e27',
    background_gradient_from: '#0a0e27',
    background_gradient_to: '#1a1040',
    background_image_url: '',
    font_family: 'Inter',
    text_color: '#ffffff',
    accent_color: '#4169E1',
    logo_url: '',
    show_logo: false,
    qr_content: '',
    qr_reset_content: '',
    qr_reset_enabled: false,
    qr_standby_content: '',
    qr_standby_enabled: false,
    qr_sleep_content: '',
    qr_sleep_enabled: false,
    qr_instruction: '¡Apuntá este QR para iniciar!',
    footer_text: '',
};

const FONT_OPTIONS = [
    { label: 'Inter (Moderno)', value: 'Inter' },
    { label: 'Playfair Display (Elegante)', value: 'Playfair Display' },
    { label: 'Montserrat (Premium)', value: 'Montserrat' },
    { label: 'Poppins (Friendly)', value: 'Poppins' },
    { label: 'Raleway (Fino)', value: 'Raleway' },
    { label: 'Dancing Script (Cursiva)', value: 'Dancing Script' },
    { label: 'Great Vibes (Caligráfico)', value: 'Great Vibes' },
    { label: 'Josefin Sans (Geométrico)', value: 'Josefin Sans' },
];

interface Props {
    event: Event;
}

export default function PhotoKioskTab({ event }: Props) {
    const [config, setConfig] = useState<PhotoKioskConfig>(DEFAULT_CONFIG);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [uploadingBg, setUploadingBg] = useState(false);
    const bgFileRef = useRef<HTMLInputElement>(null);

    const kioskUrl = `${window.location.origin}/kiosco/${event.id}`;
    const kioskAdminUrl = `${window.location.origin}/kiosco/${event.id}?admin=1`;

    useEffect(() => {
        if (event?.photo_kiosk_config) {
            setConfig({ ...DEFAULT_CONFIG, ...event.photo_kiosk_config });
        }
    }, [event]);

    const update = (updates: Partial<PhotoKioskConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // Intentar con RPC (bypasea el schema cache de PostgREST)
            const { error: rpcErr } = await supabase.rpc('save_photo_kiosk_config', {
                p_event_id: event.id,
                p_config: config,
            });

            if (rpcErr) {
                // Fallback: método directo por si el RPC aún no existe
                const { error: directErr } = await supabase
                    .from('events')
                    .update({ photo_kiosk_config: config } as any)
                    .eq('id', event.id);
                if (directErr) throw directErr;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e: any) {
            setError(e.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };


    const handleCopyUrl = () => {
        navigator.clipboard.writeText(kioskUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no puede superar 5 MB. Recomendado: 1080×1920px, JPEG/WebP.');
            return;
        }

        const ext = file.name.split('.').pop();
        const fileName = `kiosk-bg/${event.id}-${Date.now()}.${ext}`;
        setUploadingBg(true);
        setError(null);
        try {
            const { error: uploadErr } = await supabase.storage
                .from('invitations')
                .upload(fileName, file, { upsert: true });
            if (uploadErr) throw uploadErr;

            const { data: { publicUrl } } = supabase.storage
                .from('invitations')
                .getPublicUrl(fileName);

            update({ background_image_url: publicUrl, background_type: 'image' });
        } catch (err: any) {
            setError('Error al subir imagen: ' + err.message);
        } finally {
            setUploadingBg(false);
            // Limpiar input para permitir re-subir el mismo archivo
            if (bgFileRef.current) bgFileRef.current.value = '';
        }
    };

    const openPreview = () => {
        window.open(kioskAdminUrl, 'KioskPreview', 'width=1280,height=720,resizable=yes,scrollbars=yes');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">

            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a0e27] via-[#1a1040] to-[#0a1628] p-6 border border-white/10 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#4169E1]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#4169E1]/20 border border-[#4169E1]/30 flex items-center justify-center shadow-lg shadow-[#4169E1]/20">
                            <Camera size={28} className="text-[#4169E1]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">Quiosco de Fotos</h2>
                            <p className="text-slate-400 text-sm mt-0.5">Pantalla de activación para el Espejo Mágico</p>
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <button
                        onClick={() => update({ enabled: !config.enabled })}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 border ${config.enabled
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        {config.enabled
                            ? <><ToggleRight size={18} className="text-emerald-400" /> Quiosco Activo</>
                            : <><ToggleLeft size={18} /> Quiosco Inactivo</>
                        }
                    </button>
                </div>

                {/* URL del quiosco */}
                <div className="relative mt-5 flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 px-4 py-3">
                    <Link2 size={14} className="text-[#4169E1] shrink-0" />
                    <span className="text-slate-300 text-sm font-mono truncate flex-1">{kioskUrl}</span>
                    <button
                        onClick={handleCopyUrl}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all shrink-0"
                    >
                        {copied ? <><CheckCheck size={13} className="text-emerald-400" /> Copiado</> : <><Copy size={13} /> Copiar</>}
                    </button>
                    <button
                        onClick={openPreview}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4169E1]/20 hover:bg-[#4169E1]/30 text-[#5B8DEF] text-xs font-medium transition-all shrink-0"
                    >
                        <Eye size={13} /> Preview
                    </button>
                </div>

                {!config.enabled && (
                    <div className="relative mt-3 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">
                        <AlertCircle size={14} className="text-amber-400 shrink-0" />
                        <p className="text-amber-300 text-xs">El quiosco está <strong>desactivado</strong>. Los visitantes verán una pantalla de error.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Columna Izquierda: Contenido ── */}
                <div className="space-y-4">

                    {/* Textos */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <Type size={14} className="text-indigo-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Textos de la Pantalla</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Título Principal</label>
                                <input
                                    type="text"
                                    value={config.title}
                                    onChange={e => update({ title: e.target.value })}
                                    placeholder="📸 ¡Sacate una Foto!"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Subtítulo</label>
                                <input
                                    type="text"
                                    value={config.subtitle}
                                    onChange={e => update({ subtitle: e.target.value })}
                                    placeholder="Escaneá el código QR..."
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                />
                            </div>
                            {/* QR Content - campo más importante */}
                            <div className="border border-cyan-200 bg-cyan-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-base">🔲</span>
                                    <label className="block text-xs font-bold text-cyan-800 uppercase tracking-wider">Contenido del QR <span className="text-cyan-600 normal-case font-semibold">(lo que escanea el espejo)</span></label>
                                </div>
                                <p className="text-xs text-cyan-700 leading-relaxed">
                                    Pegá aquí el string, URL o comando <strong>exacto</strong> que tu software del espejo mágico necesita leer para disparar la sesión de fotos.
                                </p>
                                <textarea
                                    value={config.qr_content}
                                    onChange={e => update({ qr_content: e.target.value })}
                                    placeholder="Ej: START_PHOTO_SESSION o https://mirror.local/trigger"
                                    rows={2}
                                    className="w-full border border-cyan-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all font-mono resize-none"
                                />
                                {!config.qr_content && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <span>⚠️</span> Sin contenido. El QR mostrará un código de ejemplo hasta que completes este campo.
                                    </p>
                                )}
                            </div>

                            {/* QR Reinicio - segundo QR */}
                            <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">🔄</span>
                                        <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider">QR de Reinicio <span className="text-orange-600 normal-case font-semibold">(reiniciar captura)</span></label>
                                    </div>
                                    <button
                                        onClick={() => update({ qr_reset_enabled: !config.qr_reset_enabled })}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${config.qr_reset_enabled
                                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                                            : 'bg-white border-orange-200 text-orange-400'
                                            }`}
                                    >
                                        {config.qr_reset_enabled ? '✓ Visible en pantalla' : 'Oculto'}
                                    </button>
                                </div>
                                <p className="text-xs text-orange-700 leading-relaxed">
                                    Segundo QR que el administrador escanea para <strong>reiniciar</strong> la sesión de fotos sin tocar el espejo.
                                </p>
                                <textarea
                                    value={config.qr_reset_content}
                                    onChange={e => update({ qr_reset_content: e.target.value })}
                                    placeholder="Ej: RESET_PHOTO_SESSION o https://mirror.local/reset"
                                    rows={2}
                                    className="w-full border border-orange-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all font-mono resize-none"
                                />
                                {config.qr_reset_enabled && !config.qr_reset_content && (
                                    <p className="text-xs text-amber-600 flex items-center gap-1">
                                        <span>⚠️</span> Está visible pero sin contenido. Completá el campo para que el QR funcione.
                                    </p>
                                )}
                            </div>

                            {/* QR Standby - tercer QR de configuración hardware */}
                            <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📡</span>
                                        <label className="block text-xs font-bold text-violet-800 uppercase tracking-wider">Lector Siempre Activo <span className="text-violet-600 normal-case font-semibold">(nunca modo espera)</span></label>
                                    </div>
                                    <button
                                        onClick={() => update({ qr_standby_enabled: !config.qr_standby_enabled })}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${config.qr_standby_enabled
                                            ? 'bg-violet-100 border-violet-300 text-violet-700'
                                            : 'bg-white border-violet-200 text-violet-400'
                                            }`}
                                    >
                                        {config.qr_standby_enabled ? '✓ Visible en pantalla' : 'Oculto'}
                                    </button>
                                </div>
                                <p className="text-xs text-violet-700 leading-relaxed">
                                    QR de configuración del hardware: mantiene el <strong>lector de códigos siempre activo</strong> y evita que el dispositivo entre en modo de espera. Escanearlo una vez al iniciar el evento es suficiente.
                                </p>
                                <textarea
                                    value={config.qr_standby_content}
                                    onChange={e => update({ qr_standby_content: e.target.value })}
                                    placeholder='Ej: "Nunca entrar en modo de espera" o el string de tu lector'
                                    rows={2}
                                    className="w-full border border-violet-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all font-mono resize-none"
                                />
                            </div>

                            {/* QR Sleep - cuarto QR: apagar/standby 30s */}
                            <div className="border border-slate-300 bg-slate-50 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">😴</span>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Apagar / Standby <span className="text-slate-500 normal-case font-semibold">(ej: 30 segundos)</span></label>
                                    </div>
                                    <button
                                        onClick={() => update({ qr_sleep_enabled: !config.qr_sleep_enabled })}
                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${config.qr_sleep_enabled
                                            ? 'bg-slate-200 border-slate-400 text-slate-700'
                                            : 'bg-white border-slate-200 text-slate-400'
                                            }`}
                                    >
                                        {config.qr_sleep_enabled ? '✓ Visible en pantalla' : 'Oculto'}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Pone el lector en <strong>modo de espera</strong> después del tiempo configurado (ej: "Apagar a los 30 segundos"). Opuesto al QR anterior.
                                </p>
                                <textarea
                                    value={config.qr_sleep_content}
                                    onChange={e => update({ qr_sleep_content: e.target.value })}
                                    placeholder='Ej: "Apagar a los 30 segundos" o el string de tu lector'
                                    rows={2}
                                    className="w-full border border-slate-300 bg-white rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/30 focus:border-slate-400 transition-all font-mono resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Instrucción bajo el QR principal</label>
                                <input
                                    type="text"
                                    value={config.qr_instruction}
                                    onChange={e => update({ qr_instruction: e.target.value })}
                                    placeholder="Apuntá la cámara al código"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Texto del Footer <span className="text-slate-400 normal-case">(opcional)</span></label>
                                <input
                                    type="text"
                                    value={config.footer_text}
                                    onChange={e => update({ footer_text: e.target.value })}
                                    placeholder="Ej: Boda de Sofía & Matías · Marzo 2026"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Drive */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Link2 size={14} className="text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">Link de Google Drive</h3>
                            </div>
                            <button
                                onClick={() => update({ drive_enabled: !config.drive_enabled })}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${config.drive_enabled
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                            >
                                {config.drive_enabled
                                    ? <span className="flex items-center gap-1"><Power size={12} /> Visible</span>
                                    : <span className="flex items-center gap-1"><PowerOff size={12} /> Oculto</span>
                                }
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">URL de la carpeta Drive</label>
                                <input
                                    type="url"
                                    value={config.drive_url}
                                    onChange={e => update({ drive_url: e.target.value })}
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all font-mono"
                                />
                            </div>
                            {config.drive_url && (
                                <a
                                    href={config.drive_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline font-medium"
                                >
                                    <ExternalLink size={12} /> Verificar link
                                </a>
                            )}
                            <p className="text-xs text-slate-400">
                                Cuando está <strong>Visible</strong>, aparece un botón en la pantalla del quiosco para que los invitados puedan ver sus fotos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Columna Derecha: Diseño ── */}
                <div className="space-y-4">

                    {/* Tipografía & Colores */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                                <Palette size={14} className="text-purple-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Tipografía & Colores</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Fuente</label>
                                <select
                                    value={config.font_family}
                                    onChange={e => update({ font_family: e.target.value })}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all bg-white"
                                >
                                    {FONT_OPTIONS.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color de Texto</label>
                                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                                        <input
                                            type="color"
                                            value={config.text_color}
                                            onChange={e => update({ text_color: e.target.value })}
                                            className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                        />
                                        <span className="text-xs font-mono text-slate-600">{config.text_color}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color Acento</label>
                                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                                        <input
                                            type="color"
                                            value={config.accent_color}
                                            onChange={e => update({ accent_color: e.target.value })}
                                            className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                        />
                                        <span className="text-xs font-mono text-slate-600">{config.accent_color}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fondo */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Image size={14} className="text-amber-600" />
                            </div>
                            <h3 className="font-bold text-slate-800 text-sm">Fondo de Pantalla</h3>
                        </div>
                        <div className="space-y-4">
                            {/* Tipo de fondo */}
                            <div className="flex gap-2">
                                {[
                                    { id: 'gradient', label: 'Degradado' },
                                    { id: 'color', label: 'Color sólido' },
                                    { id: 'image', label: 'Imagen' },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => update({ background_type: t.id as any })}
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${config.background_type === t.id
                                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {config.background_type === 'gradient' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color Inicio</label>
                                        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                                            <input
                                                type="color"
                                                value={config.background_gradient_from}
                                                onChange={e => update({ background_gradient_from: e.target.value })}
                                                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                            />
                                            <span className="text-xs font-mono text-slate-600 truncate">{config.background_gradient_from}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Color Fin</label>
                                        <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white">
                                            <input
                                                type="color"
                                                value={config.background_gradient_to}
                                                onChange={e => update({ background_gradient_to: e.target.value })}
                                                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                            />
                                            <span className="text-xs font-mono text-slate-600 truncate">{config.background_gradient_to}</span>
                                        </div>
                                    </div>
                                    {/* Preview del degradado */}
                                    <div
                                        className="col-span-2 h-10 rounded-xl border border-slate-200"
                                        style={{ background: `linear-gradient(135deg, ${config.background_gradient_from}, ${config.background_gradient_to})` }}
                                    />
                                </div>
                            )}
                            {config.background_type === 'color' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-white flex-1">
                                        <input
                                            type="color"
                                            value={config.background_color}
                                            onChange={e => update({ background_color: e.target.value })}
                                            className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                        />
                                        <span className="text-xs font-mono text-slate-600">{config.background_color}</span>
                                    </div>
                                    <div
                                        className="w-12 h-12 rounded-xl border border-slate-200 shrink-0"
                                        style={{ backgroundColor: config.background_color }}
                                    />
                                </div>
                            )}
                            {config.background_type === 'image' && (
                                <div className="space-y-3">
                                    {/* Uploader principal */}
                                    <label
                                        className={`relative flex flex-col items-center justify-center w-full cursor-pointer rounded-2xl border-2 border-dashed transition-all overflow-hidden group
                                            ${config.background_image_url
                                                ? 'border-amber-300 h-44'
                                                : 'border-amber-200 hover:border-amber-400 hover:bg-amber-50 h-36'
                                            }`}
                                    >
                                        {config.background_image_url ? (
                                            <>
                                                {/* Preview de la imagen */}
                                                <img
                                                    src={config.background_image_url}
                                                    alt="Fondo"
                                                    className="absolute inset-0 w-full h-full object-cover"
                                                />
                                                {/* Hover overlay */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                    <Upload size={22} className="text-white" />
                                                    <span className="text-white text-xs font-bold">Cambiar imagen</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 p-4 text-center">
                                                {uploadingBg ? (
                                                    <Loader2 size={28} className="text-amber-500 animate-spin" />
                                                ) : (
                                                    <Upload size={28} className="text-amber-400" />
                                                )}
                                                <span className="text-sm font-semibold text-slate-600">
                                                    {uploadingBg ? 'Subiendo...' : 'Subir imagen desde tu PC'}
                                                </span>
                                                <span className="text-xs text-slate-400">JPG, PNG, WebP · Máx 5 MB</span>
                                            </div>
                                        )}
                                        <input
                                            ref={bgFileRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleBgUpload}
                                            disabled={uploadingBg}
                                        />
                                    </label>

                                    {/* Botón eliminar + recomendación */}
                                    {config.background_image_url && (
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-slate-400 leading-tight">
                                                ✅ Imagen cargada · Tamaño ideal: <strong>1080 × 1920 px</strong> (vertical 9:16)
                                            </p>
                                            <button
                                                onClick={() => update({ background_image_url: '', background_type: 'gradient' })}
                                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors font-semibold shrink-0 ml-3"
                                            >
                                                <Trash2 size={13} /> Quitar
                                            </button>
                                        </div>
                                    )}

                                    {/* Alternativa: pegar URL */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">O pegá una URL externa</label>
                                        <input
                                            type="url"
                                            value={config.background_image_url}
                                            onChange={e => update({ background_image_url: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all font-mono"
                                        />
                                    </div>

                                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                        <span className="text-lg leading-none">📱</span>
                                        <div>
                                            <p className="text-xs font-bold text-amber-800">Tamaño recomendado para celular</p>
                                            <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                                                <strong>1080 × 1920 px</strong> (vertical / portrait 9:16)<br />
                                                Formato: <strong>JPG o WebP</strong> · Peso: menos de 2 MB para carga rápida
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Logo */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 text-sm">Logo del Evento <span className="text-slate-400 font-normal">(opcional)</span></h3>
                            <button
                                onClick={() => update({ show_logo: !config.show_logo })}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all border ${config.show_logo
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                                    }`}
                            >
                                {config.show_logo ? 'Visible' : 'Oculto'}
                            </button>
                        </div>
                        {config.show_logo && (
                            <div>
                                <input
                                    type="url"
                                    value={config.logo_url}
                                    onChange={e => update({ logo_url: e.target.value })}
                                    placeholder="https://... (URL de la imagen del logo)"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all font-mono"
                                />
                                {config.logo_url && (
                                    <div className="mt-2 flex items-center justify-center h-16 rounded-xl bg-slate-50 border border-slate-200">
                                        <img src={config.logo_url} alt="Logo preview" className="max-h-14 max-w-full object-contain" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                    URL pública: <span className="font-mono text-slate-600">/kiosco/{event.id}</span>
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={openPreview}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-all"
                    >
                        <ExternalLink size={16} /> Vista Previa
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${saved
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-[#4169E1] hover:bg-[#5B8DEF] text-white shadow-[#4169E1]/30 hover:scale-105'
                            } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCheck size={16} /> : <Save size={16} />}
                        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
