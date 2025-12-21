import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Event, Guest } from '../../types';
import { Search, Mic, Sparkles, Instagram } from 'lucide-react';
import { getThemeById } from '../../lib/themes';

// Iconos de redes sociales
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
);

// Helper for countdown
const calculateTimeRemaining = (targetTime: string) => {
    if (!targetTime) return null;
    const now = new Date();
    const [hours, minutes] = targetTime.split(':').map(Number);
    let target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // Si el target ya pasó hoy (ej: target 02:00, ahora 22:00), asumimos que es mañana
    if (target < now) {
        if (now.getHours() > 12 && target.getHours() < 12) {
            target.setDate(target.getDate() + 1);
        }
    }

    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return '¡YA PUEDES INGRESAR!';

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
};

export default function GuestApp() {
    console.log('🔄 GUEST APP UPDATED: FORCE RENDER v2025.9');
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'welcome' | 'search' | 'video'>('welcome');
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Timer for Trasnoche
    useEffect(() => {
        if (event?.after_party_time) {
            const updateTimer = () => {
                const left = calculateTimeRemaining(event.after_party_time || '');
                if (left) setTimeRemaining(left);
            };
            updateTimer();
            const interval = setInterval(updateTimer, 60000);
            return () => clearInterval(interval);
        }
    }, [event?.after_party_time]);

    // Get theme colors
    const theme = getThemeById(event?.theme_id || 'default');
    const themeColors = theme?.colors || {
        primary: '#6b21a8',
        secondary: '#581c87',
        accent: '#FBBF24',
        background: '#1a1030'
    };

    const getVideoUrl = (g: Guest) => {
        // 1. Prioridad: Video Específico del Invitado
        if (g.assigned_video_url) return g.assigned_video_url;

        // 2. Prioridad: Video de la Mesa
        if (g.table_info && event?.video_configuration) {
            const config = event.video_configuration;
            const tableInfo = g.table_info.trim(); // ej: "Mesa 1", "1", "mesa 1"

            // a) Coincidencia Exacta
            if (config[tableInfo]) return config[tableInfo];

            // b) Buscar ignorando mayúsculas/minúsculas
            const lowerTableInfo = tableInfo.toLowerCase();
            const configKeys = Object.keys(config);

            // Normalizar: Extraer solo el número o identificador (quitar "Mesa", "Table")
            const cleanTableNumber = lowerTableInfo.replace(/^(mesa|table)\s*/i, ''); // "1"

            // Buscar match flexible en las keys de la config
            const foundKey = configKeys.find(key => {
                const lowerKey = key.toLowerCase();
                const cleanKeyNumber = lowerKey.replace(/^(mesa|table)\s*/i, '');

                // Match exacto ignorando case
                if (lowerKey === lowerTableInfo) return true;

                // Match solo números (ej: config has "1" and guest has "Mesa 1")
                if (cleanKeyNumber === cleanTableNumber) return true;

                return false;
            });

            if (foundKey) return config[foundKey];
        }

        // 3. Fallback: Video Default del Evento
        return event?.video_url_default;
    };

    const [videoFinished, setVideoFinished] = useState(false);

    // 4. Fallback recovery for Autoplay with Sound
    useEffect(() => {
        if (view === 'video' && videoRef.current && selectedGuest && !videoFinished) {
            const videoEl = videoRef.current;

            // Intentamos reproducir
            const playPromise = videoEl.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Autoplay with sound failed. Fallback to muted.", error);
                    // Si falla el autoplay con sonido, lo intentamos muteado
                    if (videoEl) {
                        videoEl.muted = true;
                        videoEl.play().catch(e => console.error("Muted autoplay also failed", e));
                    }
                });
            }
        }
    }, [view, selectedGuest, videoFinished]);

    useEffect(() => {
        if (id) fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        try {
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (eventError) throw eventError;
            setEvent(eventData);

            const { data: guestsData, error: guestsError } = await supabase
                .from('guests')
                .select('id, event_id, status, first_name, last_name, display_name, table_info, assigned_video_url, is_after_party, has_puff')
                .eq('event_id', id);

            if (guestsError) throw guestsError;
            setGuests(guestsData || []);

        } catch (error) {
            console.error('Error loading event data:', error);
            // ... (mock data handling skipped for brevity but kept in file)
        } finally {
            setLoading(false);
        }
    };




    const toggleMic = () => {

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
            setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
    };

    const handleGuestSelect = (guest: Guest) => {
        setSelectedGuest(guest);
        setVideoFinished(false);
        setView('video');
    };

    // Función para normalizar texto (remover acentos)
    const normalizeText = (text: string) => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
    };

    const filteredGuests = searchQuery.length > 2
        ? guests.filter(g => {
            const fullName = `${g.first_name} ${g.last_name} ${g.display_name || ''}`;
            const normalizedFullName = normalizeText(fullName);
            const normalizedQuery = normalizeText(searchQuery);

            // Búsqueda flexible: permite coincidencias parciales
            return normalizedFullName.includes(normalizedQuery);
        })
        : [];

    if (loading) {
        return (
            <>
                <style>{`
                    :root {
                        --theme-primary: ${themeColors.primary};
                        --theme-secondary: ${themeColors.secondary};
                        --theme-accent: ${themeColors.accent};
                        --theme-bg: ${themeColors.background};
                    }
                `}</style>
                <div
                    className="min-h-screen flex items-center justify-center"
                    style={{ background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.primary}, ${themeColors.background})` }}
                >
                    <div className="text-center">
                        <div
                            className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                            style={{ borderColor: `${themeColors.accent} transparent transparent transparent` }}
                        ></div>
                        <p className="text-white/80 font-medium">Cargando experiencia...</p>
                    </div>
                </div>
            </>
        );
    }

    if (!event) {
        return (
            <div
                className="min-h-screen flex items-center justify-center text-white p-4"
                style={{ background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.primary}, ${themeColors.background})` }}
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Evento no encontrado</h2>
                    <p className="text-white/70">Verifica el código QR e intenta nuevamente</p>
                </div>
            </div>
        );
    }

    const bgImage = event.theme_background_url || 'https://images.unsplash.com/photo-5519167758481-83f550bb49b3?q=80&w=2098';

    return (
        <>
            <style>{`
                :root {
                    --theme-primary: ${themeColors.primary};
                    --theme-secondary: ${themeColors.secondary};
                    --theme-accent: ${themeColors.accent};
                    --theme-bg: ${themeColors.background};
                }
            `}</style>
            <div className="fixed inset-0 font-['Outfit'] overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <img src={bgImage} className="w-full h-full object-cover" alt="Background" />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: `linear-gradient(to bottom, ${themeColors.background}99, ${themeColors.background}66, ${themeColors.background}BB)`
                        }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    {/* WELCOME VIEW */}
                    {view === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full flex flex-col"
                        >
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                {/* Logo/Icon */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-8 p-8 rounded-full"
                                    style={{
                                        background: `radial-gradient(circle, ${themeColors.primary}33, ${themeColors.secondary}11)`,
                                        boxShadow: `0 0 60px ${themeColors.primary}66`
                                    }}
                                >
                                    <Sparkles size={80} className="text-white" strokeWidth={1.5} />
                                </motion.div>

                                {/* Event Name */}
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl"
                                    style={{
                                        textShadow: `0 0 30px ${themeColors.primary}88, 0 0 60px ${themeColors.secondary}66`
                                    }}
                                >
                                    {event.name}
                                </motion.h1>

                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl text-white/90 mb-12 font-light"
                                >
                                    ¡Entrá para ver tu mesa!
                                </motion.p>

                                {/* CTA Button */}
                                <motion.button
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    onClick={() => setView('search')}
                                    className="px-16 py-6 rounded-full text-white text-2xl font-bold shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                                    style={{
                                        background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
                                        boxShadow: `0 8px 32px ${themeColors.primary}66`,
                                        border: `3px solid ${themeColors.accent}`
                                    }}
                                >
                                    <Search size={28} />
                                    Buscar mi Nombre
                                </motion.button>
                            </div>

                            {/* Footer con redes sociales */}
                            <div className="pb-8 px-4">
                                <div className="flex flex-col items-center gap-4">
                                    {/* Social Links */}
                                    <div className="flex items-center gap-6">
                                        <a
                                            href="https://wa.me/543624055257"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200"
                                        >
                                            <WhatsAppIcon />
                                        </a>
                                        <a
                                            href="https://www.instagram.com/tecno_eventos_arg/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200"
                                        >
                                            <Instagram size={24} />
                                        </a>
                                        <a
                                            href="https://www.tiktok.com/@tecno_eventos_arg"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200"
                                        >
                                            <TikTokIcon />
                                        </a>
                                    </div>

                                    {/* Copyright */}
                                    <p className="text-white/60 text-sm">
                                        Todos los derechos reservados - <span className="font-semibold">INGRESO VIP by Tecno Eventos</span>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SEARCH VIEW */}
                    {view === 'search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full h-full"
                            style={{
                                background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.primary}, ${themeColors.background})`
                            }}
                        >
                            <div className="flex flex-col items-center justify-center h-full p-6">
                                <motion.h2
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-4xl md:text-5xl font-black text-white mb-4 text-center"
                                >
                                    Buscá tu Mesa
                                </motion.h2>

                                <p className="text-white/80 text-lg mb-8 text-center">
                                    Presioná el botón y decí tu nombre completo
                                </p>

                                {/* Search Container */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-full max-w-2xl space-y-4"
                                >
                                    {/* Voice Button (PRIMERO) */}
                                    <button
                                        onClick={toggleMic}
                                        className="w-full p-6 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl font-bold shadow-2xl"
                                        style={{
                                            background: isListening
                                                ? `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.primary})`
                                                : `${themeColors.primary}DD`,
                                            border: `2px solid ${themeColors.accent}${isListening ? 'FF' : '66'}`
                                        }}
                                    >
                                        <Mic size={32} className={`${isListening ? 'animate-pulse text-white' : 'text-white'}`} />
                                        <span className="text-white">
                                            {isListening ? 'Escuchando...' : 'Decir mi nombre'}
                                        </span>
                                    </button>

                                    {/* Text Input (DESPUÉS) */}
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={24} />
                                        <input
                                            type="text"
                                            placeholder="O escribe tu nombre completo..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full text-white placeholder:text-white/50 text-lg rounded-2xl py-5 pl-14 pr-6 focus:outline-none transition-all backdrop-blur-sm"
                                            style={{
                                                background: `${themeColors.background}80`,
                                                border: `2px solid ${themeColors.accent}33`,
                                                boxShadow: `0 4px 24px ${themeColors.primary}22`
                                            }}
                                        />
                                    </div>

                                    {/* Results */}
                                    {searchQuery && filteredGuests.length > 0 && (
                                        <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                                            {filteredGuests.map((guest) => (
                                                <button
                                                    key={guest.id}
                                                    onClick={() => handleGuestSelect(guest)}
                                                    className="w-full backdrop-blur-sm p-6 rounded-2xl text-white text-xl font-semibold transition-all"
                                                    style={{
                                                        background: `${themeColors.background}CC`,
                                                        border: `1px solid ${themeColors.accent}20`,
                                                        boxShadow: `0 4px 16px ${themeColors.primary}22`
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span>{guest.display_name || `${guest.first_name} ${guest.last_name}`}</span>
                                                        <div
                                                            className="px-4 py-1 rounded-full text-sm font-normal"
                                                            style={{ background: `${themeColors.accent}33`, color: themeColors.accent }}
                                                        >
                                                            {guest.is_after_party
                                                                ? '🌙 Trasnoche'
                                                                : guest.has_puff
                                                                    ? '🛋️ Espacio Living'
                                                                    : guest.table_info || 'Ingreso'}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery && searchQuery.length > 2 && filteredGuests.length === 0 && (
                                        <div className="text-center text-white/70 p-6">
                                            No se encontraron coincidencias
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* VIDEO VIEW (Resultados + Liquid Glass Fullscreen) */}
                    {view === 'video' && selectedGuest && (
                        <AnimatePresence mode="wait">
                            {/* 1. VIDEO PLAYER - ABSOLUTE FULLSCREEN OVERLAY */}
                            {getVideoUrl(selectedGuest) && !videoFinished && (
                                <motion.div
                                    key="video-player"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer"
                                    onClick={() => {
                                        // UNMUTE ON CLICK
                                        if (videoRef.current) {
                                            videoRef.current.muted = false;
                                            videoRef.current.volume = 1.0;
                                            videoRef.current.play().catch(() => { });
                                        }
                                    }}
                                >
                                    <video
                                        ref={videoRef}
                                        src={getVideoUrl(selectedGuest)}
                                        className="w-full h-full"
                                        style={{ objectFit: 'contain' }}
                                        autoPlay
                                        playsInline
                                        // Intentamos iniciar con sonido (muted={false} por defecto al no ponerlo o false explícito)
                                        muted={false}
                                        onEnded={() => setVideoFinished(true)}
                                        onError={() => setVideoFinished(true)}
                                    />
                                </motion.div>
                            )}

                            {/* 2. FINAL SCREEN - LIQUID GLASS FULLSCREEN */}
                            {(!getVideoUrl(selectedGuest) || videoFinished) && (
                                <motion.div
                                    key="final-result"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="fixed inset-0 z-40 flex flex-col items-center justify-center p-6 text-center overflow-hidden"
                                    style={{
                                        background: `radial-gradient(circle at center, ${themeColors.secondary}66, ${themeColors.background}DD)`,
                                        backdropFilter: 'blur(30px)',
                                        WebkitBackdropFilter: 'blur(30px)' // Safari support
                                    }}
                                >
                                    {/* Background decorative elements for "Liquid" feel */}
                                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                                        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] opacity-30"
                                            style={{
                                                background: `conic-gradient(from 0deg at 50% 50%, ${themeColors.primary}, ${themeColors.accent}, ${themeColors.secondary}, ${themeColors.primary})`,
                                                filter: 'blur(100px)',
                                                animation: 'spin 20s linear infinite'
                                            }}
                                        />
                                    </div>
                                    <style>{`
                                        @keyframes spin {
                                            from { transform: rotate(0deg); }
                                            to { transform: rotate(360deg); }
                                        }
                                    `}</style>

                                    {/* CONTENIDO PRINCIPAL */}
                                    <div className="relative z-10 flex flex-col items-center gap-8 max-w-4xl w-full">

                                        {/* Bienvenida / Header */}
                                        <motion.div
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-white/80 text-xl uppercase tracking-[0.2em] font-light"
                                        >
                                            Bienvenido
                                        </motion.div>

                                        {/* Nombre del Invitado */}
                                        <motion.h2
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-4xl md:text-6xl font-black text-white drop-shadow-2xl font-display mb-8"
                                            style={{ textShadow: `0 4px 20px ${themeColors.primary}88` }}
                                        >
                                            {selectedGuest.display_name || `${selectedGuest.first_name} ${selectedGuest.last_name}`}
                                        </motion.h2>

                                        {/* LOGICA DE CONTENIDO SEGÚN TIPO DE GUEST */}
                                        {selectedGuest.is_after_party && !selectedGuest.table_info && !selectedGuest.has_puff ? (
                                            // --- TRASNOCHE ONLY ---
                                            <div className="bg-black/20 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md w-full max-w-md shadow-2xl ring-1 ring-white/20">
                                                <div className="text-6xl mb-4 animate-bounce">🌙</div>
                                                <h3 className="text-2xl font-bold text-[#FBBF24] uppercase tracking-widest mb-2">Acceso Trasnoche</h3>
                                                <div className="text-5xl font-mono font-bold text-white tracking-wider my-4">
                                                    {timeRemaining || event?.after_party_time || "--:--"}
                                                </div>
                                                <p className="text-sm text-white/50 uppercase tracking-widest">Tiempo restante</p>
                                            </div>
                                        ) : selectedGuest.has_puff ? (
                                            // --- LIVING ---
                                            <div className="bg-white/10 p-10 rounded-[3rem] border border-white/20 backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.1)] ring-1 ring-white/30">
                                                <span className="text-6xl block mb-4">🛋️</span>
                                                <h1 className="text-5xl md:text-7xl font-bold text-white font-display uppercase tracking-tight">
                                                    Living
                                                </h1>
                                                <p className="text-white/70 mt-2 text-lg font-light tracking-wide">Tu espacio exclusivo</p>
                                            </div>
                                        ) : (
                                            // --- MESA ASIGNADA ---
                                            <div className="flex flex-col items-center">
                                                {selectedGuest.table_info ? (
                                                    <div className="relative group">
                                                        {/* Glass Card for Table */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-full group-hover:blur-2xl transition-all duration-700 opacity-50"></div>
                                                        <div
                                                            className="relative bg-black/20 p-12 px-16 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/20 flex flex-col items-center transform transition-transform hover:scale-105 duration-500"
                                                        >
                                                            <p className="text-blue-200 uppercase tracking-[0.3em] text-sm mb-4 font-semibold">Tu ubicación</p>
                                                            <h1 className="text-8xl md:text-9xl font-black text-white font-display tracking-tighter" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                                                {selectedGuest.table_info.replace(/^(mesa|table)\s*/i, '')}
                                                            </h1>
                                                            {(/^\d+$/.test(selectedGuest.table_info.replace(/^(mesa|table)\s*/i, '')) || selectedGuest.table_info.toLowerCase().includes('mesa')) && (
                                                                <div className="mt-4 px-6 py-2 rounded-full bg-[#FBBF24] text-black font-bold text-lg uppercase tracking-widest shadow-lg">
                                                                    Mesa
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // SIN MESA
                                                    <div className="bg-white/10 p-10 rounded-[3rem] border border-white/20 backdrop-blur-xl shadow-2xl">
                                                        <h1 className="text-5xl md:text-7xl font-bold text-white font-display leading-tight">
                                                            ¡PUEDES<br />INGRESAR!
                                                        </h1>
                                                    </div>
                                                )}

                                                {/* TRASNOCHE BADGE ON TABLE SCREEN */}
                                                {selectedGuest.is_after_party && (
                                                    <div className="mt-8 bg-[#FBBF24]/20 border border-[#FBBF24]/50 px-8 py-3 rounded-full backdrop-blur-md animate-pulse">
                                                        <span className="text-[#FBBF24] font-bold uppercase tracking-widest text-sm">✨ Invitado Trasnoche</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Logo del Evento (Footer) */}
                                        <div className="mt-12 opacity-60 hover:opacity-100 transition-opacity">
                                            {event?.theme_custom_logo_url ? (
                                                <img src={event.theme_custom_logo_url} className="h-16 md:h-20 object-contain drop-shadow-md" alt="Logo Evento" />
                                            ) : (
                                                <span className="text-white text-lg font-bold border-2 border-white px-4 py-2 rounded-lg">INGRESO VIP</span>
                                            )}
                                        </div>

                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </AnimatePresence>

            </div >
        </>
    );
}
