import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { InvitationData } from '../../../types';
import { Loader2, Heart } from 'lucide-react';

import CountdownRenderer from './components/CountdownRenderer';
import EventCardRenderer from './components/EventCardRenderer';
import GalleryRenderer from './components/GalleryRenderer';
import GiftsRenderer from './components/GiftsRenderer';
import SocialRenderer from './components/SocialRenderer';

import ExtraInfoRenderer from './components/ExtraInfoRenderer';
import FooterRenderer from './components/FooterRenderer';

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

export default function InvitationRenderer() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [viewState, setViewState] = useState<'envelope' | 'opening' | 'music_choice' | 'content'>('envelope');
    const [isPlaying, setIsPlaying] = useState(false);

    // Datos del invitado obtenidos de la URL y BD
    const guestNameParam = searchParams.get('guest');
    const [guestData, setGuestData] = useState<{ name: string; passes: number; companions: string[] }>({
        name: guestNameParam || '',
        passes: 1,
        companions: []
    });



    useEffect(() => {
        const fetchInvitation = async () => {
            if (!id) return;
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
    }, [id]);

    useEffect(() => {
        if (!loading && invitation && viewState === 'envelope') {
            const timer = setTimeout(() => {
                setViewState('music_choice');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [loading, invitation, viewState]);

    // Fetch Guest Data
    useEffect(() => {
        const fetchGuestData = async () => {
            if (!guestNameParam || !id) return;
            try {
                const searchTerm = guestNameParam.split(' ')[0];
                const { data } = await supabase
                    .from('guests')
                    .select('first_name, last_name, passes, companions')
                    .eq('event_id', id)
                    .ilike('first_name', `${searchTerm}%`);

                if (data && data.length > 0) {
                    // Buscamos la coincidencia exacta del nombre completo
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
    }, [guestNameParam, id]);

    const handleEnter = (withMusic: boolean) => {
        setIsPlaying(withMusic);
        setViewState('content');
    };

    const downloadICS = () => {
        if (!invitation?.ceremony_section?.start_time) return;
        const startDate = new Date(invitation.ceremony_section.start_time);
        const endDate = new Date(startDate.getTime() + (4 * 60 * 60 * 1000));
        const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
        const icsContent = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
            `SUMMARY:Boda de ${invitation.hero_section?.title || 'Laura y Raul'}`,
            `DTSTART:${formatDate(startDate)}`, `DTEND:${formatDate(endDate)}`,
            `LOCATION:${invitation.ceremony_section?.address || ''}`,
            `DESCRIPTION:${invitation.hero_section?.subtitle || '¡Nos casamos!'}\\n\\nInvitación Web: ${window.location.href}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\n');
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'agendar_boda.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
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

    // --- VISTAS ---

    if (viewState === 'envelope') {
        return (
            <div className="min-h-screen flex items-center justify-center overflow-hidden relative transition-colors duration-500" style={{ backgroundColor: themeColors.bg }}>
                <Heart fill={themeColors.primary} className="w-24 h-24 animate-pulse relative z-10" style={{ color: themeColors.primary }} />
            </div>
        );
    }

    if (viewState === 'music_choice') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative overflow-hidden" style={{ backgroundColor: themeColors.bg }}>
                <div className="relative z-10 max-w-3xl w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                    {/* SALUDO MOVIDO AQUÍ */}
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
        );
    }

    const fontFamily = invitation.font_family || 'Great Vibes';
    const customFontUrl = invitation.custom_font_url;

    return (
        <div className="min-h-screen bg-stone-50 text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-100">
            <style>
                {fontFamily === 'custom' && customFontUrl ? `
                    @font-face { font-family: 'CustomFont'; src: url("${customFontUrl}") format('truetype'); font-weight: normal; font-style: normal; font-display: swap; }
                ` : ''}
                {`
                    .font-serif { 
                        font-family: ${fontFamily === 'custom' ? '"CustomFont"' : `"${fontFamily}"`}, serif !important;
                        letter-spacing: ${invitation.letter_spacing || 0.03}em;
                        font-weight: ${invitation.font_weight || 'normal'};
                    }
                    body { font-size: ${invitation.font_size || 18}px; }
                    ${fontFamily === 'Great Vibes'
                        ? `.font-serif { font-size: calc(2.5em + ${(invitation.font_size || 18) - 16}px); line-height: 1.2; }`
                        : `.font-serif { font-size: calc(1.5em + ${(invitation.font_size || 18) - 16}px); }`
                    }
                    p, span, div { letter-spacing: ${invitation.letter_spacing || 0.03}em; }
                    h1, h2, h3, h4, h5, h6 { letter-spacing: ${(invitation.letter_spacing || 0.03) + 0.02}em; }
                    .text-shadow-soft { text-shadow: 0 4px 12px rgba(0,0,0,0.4); }
                    @keyframes pulse-soft { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.9; } }
                    .animate-pulse-soft { animation: pulse-soft 2s infinite; }
                `}
            </style>

            {/* MÚSICA */}
            {(invitation.hero_section as any)?.music?.url && isPlaying && (
                <div className="fixed bottom-6 right-6 z-50">
                    <iframe
                        width="0" height="0"
                        src={`https://www.youtube.com/embed/${getYouTubeID((invitation.hero_section as any).music.url)}?autoplay=1&start=${(invitation.hero_section as any).music.start || 0}&loop=1&playlist=${getYouTubeID((invitation.hero_section as any).music.url)}`}
                        title="Music" allow="autoplay" className="hidden"
                    ></iframe>
                </div>
            )}

            {/* HEADER */}
            <header className="relative h-screen flex items-center justify-center text-center text-white overflow-hidden">
                <div className="absolute inset-0">
                    <img src={invitation.cover_image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552'} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <div className="relative z-10 p-4 w-full h-full flex flex-col items-center justify-center pb-16">
                    <p className="text-lg md:text-2xl font-light mb-0 tracking-[0.4em] uppercase text-shadow-soft font-sans opacity-90">
                        {invitation.hero_section?.subtitle || '¡NOS CASAMOS!'}
                    </p>
                    <h1 className="text-[15vw] md:text-[12vw] font-serif leading-[0.9] text-shadow-soft py-2 w-full break-words">
                        {invitation.hero_section?.title || 'Nombre & Nombre'}
                    </h1>
                    {invitation.hero_section?.show_date && (
                        <button onClick={downloadICS} className="group inline-block border-t border-b border-white/60 py-3 px-8 mt-6 backdrop-blur-sm shadow-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer animate-pulse-soft">
                            <span className="text-xl md:text-3xl tracking-[0.2em] uppercase font-light text-shadow-soft block group-hover:scale-105 transition-transform">
                                {(invitation.ceremony_section?.start_time || (invitation.countdown_section as any)?.target_date)
                                    ? new Date(invitation.ceremony_section?.start_time || (invitation.countdown_section as any)?.target_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
                                    : 'FECHA POR DEFINIR'}
                            </span>
                            <span className="text-[10px] md:text-xs tracking-widest uppercase mt-2 block opacity-80 font-medium text-shadow-soft">AGENDAR FECHA</span>
                        </button>
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
        </div>
    );
}
