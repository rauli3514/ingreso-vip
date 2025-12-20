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

export default function GuestApp() {
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

    // Get theme colors
    const theme = getThemeById(event?.theme_id || 'default');
    const themeColors = theme?.colors || {
        primary: '#6b21a8',
        secondary: '#581c87',
        accent: '#FBBF24',
        background: '#1a1030'
    };

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
                .select('id, event_id, status, first_name, last_name, display_name, table_info, assigned_video_url')
                .eq('event_id', id);

            if (guestsError) throw guestsError;
            setGuests(guestsData || []);

        } catch (error) {
            console.error('Error loading event data:', error);
            setEvent({
                id: '123',
                name: 'Evento de Demostración',
                date: '2025-12-25',
                theme_background_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098',
                is_approved: true
            } as any);
            setGuests([
                { id: '1', first_name: 'Juan', last_name: 'Pérez', display_name: 'Juan Pérez', table_info: 'Mesa 5', assigned_video_url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
                { id: '2', first_name: 'María', last_name: 'Gómez', display_name: 'María Gómez', table_info: 'Mesa 1' },
            ] as any);
        } finally {
            setLoading(false);
        }
    };

    const toggleMic = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Tu navegador no soporta búsqueda por voz.');
            return;
        }

        if (isListening) return;

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
        setView('video');

        // Reproducir video si existe
        const videoUrl = guest.assigned_video_url || event?.video_url_default;
        if (videoUrl && videoRef.current) {
            setTimeout(() => {
                videoRef.current?.play().catch(err => console.log('Autoplay prevented:', err));
            }, 500);
        }
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
                                            href="https://wa.me/5491234567890"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200"
                                        >
                                            <WhatsAppIcon />
                                        </a>
                                        <a
                                            href="https://instagram.com/ingresovip"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white/80 hover:text-white transition-colors hover:scale-110 transform duration-200"
                                        >
                                            <Instagram size={24} />
                                        </a>
                                        <a
                                            href="https://tiktok.com/@ingresovip"
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
                                                            {guest.table_info || 'Sin mesa'}
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

                    {/* VIDEO VIEW (Simple - Solo video) */}
                    {view === 'video' && selectedGuest && (
                        <motion.div
                            key="video"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative w-full h-full"
                            style={{
                                background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.primary}, ${themeColors.background})`
                            }}
                        >
                            <div className="flex flex-col items-center justify-center h-full p-8">
                                {/* Video Section */}
                                <div className="w-full max-w-4xl mb-12">
                                    {selectedGuest.assigned_video_url || event.video_url_default ? (
                                        <video
                                            ref={videoRef}
                                            src={selectedGuest.assigned_video_url || event.video_url_default}
                                            className="w-full h-auto rounded-3xl shadow-2xl"
                                            controls
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            style={{ boxShadow: `0 20px 60px ${themeColors.primary}66` }}
                                        />
                                    ) : (
                                        <div className="text-center text-white">
                                            <h3 className="text-3xl font-bold mb-4">
                                                {selectedGuest.display_name || `${selectedGuest.first_name} ${selectedGuest.last_name}`}
                                            </h3>
                                            <p className="text-white/70">No hay video disponible para este invitado</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
}
