import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import QRCode from 'qrcode';

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
    qr_content: string;
    qr_reset_content: string;
    qr_reset_enabled: boolean;
    qr_standby_content: string;
    qr_standby_enabled: boolean;
    qr_sleep_content: string;
    qr_sleep_enabled: boolean;
    qr_instruction: string;
    footer_text: string;
}

const DEFAULT: PhotoKioskConfig = {
    enabled: true,
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

function getBackground(cfg: PhotoKioskConfig): React.CSSProperties {
    if (cfg.background_type === 'color') return { backgroundColor: cfg.background_color };
    if (cfg.background_type === 'image' && cfg.background_image_url)
        return {
            backgroundImage: `url(${cfg.background_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    return {
        background: `linear-gradient(160deg, ${cfg.background_gradient_from} 0%, ${cfg.background_gradient_to} 100%)`,
    };
}

function GoogleDriveIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47" />
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335" />
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 27h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
        </svg>
    );
}

async function makeQR(content: string, size = 320): Promise<string> {
    return QRCode.toDataURL(content, {
        width: size, margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
        errorCorrectionLevel: 'H',
    });
}

interface AdminQRCardProps {
    label: string;
    desc: string;
    emoji: string;
    dataUrl: string;
    borderColor: string;
    textColor: string;
}

function AdminQRCard({ label, desc, emoji, dataUrl, borderColor, textColor }: AdminQRCardProps) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '10px 8px', borderRadius: 14,
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid ${borderColor}44`,
            backdropFilter: 'blur(10px)',
            flex: '1 1 0', maxWidth: 140,
        }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 5, border: `2px solid ${borderColor}` }}>
                {dataUrl ? (
                    <img src={dataUrl} alt={label} style={{ width: 80, height: 80, display: 'block' }} />
                ) : (
                    <div style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 20, height: 20, border: '2px solid #ccc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                )}
            </div>
            <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: borderColor, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{emoji} {label}</p>
                <p style={{ fontSize: '0.55rem', color: `${textColor}55`, margin: '2px 0 0', lineHeight: 1.3 }}>{desc}</p>
            </div>
        </div>
    );
}

export default function PhotoKioskPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const isAdmin = searchParams.get('admin') === '1';

    const [config, setConfig] = useState<PhotoKioskConfig>(DEFAULT);
    const [loading, setLoading] = useState(true);

    const [qrMain, setQrMain] = useState('');
    const [qrReset, setQrReset] = useState('');
    const [qrStandby, setQrStandby] = useState('');
    const [qrSleep, setQrSleep] = useState('');
    const [showResetQR, setShowResetQR] = useState(false);

    useEffect(() => { if (id) fetchConfig(); }, [id]);

    // QR principal — tamaño grande para móvil
    useEffect(() => {
        makeQR(config.qr_content || `kiosco-${id}`, 400).then(setQrMain).catch(() => { });
    }, [id, config.qr_content]);

    // QR reinicio
    useEffect(() => {
        if (!config.qr_reset_enabled || !config.qr_reset_content) { setQrReset(''); return; }
        makeQR(config.qr_reset_content, 200).then(setQrReset).catch(() => { });
    }, [config.qr_reset_content, config.qr_reset_enabled]);

    // QRs de admin
    useEffect(() => {
        if (!isAdmin || !config.qr_standby_enabled || !config.qr_standby_content) { setQrStandby(''); return; }
        makeQR(config.qr_standby_content, 140).then(setQrStandby).catch(() => { });
    }, [isAdmin, config.qr_standby_content, config.qr_standby_enabled]);

    useEffect(() => {
        if (!isAdmin || !config.qr_sleep_enabled || !config.qr_sleep_content) { setQrSleep(''); return; }
        makeQR(config.qr_sleep_content, 140).then(setQrSleep).catch(() => { });
    }, [isAdmin, config.qr_sleep_content, config.qr_sleep_enabled]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('events').select('name, photo_kiosk_config').eq('id', id).single();
            if (error) throw error;
            if (data?.photo_kiosk_config) setConfig({ ...DEFAULT, ...data.photo_kiosk_config });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?family=${config.font_family.replace(/ /g, '+')}:wght@300;400;600;700;800&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => { try { document.head.removeChild(link); } catch (_) { } };
    }, [config.font_family]);

    if (loading) return (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0e27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #4169E1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );

    if (!config.enabled) return (
        <div style={{ position: 'fixed', inset: 0, background: '#0a0e27', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 16 }}>
            <span style={{ fontSize: 60 }}>📷</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Quiosco no disponible</h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', maxWidth: 280, margin: 0 }}>Este quiosco está temporalmente desactivado.</p>
        </div>
    );

    const bgStyle = getBackground(config);
    const hasAdminQRs = isAdmin && (config.qr_standby_enabled || config.qr_sleep_enabled);

    return (
        <>
            <style>{`
                * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
                html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes glow-pulse {
                    0%, 100% { box-shadow: 0 0 0 0 ${config.accent_color}55, 0 24px 80px rgba(0,0,0,.5); }
                    50%       { box-shadow: 0 0 0 18px ${config.accent_color}00, 0 24px 80px rgba(0,0,0,.5); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position:  200% center; }
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes particle-float {
                    0%   { transform: translateY(100vh) scale(0); opacity: 0; }
                    10%  { opacity: .4; }
                    90%  { opacity: .15; }
                    100% { transform: translateY(-60px) scale(1); opacity: 0; }
                }
                .kiosk-title {
                    background: linear-gradient(100deg, ${config.text_color} 0%, ${config.accent_color} 50%, ${config.text_color} 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: shimmer 5s linear infinite;
                }
                .qr-card-anim { animation: float 5s ease-in-out infinite; }
                .qr-glow      { animation: glow-pulse 3s ease-in-out infinite; }
                .slide-up     { animation: slide-up .3s ease forwards; }
                .particle {
                    position: absolute; border-radius: 50%;
                    background: ${config.accent_color};
                    pointer-events: none;
                    animation: particle-float linear infinite;
                    opacity: 0;
                }
            `}</style>

            {/* ─── ROOT ─── */}
            <div style={{
                ...bgStyle,
                position: 'fixed', inset: 0,
                fontFamily: `'${config.font_family}', system-ui, sans-serif`,
                color: config.text_color,
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto', overflowX: 'hidden',
            }}>
                {/* Sin overlay — imagen de fondo visible al 100% */}

                {/* Orbes decorativos */}
                <div style={{ position: 'absolute', top: '-15%', right: '-15%', width: 380, height: 380, borderRadius: '50%', background: config.accent_color, filter: 'blur(90px)', opacity: .18, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 300, height: 300, borderRadius: '50%', background: config.accent_color, filter: 'blur(80px)', opacity: .1, pointerEvents: 'none' }} />

                {/* Partículas */}
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${10 + i * 20}%`,
                        width: `${4 + (i % 3) * 2}px`,
                        height: `${4 + (i % 3) * 2}px`,
                        animationDuration: `${9 + i * 2}s`,
                        animationDelay: `${i * 1.5}s`,
                    }} />
                ))}

                {/* Badge admin */}
                {isAdmin && (
                    <div style={{
                        position: 'absolute', top: 12, right: 12, zIndex: 30,
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 999,
                        background: `${config.accent_color}25`,
                        border: `1px solid ${config.accent_color}55`,
                        color: config.accent_color, fontSize: '0.7rem', fontWeight: 700,
                    }}>
                        🛡️ Admin
                    </div>
                )}

                {/* ─── CONTENIDO PRINCIPAL ─── */}
                <div style={{
                    position: 'relative', zIndex: 10,
                    flex: 1, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    padding: '24px 20px 16px',
                    textAlign: 'center', minHeight: 0,
                }}>

                    {/* Logo */}
                    {config.show_logo && config.logo_url && (
                        <img src={config.logo_url} alt="Logo"
                            style={{ maxHeight: 60, maxWidth: '60vw', objectFit: 'contain', marginBottom: 20, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,.5))' }} />
                    )}

                    {/* Título — mobile-first, grande y llamativo */}
                    <h1 className="kiosk-title" style={{
                        fontSize: 'clamp(1.6rem, 7vw, 3.5rem)',
                        fontWeight: 800,
                        lineHeight: 1.15,
                        margin: '0 0 8px',
                        letterSpacing: '-0.01em',
                    }}>
                        {config.title}
                    </h1>

                    {/* Subtítulo */}
                    {config.subtitle && (
                        <p style={{
                            fontSize: 'clamp(0.85rem, 3.5vw, 1.1rem)',
                            color: `${config.text_color}aa`,
                            margin: '0 0 20px',
                            lineHeight: 1.5,
                        }}>
                            {config.subtitle}
                        </p>
                    )}

                    {/* ── QR PRINCIPAL ── grande para que el mirror lo lea */}
                    <div className="qr-card-anim" style={{ marginBottom: 12 }}>
                        <div className="qr-glow" style={{
                            background: '#ffffff',
                            borderRadius: 24,
                            padding: 14,
                            border: `3px solid ${config.accent_color}`,
                            display: 'inline-block',
                        }}>
                            {qrMain ? (
                                <img
                                    src={qrMain}
                                    alt="QR para iniciar"
                                    style={{
                                        // Ocupa casi todo el ancho en móvil
                                        width: 'min(75vw, 320px)',
                                        height: 'min(75vw, 320px)',
                                        display: 'block',
                                    }}
                                />
                            ) : (
                                <div style={{ width: 'min(75vw, 280px)', height: 'min(75vw, 280px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ width: 36, height: 36, border: '3px solid #cbd5e1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instrucción bajo el QR */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 22px', borderRadius: 999,
                        background: `${config.accent_color}22`,
                        border: `1px solid ${config.accent_color}44`,
                        marginBottom: 20,
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: config.accent_color, animation: 'glow-pulse 2s ease-in-out infinite' }} />
                        <p style={{ fontSize: 'clamp(0.8rem, 3.5vw, 1rem)', color: `${config.text_color}dd`, margin: 0, fontWeight: 600 }}>
                            {config.qr_instruction}
                        </p>
                    </div>

                    {/* Botón Drive */}
                    {config.drive_enabled && config.drive_url && (
                        <a href={config.drive_url} target="_blank" rel="noreferrer"
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 10,
                                padding: '12px 28px', borderRadius: 18,
                                background: '#ffffff', color: '#1a1a2e',
                                fontWeight: 700, fontSize: 'clamp(0.85rem, 3.5vw, 1rem)',
                                textDecoration: 'none',
                                boxShadow: '0 8px 32px rgba(0,0,0,.35)',
                                transition: 'transform .2s',
                            }}>
                            <GoogleDriveIcon />
                            Ver mis Fotos
                        </a>
                    )}
                </div>

                {/* ─── QR REINICIO (cliente puede desplegarlo) ─── */}
                {config.qr_reset_enabled && config.qr_reset_content && (
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', paddingBottom: 12 }}>
                        {!showResetQR ? (
                            <button
                                onClick={() => setShowResetQR(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '10px 22px', borderRadius: 999,
                                    background: 'rgba(249,115,22,0.15)',
                                    border: '1px solid rgba(249,115,22,0.35)',
                                    color: `${config.text_color}cc`,
                                    fontSize: 'clamp(0.75rem, 3vw, 0.9rem)',
                                    fontWeight: 600, cursor: 'pointer',
                                }}>
                                🔄 ¿Necesitás reiniciar la cámara?
                            </button>
                        ) : (
                            <div className="slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <div style={{ background: '#fff', borderRadius: 16, padding: 8, border: '2px solid #F97316' }}>
                                    {qrReset ? (
                                        <img src={qrReset} alt="QR Reiniciar" style={{ width: 'min(50vw, 180px)', height: 'min(50vw, 180px)', display: 'block' }} />
                                    ) : (
                                        <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ width: 24, height: 24, border: '2px solid #ccc', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                        </div>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                                    🔄 Reiniciar Cámara
                                </p>
                                <button onClick={() => setShowResetQR(false)}
                                    style={{ fontSize: '0.65rem', color: `${config.text_color}44`, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    Ocultar
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── PANEL ADMIN (solo con ?admin=1) ─── */}
                {hasAdminQRs && (
                    <div style={{ position: 'relative', zIndex: 10, paddingBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', marginBottom: 10 }}>
                            <div style={{ flex: 1, height: 1, background: `${config.text_color}18` }} />
                            <p style={{ fontSize: '0.55rem', color: `${config.text_color}40`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', margin: 0 }}>
                                🛡️ Hardware
                            </p>
                            <div style={{ flex: 1, height: 1, background: `${config.text_color}18` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: '0 16px' }}>
                            {config.qr_standby_enabled && qrStandby && (
                                <AdminQRCard label="Lector Activo" desc="Nunca modo espera" emoji="📡" dataUrl={qrStandby} borderColor="#8B5CF6" textColor={config.text_color} />
                            )}
                            {config.qr_sleep_enabled && qrSleep && (
                                <AdminQRCard label="Apagar" desc="Standby / 30 seg" emoji="😴" dataUrl={qrSleep} borderColor="#6B7280" textColor={config.text_color} />
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                {config.footer_text && (
                    <div style={{
                        position: 'relative', zIndex: 10, textAlign: 'center', paddingBottom: 10,
                        fontSize: 'clamp(0.6rem, 2.5vw, 0.8rem)',
                        color: `${config.text_color}40`, fontWeight: 300, letterSpacing: '0.04em',
                    }}>
                        {config.footer_text}
                    </div>
                )}

                {/* Marca de agua */}
                <div style={{
                    position: 'absolute', bottom: 6, right: 10, zIndex: 10,
                    color: `${config.text_color}28`, fontSize: '0.55rem', letterSpacing: '0.1em',
                }}>
                    powered by INGRESO VIP
                </div>
            </div>
        </>
    );
}
