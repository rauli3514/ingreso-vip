import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { InvitationData } from '../../../types';
import { Loader2, Heart, Pause, Play } from 'lucide-react';
import { motion } from 'framer-motion';


import CountdownRenderer from './components/CountdownRenderer';
import EventCardRenderer from './components/EventCardRenderer';
import GalleryRenderer from './components/GalleryRenderer';
import GiftsRenderer from './components/GiftsRenderer';
import SocialRenderer from './components/SocialRenderer';
import ExtraInfoRenderer from './components/ExtraInfoRenderer';
import FooterRenderer from './components/FooterRenderer';

// Interfaces para Props del Editor
interface Props {
    previewData?: InvitationData;
    isEditable?: boolean;
    onElementClick?: (id: string) => void;
    onElementUpdate?: (id: string, updates: any) => void;
}

// Wrapper para elementos editables
const EditableWrapper = ({ children, isSelected, onClick, className = '' }: { children: React.ReactNode, isSelected: boolean, onClick: () => void, id?: string, className?: string }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`relative group transition-all duration-200 inline-block ${className} ${isSelected ? 'ring-2 ring-indigo-500 rounded-lg' : 'hover:ring-1 hover:ring-indigo-300/50 rounded-lg cursor-pointer'}`}
    >
        {children}
        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] px-1 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity z-50">
            Editar
        </div>
    </div>
);

// Mapeo CENTRAL de colores por tema
const THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string; bg: string }> = {
    rustic: { primary: '#5D7052', secondary: '#8A9A5B', accent: '#000000', bg: '#F4F5F0' },
    romantic: { primary: '#D48BA3', secondary: '#F3D1DC', accent: '#A64D79', bg: '#FFF5F8' },
    ocean: { primary: '#0891B2', secondary: '#22D3EE', accent: '#164E63', bg: '#ECFEFF' },
    coral: { primary: '#F87171', secondary: '#FCA5A5', accent: '#B91C1C', bg: '#FEF2F2' },
    forest: { primary: '#059669', secondary: '#34D399', accent: '#064E3B', bg: '#ECFDF5' },
    lavender: { primary: '#A78BFA', secondary: '#C4B5FD', accent: '#6D28D9', bg: '#F5F3FF' },
    golden: { primary: '#D97706', secondary: '#FBBF24', accent: '#92400E', bg: '#FFFBEB' },
    navy: { primary: '#1E3A8A', secondary: '#3B82F6', accent: '#1E40AF', bg: '#EFF6FF' },
    terracotta: { primary: '#C2410C', secondary: '#FB923C', accent: '#7C2D12', bg: '#FFF7ED' },
    mint: { primary: '#10B981', secondary: '#6EE7B7', accent: '#065F46', bg: '#F0FDF4' },
    burgundy: { primary: '#991B1B', secondary: '#DC2626', accent: '#7F1D1D', bg: '#FEF2F2' },
    peach: { primary: '#FB923C', secondary: '#FED7AA', accent: '#C2410C', bg: '#FFF7ED' },
    sage: { primary: '#84CC16', secondary: '#BEF264', accent: '#4D7C0F', bg: '#F7FEE7' },
    plum: { primary: '#7C3AED', secondary: '#A78BFA', accent: '#5B21B6', bg: '#FAF5FF' },
    rosegold: { primary: '#BE7C68', secondary: '#E5B299', accent: '#8B5A3C', bg: '#FFF5F0' },
    black: { primary: '#EAB308', secondary: '#FDE047', accent: '#CA8A04', bg: '#18181B' },
    champagne: { primary: '#C9A96E', secondary: '#E8D4A2', accent: '#9B7F4A', bg: '#FDFBF7' },
};

// Mapeo de colores de fondo por tema (para SectionDivider)
const THEME_BACKGROUNDS: Record<string, string> = {
    rustic: '#F4F5F0',
    romantic: '#FFF5F8',
    ocean: '#ECFEFF',
    coral: '#FEF2F2',
    forest: '#ECFDF5',
    lavender: '#F5F3FF',
    golden: '#FFFBEB',
    navy: '#EFF6FF',
    terracotta: '#FFF7ED',
    mint: '#F0FDF4',
    burgundy: '#FEF2F2',
    peach: '#FFF7ED',
    sage: '#F7FEE7',
    plum: '#FAF5FF',
    rosegold: '#FFF5F0',
    black: '#18181B',
    champagne: '#FDFBF7',
};

function SectionDivider({ theme = 'elegant' }: { theme?: string }) {
    const fillColor = THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS['elegant'];
    return (
        <div className="absolute -bottom-1 left-0 w-full overflow-hidden leading-[0] z-20">
            <svg className="relative block w-full h-[60px] md:h-[120px]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                <path d="M0,120 Q600,0 1200,120 H0 Z" fill={fillColor}></path>
            </svg>
        </div>
    );
}

function getYouTubeID(url: string) {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}



export default function InvitationRenderer({ previewData, isEditable = false, onElementClick, onElementUpdate }: Props) {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [musicReady, setMusicReady] = useState(false);
    const [youtubePlayer, setYoutubePlayer] = useState<any>(null);
    // Inicializar state con previewData si existe, para edición instantánea
    const [invitation, setInvitation] = useState<InvitationData | null>(previewData || null);
    // Si estamos editando, saltamos directo al contenido
    const [viewState, setViewState] = useState<'envelope' | 'opening' | 'music_choice' | 'main_card' | 'content'>(isEditable ? 'content' : 'envelope');
    const [isPlaying, setIsPlaying] = useState(false);

    // Datos del invitado obtenidos de la URL y BD
    const guestNameParam = searchParams.get('guest');
    const [guestData, setGuestData] = useState<{ name: string; passes: number; companions: string[] }>({
        name: guestNameParam || '',
        passes: 1,
        companions: []
    });

    // Efecto para actualizar cuando previewData cambia (desde el editor)
    useEffect(() => {
        if (previewData) {
            setInvitation(previewData);
            setLoading(false);
            if (isEditable) setViewState('content');
        }
    }, [previewData, isEditable]);

    // Fetch Only if NOT Editing
    useEffect(() => {
        const fetchInvitation = async () => {
            if (!id || previewData) return; // Skip fetch if previewData is provided
            try {
                const { data, error } = await supabase
                    .from('event_invitations')
                    .select('*')
                    .eq('event_id', id)
                    .single();

                if (error) throw error;
                setInvitation(data);
            } catch (error) {
                console.error('Error fetching invitation:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvitation();
    }, [id, previewData]);

    useEffect(() => {
        if (!loading && invitation && viewState === 'envelope' && !isEditable) {
            const timer = setTimeout(() => {
                setViewState('music_choice');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [loading, invitation, viewState, isEditable]);

    // Fetch Guest Data Logic
    useEffect(() => {
        const fetchGuestData = async () => {
            if (!guestNameParam || !id || isEditable) return;
            try {
                const searchTerm = guestNameParam.split(' ')[0];
                const { data } = await supabase
                    .from('guests')
                    .select('first_name, last_name, passes, companions')
                    .eq('event_id', id)
                    .ilike('first_name', `${searchTerm}%`);

                if (data && data.length > 0) {
                    const match = data.find(g =>
                        `${g.first_name} ${g.last_name}`.trim().toLowerCase() === guestNameParam.toLowerCase()
                    );
                    if (match) {
                        setGuestData({
                            name: `${match.first_name} ${match.last_name}`,
                            passes: match.passes || 1,
                            companions: Array.isArray(match.companions) ? match.companions : []
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching guest data:', err);
            }
        };
        fetchGuestData();
    }, [guestNameParam, id, isEditable]);

    // YouTube IFrame API Setup
    useEffect(() => {
        const musicUrl = (invitation?.hero_section as any)?.music?.url;
        if (!musicUrl || isEditable) return;

        // Load YouTube IFrame API
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        // @ts-ignore
        window.onYouTubeIframeAPIReady = () => {
            setMusicReady(true);
        };

        return () => {
            // @ts-ignore
            window.onYouTubeIframeAPIReady = undefined;
        };
    }, [invitation, isEditable]);

    // Create YouTube Player when ready
    useEffect(() => {
        if (!musicReady || youtubePlayer || !invitation) return;

        const musicUrl = (invitation.hero_section as any)?.music?.url;
        if (!musicUrl) return;

        const videoId = getYouTubeID(musicUrl);
        if (!videoId) return;

        const startTime = (invitation.hero_section as any)?.music?.start || 0;

        // @ts-ignore
        const player = new window.YT.Player('youtube-player', {
            height: '1',
            width: '1',
            videoId: videoId,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
                start: startTime,
                loop: 1,
                playlist: videoId,
            },
            events: {
                onReady: (event: any) => {
                    console.log('YouTube player ready');
                    setYoutubePlayer(event.target);
                },
                onStateChange: (event: any) => {
                    console.log('YouTube player state:', event.data);
                }
            }
        });
    }, [musicReady, youtubePlayer, invitation]);

    const handleEnter = (withMusic: boolean) => {
        setIsPlaying(withMusic);

        // Iniciar reproducción si el usuario eligió música
        if (withMusic && youtubePlayer) {
            setTimeout(() => {
                try {
                    youtubePlayer.unMute();
                    youtubePlayer.setVolume(100);
                    youtubePlayer.playVideo();
                    console.log('Auto-playing music after user choice');
                } catch (error) {
                    console.error('Error auto-playing music:', error);
                }
            }, 500);
        }

        // Si hay tarjeta principal, mostramos ese paso intermedio
        if ((invitation as any)?.main_card_url) {
            setViewState('main_card');
        } else {
            setViewState('content');
        }
    };

    const addToCalendar = () => {
        if (!invitation?.ceremony_section?.start_time) return;

        const startDate = new Date(invitation.ceremony_section.start_time);
        const endDate = new Date(startDate.getTime() + (4 * 60 * 60 * 1000));

        // Formato para Google Calendar: YYYYMMDDTHHMMSSZ
        const formatGoogleDate = (date: Date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '');
        };

        const title = encodeURIComponent(`Boda de ${invitation.hero_section?.title || 'Invitación'}`);
        const details = encodeURIComponent(`${invitation.hero_section?.subtitle || '¡Nos casamos!'}\n\nInvitación: ${window.location.href}`);
        const location = encodeURIComponent(invitation.ceremony_section?.address || '');
        const startTime = formatGoogleDate(startDate);
        const endTime = formatGoogleDate(endDate);

        // URL de Google Calendar (compatible con móviles y desktop)
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;

        // Abrir en nueva ventana
        window.open(googleCalendarUrl, '_blank');
    };

    if (loading && !previewData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                <p className="text-slate-500 font-light tracking-widest animate-pulse">CARGANDO INVITACIÓN...</p>
            </div>
        );
    }

    if (!invitation) return <div className="p-10 text-center">Invitación no encontrada</div>;

    const currentTheme = invitation.theme_id || 'rustic';
    const themeColors = THEME_COLORS[currentTheme] || THEME_COLORS['rustic'];
    const advanced = (invitation.advanced_settings || {}) as NonNullable<InvitationData['advanced_settings']>;
    const canShowDecorations = advanced?.decorations && advanced.decorations.length > 0;

    // --- VISTAS INTRO (Solo si NO es editable) ---

    // --- GLOBAL MUSIC PLAYER Helper ---
    const handleMusicToggle = () => {
        if (!youtubePlayer) {
            console.warn('YouTube player not ready yet');
            return;
        }

        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);

        try {
            if (newPlayingState) {
                youtubePlayer.unMute();
                youtubePlayer.setVolume(100);
                youtubePlayer.playVideo();
                console.log('Playing music');
            } else {
                youtubePlayer.pauseVideo();
                console.log('Pausing music');
            }
        } catch (error) {
            console.error('Error controlling YouTube player:', error);
        }
    };

    const GlobalMusicPlayer = (invitation.hero_section as any)?.music?.url ? (
        <>
            <div
                id="youtube-player"
                className="fixed bottom-0 left-0 z-0"
                style={{ width: '1px', height: '1px', overflow: 'hidden', opacity: 0.01 }}
            ></div>
            {/* Botón flotante de control de música */}
            {viewState === 'content' && !isEditable && (
                <button
                    onClick={handleMusicToggle}
                    className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                    style={{ backgroundColor: themeColors.primary }}
                    aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
                >
                    {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" fill="white" />
                    ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                    )}
                </button>
            )}
        </>
    ) : null;

    if (viewState === 'envelope' && !isEditable) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center overflow-hidden relative transition-colors duration-500" style={{ backgroundColor: themeColors.bg }}>
                    <Heart fill={themeColors.primary} className="w-24 h-24 animate-pulse relative z-10" style={{ color: themeColors.primary }} />
                </div>
                {GlobalMusicPlayer}
            </>
        );
    }

    if (viewState === 'music_choice' && !isEditable) {
        return (
            <>
                <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative overflow-hidden" style={{ backgroundColor: themeColors.bg }}>
                    <div className="relative z-10 max-w-3xl w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        {guestData.name && (
                            <div className="mb-4 animate-in zoom-in duration-700">
                                <span
                                    className="inline-block px-8 py-3 rounded-full text-lg md:text-xl tracking-widest uppercase border-2 shadow-sm font-bold bg-white/50 backdrop-blur-sm"
                                    style={{ borderColor: themeColors.primary, color: themeColors.primary }}
                                >
                                    ¡Hola, {guestData.name}!
                                </span>
                            </div>
                        )}
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-5xl font-light leading-tight" style={{ color: themeColors.accent }}>
                                Bienvenidos a la invitación de
                            </h1>
                            <h2 className="text-4xl md:text-6xl font-serif leading-tight py-4" style={{ color: themeColors.primary }}>
                                {invitation.hero_section?.title || 'Los Novios'}
                            </h2>
                        </div>
                        <p className="text-lg md:text-xl font-light tracking-wide" style={{ color: themeColors.accent, opacity: 0.8 }}>
                            La música de fondo es parte de la experiencia
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-2xl mx-auto pt-6">
                            <button onClick={() => handleEnter(true)} className="flex-1 py-5 px-10 rounded-full font-bold uppercase tracking-widest text-base transition-all transform hover:scale-105 shadow-lg text-white border-2" style={{ backgroundColor: themeColors.primary, borderColor: themeColors.primary }}>
                                INGRESAR CON MÚSICA
                            </button>
                            <button onClick={() => handleEnter(false)} className="flex-1 py-5 px-10 rounded-full font-bold uppercase tracking-widest text-base transition-all transform hover:scale-105 shadow-lg border-2" style={{ borderColor: themeColors.primary, color: themeColors.primary, backgroundColor: 'transparent' }}>
                                INGRESAR SIN MÚSICA
                            </button>
                        </div>
                    </div>
                </div>
                {GlobalMusicPlayer}
            </>
        );
    }

    // --- VISTA TARJETA PRINCIPAL (NUEVO) ---
    if (viewState === 'main_card' && !isEditable) {
        const mainCardUrl = (invitation as any).main_card_url;
        return (
            <>
                <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-900">
                    {/* Fondo Borroso */}
                    {invitation.cover_image_url && (
                        <div className="absolute inset-0 z-0">
                            <img src={invitation.cover_image_url} className="w-full h-full object-cover blur-xl opacity-40 scale-110" />
                            <div className="absolute inset-0 bg-black/40"></div>
                        </div>
                    )}

                    {/* Contenido */}
                    <div className="relative z-20 flex flex-col items-center w-full max-w-md animate-in fade-in zoom-in duration-1000">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.8, type: "spring" }}
                            className="relative w-full aspect-[4/5] md:aspect-[3/4] mb-10"
                        >
                            {/* Glass Frame Effect (Liquid Glass) */}
                            <div className="w-full h-full p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] ring-1 ring-white/10 relative">
                                {/* Inner Image Container */}
                                <div className="w-full h-full rounded-xl overflow-hidden relative shadow-sm">
                                    <img src={mainCardUrl} className="w-full h-full object-cover" />
                                    {/* Overlay Gradient for Depth */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/10 pointer-events-none mix-blend-overlay"></div>
                                </div>

                                {/* Decorative Corner Shine */}
                                <div className="absolute -top-10 -left-10 w-20 h-20 bg-white/20 blur-xl rounded-full pointer-events-none"></div>
                                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-white/10 blur-xl rounded-full pointer-events-none"></div>
                            </div>
                        </motion.div>

                        <button
                            onClick={() => setViewState('content')}
                            className="group relative px-10 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/40 rounded-full text-white font-light tracking-[0.2em] uppercase transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 flex items-center gap-4 overflow-hidden"
                        >
                            <span className="relative z-10 text-sm font-medium text-shadow-sm">Ver más información</span>
                            <div className="relative z-10 w-6 h-6 rounded-full border border-white/50 flex items-center justify-center group-hover:translate-y-1 transition-transform duration-300">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                            </div>
                            {/* Button Shine Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </button>
                    </div>
                </div>
                {GlobalMusicPlayer}
            </>
        );
    }

    // --- VISTA CONTENIDO PRINCIPAL ---

    const fontFamily = invitation.font_family || 'Great Vibes';
    const customFontUrl = invitation.custom_font_url;

    return (
        <>
            <div
                className="min-h-screen bg-stone-50 text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-100 relative bg-white"
                style={{
                    // Zoom override for mobile editor view
                    zoom: isEditable ? 0.8 : 1
                } as React.CSSProperties}
            >
                <style>
                    {fontFamily === 'custom' && customFontUrl ? `
                    @font-face { font-family: 'CustomFont'; src: url("${customFontUrl}") format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
                ` : ''}
                    {`
                    :root {
                         --heading-scale: ${advanced.typography?.heading_scale || 1};
                         --body-scale: ${advanced.typography?.body_scale || 1};
                         --text-align: ${advanced.typography?.alignment || 'center'};
                    }
                    .font-serif { 
                        font-family: ${fontFamily === 'custom' ? '"CustomFont"' : `"${fontFamily}"`}, serif !important;
                        letter-spacing: ${invitation.letter_spacing || 0.03}em;
                        font-weight: ${invitation.font_weight || 'normal'};
                        text-align: var(--text-align);
                    }
                    body { font-size: calc(${invitation.font_size || 18}px * var(--body-scale)); }
                    h1, h2, h3 { transform: scale(var(--heading-scale)); transform-origin: center; }
                    
                    ${fontFamily === 'Great Vibes'
                            ? `.font-serif { font-size: calc(2.5em + ${(invitation.font_size || 18) - 16}px); line-height: 1.2; }`
                            : `.font-serif { font-size: calc(1.5em + ${(invitation.font_size || 18) - 16}px); }`
                        }
                    p, span, div { letter-spacing: ${invitation.letter_spacing || 0.03}em; }
                    .text-shadow-soft { text-shadow: 0 4px 12px rgba(0,0,0,0.4); }
                    @keyframes pulse-soft { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.9; } }
                    .animate-pulse-soft { animation: pulse-soft 2s infinite; }
                `}
                </style>



                {/* HEADER HERO */}
                <header className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
                    <div className="absolute inset-0">
                        <img src={invitation.cover_image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552'} alt="Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40"></div>
                    </div>
                    <div className="relative z-10 p-4 w-full h-full flex flex-col items-center justify-center pb-16">
                        {/* SUBTITULO EDITABLE */}
                        <div className="mb-0">
                            {isEditable ? (
                                <EditableWrapper id="subtitle" isSelected={false} onClick={() => onElementClick?.('subtitle')}>
                                    <p className="text-lg md:text-2xl font-light tracking-[0.4em] uppercase text-shadow-soft font-sans opacity-90">
                                        {invitation.hero_section?.subtitle || '¡NOS CASAMOS!'}
                                    </p>
                                </EditableWrapper>
                            ) : (
                                <p className="text-lg md:text-2xl font-light mb-0 tracking-[0.4em] uppercase text-shadow-soft font-sans opacity-90">
                                    {invitation.hero_section?.subtitle || '¡NOS CASAMOS!'}
                                </p>
                            )}
                        </div>

                        {/* TITULO EDITABLE */}
                        <div className="w-full">
                            {isEditable ? (
                                <EditableWrapper id="title" isSelected={false} onClick={() => onElementClick?.('title')}>
                                    <h1 className="text-[15vw] md:text-[8vw] font-serif leading-[0.9] text-shadow-soft py-2 w-full break-words">
                                        {invitation.hero_section?.title || 'Nombre & Nombre'}
                                    </h1>
                                </EditableWrapper>
                            ) : (
                                <h1 className="text-[15vw] md:text-[12vw] font-serif leading-[0.9] text-shadow-soft py-2 w-full break-words">
                                    {invitation.hero_section?.title || 'Nombre & Nombre'}
                                </h1>
                            )}
                        </div>

                        {invitation.hero_section?.show_date && (
                            <div className="mt-6">
                                {isEditable ? (
                                    <EditableWrapper id="date" isSelected={false} onClick={() => onElementClick?.('date')}>
                                        <button className="group inline-block border-t border-b border-white/60 py-3 px-8 backdrop-blur-sm shadow-lg bg-white/5 cursor-pointer">
                                            <span className="text-xl md:text-3xl tracking-[0.2em] uppercase font-light text-shadow-soft block">
                                                {(invitation.ceremony_section?.start_time)
                                                    ? new Date(invitation.ceremony_section?.start_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
                                                    : 'FECHA POR DEFINIR'}
                                            </span>
                                            <span className="text-[10px] md:text-xs tracking-widest uppercase mt-2 block opacity-80 font-medium text-shadow-soft">AGENDAR FECHA</span>
                                        </button>
                                    </EditableWrapper>
                                ) : (
                                    <button onClick={addToCalendar} className="group inline-block border-t border-b border-white/60 py-3 px-8 backdrop-blur-sm shadow-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer animate-pulse-soft">
                                        <span className="text-xl md:text-3xl tracking-[0.2em] uppercase font-light text-shadow-soft block group-hover:scale-105 transition-transform">
                                            {(invitation.ceremony_section?.start_time || (invitation.countdown_section as any)?.target_date)
                                                ? new Date(invitation.ceremony_section?.start_time || (invitation.countdown_section as any)?.target_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
                                                : 'FECHA POR DEFINIR'}
                                        </span>
                                        <span className="text-[10px] md:text-xs tracking-widest uppercase mt-2 block opacity-80 font-medium text-shadow-soft">AGENDAR FECHA</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <SectionDivider theme={invitation.theme_id || 'elegant'} />
                </header>

                {/* 2. CUENTA REGRESIVA */}
                {(invitation.countdown_section as any)?.show && (invitation.countdown_section as any)?.target_date && (
                    <CountdownRenderer
                        targetDate={(invitation.countdown_section as any).target_date}
                        title={(invitation.countdown_section as any).title}
                        subtitle={(invitation.countdown_section as any).subtitle}
                        theme={invitation.theme_id}
                    />
                )}

                {/* --- SECCIÓN DE PASES / INVITADOS (NUEVA) --- */}
                {guestData.name && (
                    <section className="py-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ backgroundColor: themeColors.bg + '50' }}>
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col items-center gap-6">
                                {/* Círculo con número de pases */}
                                <div
                                    className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold shadow-xl mb-2 border-4"
                                    style={{ backgroundColor: themeColors.primary, color: 'white', borderColor: themeColors.secondary }}
                                >
                                    {guestData.passes}
                                </div>

                                <h2 className="text-3xl font-sans font-light tracking-[0.2em] uppercase" style={{ color: themeColors.primary }}>
                                    INVITADOS
                                </h2>

                                {guestData.passes > 1 && (
                                    <p className="text-sm uppercase tracking-widest -mt-4 opacity-70" style={{ color: themeColors.accent }}>
                                        ({guestData.passes - 1} acompañante{guestData.passes > 2 ? 's' : ''})
                                    </p>
                                )}

                                <div className="flex flex-col gap-3 items-center w-full max-w-md mt-2">
                                    <div className="bg-stone-100/90 px-8 py-3 rounded-lg text-lg md:text-xl text-slate-700 shadow-sm backdrop-blur-sm min-w-[220px] font-medium capitalize">
                                        {guestData.name}
                                    </div>
                                    {guestData.companions && guestData.companions.map((comp, idx) => (
                                        <div key={idx} className="bg-stone-100/90 px-8 py-3 rounded-lg text-lg md:text-xl text-slate-700 shadow-sm backdrop-blur-sm min-w-[220px] capitalize">
                                            {comp}
                                        </div>
                                    ))}
                                </div>

                                <p className="text-sm italic opacity-60 mt-4 max-w-md mx-auto">
                                    Será un día inolvidable y queremos vivirlo con vos.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* 3. EVENTOS */}
                <div className="container mx-auto px-4 py-12 max-w-5xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(invitation.ceremony_section as any)?.show && (
                            <EventCardRenderer
                                title={(invitation.ceremony_section as any).title || 'Ceremonia'}
                                locationName={(invitation.ceremony_section as any).location_name}
                                address={(invitation.ceremony_section as any).address}
                                startTime={(invitation.ceremony_section as any).start_time}
                                mapUrl={(invitation.ceremony_section as any).map_url}
                                icon="church"
                                themeColor={themeColors.primary}
                            />
                        )}
                        {(invitation.party_section as any)?.show && (
                            <EventCardRenderer
                                title={(invitation.party_section as any).title || 'Fiesta'}
                                locationName={(invitation.party_section as any).location_name}
                                address={(invitation.party_section as any).address}
                                startTime={(invitation.party_section as any).start_time}
                                mapUrl={(invitation.party_section as any).map_url}
                                icon="party"
                                themeColor={themeColors.primary}
                            />
                        )}
                    </div>
                </div>

                {/* 4. GALERÍA */}
                {(invitation.gallery_section as any)?.show && (
                    <GalleryRenderer
                        title={(invitation.gallery_section as any).title}
                        subtitle={(invitation.gallery_section as any).subtitle}
                        images={(invitation.gallery_section as any).images}
                    />
                )}

                {/* 5. REGALOS */}
                {(invitation.gifts_section as any)?.show && (
                    <GiftsRenderer
                        title={(invitation.gifts_section as any).title}
                        subtitle={(invitation.gifts_section as any).subtitle}
                        content={(invitation.gifts_section as any).content || `Banco: ${(invitation.gifts_section as any).bank || 'N/A'}\nTitular: ${(invitation.gifts_section as any).owner || 'N/A'}\nCBU: ${(invitation.gifts_section as any).cbu || 'N/A'}\nAlias: ${(invitation.gifts_section as any).alias || 'N/A'}`}
                    />
                )}

                {/* 6. INFO EXTRA */}
                {(invitation.extra_info_section as any)?.show && (
                    <ExtraInfoRenderer
                        title={(invitation.extra_info_section as any).title}
                        subtitle={(invitation.extra_info_section as any).subtitle}
                        blocks={(invitation.extra_info_section as any).blocks}
                        onSuggestSong={() => {
                            const footerBtn = document.querySelector('footer button:nth-child(3)') as HTMLButtonElement;
                            if (footerBtn) footerBtn.click();
                        }}
                        themeColor={themeColors.primary}
                    />
                )}

                {/* 7. REDES SOCIALES */}
                {(invitation.social_section as any)?.show && (
                    <SocialRenderer
                        title={(invitation.social_section as any).title}
                        subtitle={(invitation.social_section as any).subtitle}
                        hashtag={(invitation.social_section as any).hashtag}
                        backgroundUrl={(invitation.social_section as any).background_url}
                        buttons={(invitation.social_section as any).buttons}
                    />
                )}

                {/* 8. FOOTER */}
                {(invitation.footer_section as any)?.show !== false && (
                    <FooterRenderer
                        sectionData={invitation.footer_section || {}}
                        eventId={id!}
                        invitationRowId={invitation.id}
                        names={invitation.hero_section?.title || ''}
                    />
                )}

                {/* --- CAPA DE DECORACIONES (Drag & Drop) - Z-INDEX ALTO --- */}
                {canShowDecorations && (
                    <div className="absolute inset-0 z-30 overflow-visible pointer-events-none">
                        {/* El contenedor cubre todo, pero deja pasar clicks. Los hijos capturan clicks si son editables. */}
                        <div className="relative w-full h-full">
                            {advanced.decorations!.map((deco: any, i: number) => (
                                <motion.div
                                    key={deco.id || i}
                                    drag={isEditable}
                                    dragMomentum={false}
                                    tabIndex={isEditable ? 0 : -1}
                                    onDragEnd={(_e, info) => {
                                        if (isEditable && onElementUpdate) {
                                            const newX = (deco.offset_x || 0) + info.offset.x;
                                            const newY = (deco.offset_y || 0) + info.offset.y;
                                            onElementUpdate(deco.id || `deco-${i}`, { offset_x: newX, offset_y: newY });
                                        }
                                    }}
                                    onClick={(e) => {
                                        if (isEditable) {
                                            e.stopPropagation();
                                            onElementClick?.(deco.id || `deco-${i}`);
                                        }
                                    }}
                                    animate={{
                                        x: deco.offset_x || 0,
                                        y: deco.offset_y || 0,
                                        scale: deco.scale || 1,
                                        rotate: deco.rotation || 0
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{
                                        position: 'absolute',
                                        // Usamos coordenadas base centradas para mayor predictibilidad al arrastrar
                                        left: deco.position === 'top-left' || deco.position === 'bottom-left' ? '10%' : deco.position === 'center' ? '50%' : 'auto',
                                        right: deco.position === 'top-right' || deco.position === 'bottom-right' ? '10%' : 'auto',
                                        top: deco.position === 'top-left' || deco.position === 'top-right' ? '10%' : deco.position === 'center' ? '40%' : 'auto',
                                        bottom: deco.position === 'bottom-left' || deco.position === 'bottom-right' ? '10%' : 'auto',
                                        marginLeft: deco.position === 'center' ? '-150px' : 0,
                                        marginTop: deco.position === 'center' ? '-150px' : 0,
                                        width: '300px', // Base más ancha
                                        zIndex: deco.z_index || 30, // Default alto
                                        filter: deco.filters || 'none',
                                        opacity: deco.opacity ?? 1,
                                        cursor: isEditable ? 'grab' : 'default',
                                        pointerEvents: isEditable ? 'auto' : 'none',
                                    }}
                                    className={`${isEditable ? 'active:cursor-grabbing hover:ring-2 hover:ring-indigo-400/50 rounded-lg outline-none' : ''}`}
                                >
                                    <img
                                        src={deco.url}
                                        alt="decoration"
                                        className="w-full h-full object-contain pointer-events-none select-none"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {GlobalMusicPlayer}
        </>
    );
}
