import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Event, Guest } from '../../types';
import { Search, Mic, ArrowRight, Volume2 } from 'lucide-react';

export default function GuestApp() {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'welcome' | 'search' | 'result'>('welcome');
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [guests, setGuests] = useState<Guest[]>([]);
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        if (id) fetchEventData();
    }, [id]);

    const fetchEventData = async () => {
        try {
            // Fetch Event
            const { data: eventData, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (eventError) throw eventError;
            setEvent(eventData);

            // Fetch Guests
            const { data: guestsData, error: guestsError } = await supabase
                .from('guests')
                .select('id, event_id, status, first_name, last_name, display_name, table_info, assigned_video_url')
                .eq('event_id', id);

            if (guestsError) throw guestsError;
            setGuests(guestsData || []);

        } catch (error) {
            console.error('Error loading event data:', error);
            // Fallback for demo
            setEvent({
                id: '123',
                name: 'Evento de Demostración',
                date: '2025-12-25',
                theme_background_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop',
                is_approved: true
            } as any);
            setGuests([
                { id: '1', first_name: 'Juan', last_name: 'Pérez', display_name: 'Juan Pérez', table_info: 'Mesa 5' },
                { id: '2', first_name: 'María', last_name: 'Gómez', display_name: 'María Gómez', table_info: 'Mesa 1' },
                { id: '3', first_name: 'Carlos', last_name: 'López', display_name: 'Charlie', table_info: 'VIP' },
            ] as any);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
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

    const filteredGuests = searchQuery.length > 2
        ? guests.filter(g => {
            const fullName = `${g.first_name} ${g.last_name} ${g.display_name || ''}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        })
        : [];

    const handleSelectGuest = (guest: Guest) => {
        setSelectedGuest(guest);
        setView('result');

        // Play video if exists
        setTimeout(() => {
            if (videoRef.current) {
                videoRef.current.play().catch(err => console.log('Autoplay prevented:', err));
            }
        }, 500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-yellow-500 font-medium">Cargando experiencia...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Evento no encontrado</h2>
                    <p className="text-slate-400">Verifica el código QR e intenta nuevamente</p>
                </div>
            </div>
        );
    }

    const bgImage = event.theme_background_url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop';
    const videoUrl = selectedGuest?.assigned_video_url;

    return (
        <div className="fixed inset-0 bg-slate-950 text-white font-['Outfit'] overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <img src={bgImage} className="w-full h-full object-cover opacity-30" alt="Background" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/70 to-slate-950/90" />
            </div>

            <AnimatePresence mode="wait">
                {/* WELCOME VIEW */}
                {view === 'welcome' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-10 flex flex-col items-center justify-center min-h-screen p-6 text-center"
                    >
                        {/* Logo */}
                        <div className="mb-8">
                            {event.theme_custom_logo_url ? (
                                <img src={event.theme_custom_logo_url} alt="Logo" className="w-40 h-40 object-contain drop-shadow-2xl mx-auto" />
                            ) : (
                                <div className="w-32 h-32 mx-auto rounded-full border-4 border-yellow-500 flex items-center justify-center bg-slate-900/50 backdrop-blur-lg shadow-[0_0_40px_rgba(251,191,36,0.3)]">
                                    <span className="text-5xl font-bold text-yellow-500">{event.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-2xl bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">{event.name}</h1>
                        <p className="text-slate-300 mb-12 text-lg max-w-md">Bienvenido a nuestra celebración</p>

                        <button
                            onClick={() => setView('search')}
                            className="group px-10 py-5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-bold rounded-2xl text-lg shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:shadow-[0_0_40px_rgba(251,191,36,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            Encuentra tu mesa
                            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </button>

                        <div className="absolute bottom-8 text-xs text-slate-500 font-medium tracking-widest uppercase">
                            Powered by <span className="text-yellow-500">Tecno Eventos</span>
                        </div>
                    </motion.div>
                )}

                {/* SEARCH VIEW */}
                {view === 'search' && (
                    <motion.div
                        key="search"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="relative z-10 flex flex-col min-h-screen p-6 max-w-2xl mx-auto"
                    >
                        <div className="flex-none pt-8 pb-6">
                            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-200 to-yellow-500 bg-clip-text text-transparent">¿Quién eres?</h2>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                                    <Search size={22} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Escribe tu nombre completo..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-900/80 border-2 border-yellow-500/30 text-white placeholder:text-slate-500 text-lg rounded-2xl py-5 pl-14 pr-16 focus:outline-none focus:border-yellow-500 focus:bg-slate-900 transition-all shadow-xl backdrop-blur-sm"
                                />
                                <button
                                    onClick={toggleMic}
                                    className={`absolute inset-y-0 right-3 w-12 flex items-center justify-center rounded-xl transition-all ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10'}`}
                                >
                                    <Mic size={22} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto -mx-6 px-6 pb-20">
                            {searchQuery.length > 2 ? (
                                <div className="space-y-3">
                                    {filteredGuests.length > 0 ? filteredGuests.map(guest => (
                                        <motion.button
                                            key={guest.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            onClick={() => handleSelectGuest(guest)}
                                            className="w-full bg-slate-900/60 backdrop-blur-sm border-2 border-yellow-500/20 p-5 rounded-2xl flex items-center justify-between hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all group text-left"
                                        >
                                            <div>
                                                <div className="font-bold text-xl group-hover:text-yellow-500 transition-colors">
                                                    {guest.first_name} {guest.last_name}
                                                </div>
                                                {guest.display_name && guest.display_name !== `${guest.first_name} ${guest.last_name}` && (
                                                    <div className="text-sm text-slate-400 italic mt-1">"{guest.display_name}"</div>
                                                )}
                                            </div>
                                            <div className="w-12 h-12 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center group-hover:bg-yellow-500 group-hover:border-yellow-500 group-hover:text-slate-900 transition-all">
                                                <ArrowRight size={20} />
                                            </div>
                                        </motion.button>
                                    )) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <Search size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No encontramos invitados con ese nombre.</p>
                                            <p className="text-sm mt-2">Intenta escribir solo tu nombre o apellido.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500 opacity-50">
                                    <Search size={64} className="mb-4" />
                                    <p className="text-lg">Empieza a escribir para buscarte</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setView('welcome')}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 py-3 px-6 text-slate-400 text-sm hover:text-white transition-colors bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700 hover:border-slate-500"
                        >
                            ← Volver al inicio
                        </button>
                    </motion.div>
                )}

                {/* RESULT VIEW */}
                {view === 'result' && selectedGuest && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-20 flex flex-col h-full bg-slate-950"
                    >
                        {/* Video/Image Background */}
                        <div className="absolute inset-0 z-0">
                            {videoUrl ? (
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    playsInline
                                    muted
                                    loop
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full relative overflow-hidden">
                                    <img src={bgImage} className="w-full h-full object-cover opacity-50" alt="Background" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 rounded-full bg-yellow-500 flex items-center justify-center animate-pulse shadow-[0_0_60px_rgba(251,191,36,0.6)]">
                                            <Volume2 size={48} className="text-slate-900 ml-2" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        </div>

                        {/* Overlay Content */}
                        <div className="relative z-10 flex flex-col justify-end min-h-screen p-8 pb-20">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-center"
                            >
                                <h3 className="text-slate-300 text-2xl mb-3">¡Hola, {selectedGuest.first_name}!</h3>
                                <div className="text-4xl md:text-6xl font-black text-white mb-3 drop-shadow-2xl tracking-tight">
                                    TU MESA ES LA
                                </div>
                                <div className="text-7xl md:text-9xl font-black bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.9)] scale-110 transform mb-8">
                                    {selectedGuest.table_info ? selectedGuest.table_info.replace('Mesa ', '') : 'S/A'}
                                </div>
                                <div className="mt-8">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-base text-slate-300 hover:text-white border-2 border-yellow-500/30 hover:border-yellow-500 px-8 py-3 rounded-xl backdrop-blur-md bg-slate-900/50 hover:bg-yellow-500/10 transition-all"
                                    >
                                        Escanear de nuevo
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
