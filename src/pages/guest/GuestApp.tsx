import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Event, Guest } from '../../types';
import { Search, Mic, ArrowRight, Play } from 'lucide-react';

export default function GuestApp() {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'welcome' | 'search' | 'result'>('welcome');
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

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

            // Fetch Guests (Optimized: select only needed fields)
            const { data: guestsData, error: guestsError } = await supabase
                .from('guests')
                .select('id, event_id, status, first_name, last_name, display_name, table_info, assigned_video_url')
                .eq('event_id', id);

            if (guestsError) throw guestsError;
            setGuests(guestsData || []);

        } catch (error) {
            console.error('Error loading event data:', error);
            // Fallback for demo
            if (id === '123' || !id) {
                setEvent({
                    id: '123',
                    name: 'Boda de Prueba & Demo',
                    date: '2025-12-25',
                    theme_background_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop',
                    is_approved: true
                } as any);
                setGuests([
                    { id: '1', first_name: 'Juan', last_name: 'Perez', display_name: 'Juan Perez', table_info: 'Mesa 5' },
                    { id: '2', first_name: 'Maria', last_name: 'Gomez', display_name: 'Maria Gomez', table_info: 'Mesa 1' },
                    { id: '3', first_name: 'Carlos', last_name: 'Lopez', display_name: 'Charlie', table_info: 'VIP' },
                ] as any);
            }
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
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-[#FBBF24]">Cargando experiencia...</div>;
    if (!event) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Evento no encontrado</div>;

    const bgImage = event.theme_background_url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop';

    return (
        <div className="fixed inset-0 bg-black text-white font-['Outfit'] overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <img src={bgImage} className="w-full h-full object-cover opacity-40" alt="Background" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            <AnimatePresence mode="wait">
                {/* WELCOME VIEW */}
                {view === 'welcome' && (
                    <motion.div
                        key="welcome"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center"
                    >
                        {/* Custom Logo or Event Name */}
                        <div className="mb-12">
                            {event.theme_custom_logo_url ? (
                                <img src={event.theme_custom_logo_url} alt="Logo" className="w-32 h-32 object-contain drop-shadow-2xl" />
                            ) : (
                                <div className="w-32 h-32 rounded-full border-2 border-[#FBBF24] flex items-center justify-center bg-black/30 backdrop-blur-md shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                                    <span className="text-4xl font-bold text-[#FBBF24]">{event.name.charAt(0)}</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl font-bold mb-2 drop-shadow-md">{event.name}</h1>
                        <p className="text-slate-300 mb-12 text-lg">Bienvenido a la celebración</p>

                        <button
                            onClick={() => setView('search')}
                            className="group relative px-8 py-4 bg-[#FBBF24] text-black font-bold rounded-full text-lg shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:shadow-[0_0_30px_rgba(251,191,36,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
                        >
                            Entra para ver tu mesa
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <div className="absolute bottom-8 flex flex-col items-center gap-4">
                            <div className="flex gap-4 opacity-70">
                                {/* Social Icons Placeholders */}
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer">IG</div>
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 cursor-pointer">FB</div>
                            </div>
                            <div className="text-xs text-slate-500 font-medium tracking-widest uppercase">
                                Powered by <span className="text-[#FBBF24]">Tecno Eventos</span>
                            </div>
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
                        className="relative z-10 flex flex-col h-full p-6"
                    >
                        <div className="flex-none pt-8 pb-6">
                            <h2 className="text-2xl font-bold mb-6 text-center">¿Quién eres?</h2>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                                    <Search size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Escribe tu nombre completo..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    autoFocus
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-lg rounded-2xl py-4 pl-12 pr-14 focus:outline-none focus:border-[#FBBF24] focus:bg-black/50 transition-all shadow-xl"
                                />
                                <button
                                    onClick={toggleMic}
                                    className={`absolute inset-y-0 right-2 w-10 flex items-center justify-center text-slate-400 hover:text-[#FBBF24] transition-colors ${isListening ? 'text-red-500 animate-pulse' : ''}`}
                                >
                                    <Mic size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-6 px-6">
                            {searchQuery.length > 2 ? (
                                <div className="space-y-3">
                                    {filteredGuests.length > 0 ? filteredGuests.map(guest => (
                                        <motion.button
                                            key={guest.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => handleSelectGuest(guest)}
                                            className="w-full bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-[#FBBF24]/20 hover:border-[#FBBF24]/50 transition-all group text-left"
                                        >
                                            <div>
                                                <div className="font-bold text-lg group-hover:text-[#FBBF24] transition-colors">
                                                    {guest.first_name} {guest.last_name}
                                                </div>
                                                {guest.display_name && guest.display_name !== `${guest.first_name} ${guest.last_name}` && (
                                                    <div className="text-sm text-slate-400 italic">"{guest.display_name}"</div>
                                                )}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-[#FBBF24] group-hover:text-black transition-colors">
                                                <ArrowRight size={16} />
                                            </div>
                                        </motion.button>
                                    )) : (
                                        <div className="text-center py-8 text-slate-500">
                                            No encontramos invitados con ese nombre. <br /> Intenta escribir solo tu nombre o apellido.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500 opacity-50">
                                    <Search size={48} className="mb-4" />
                                    <p>Empieza a escribir para buscarte</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setView('welcome')}
                            className="flex-none py-4 text-slate-400 text-sm hover:text-white transition-colors text-center"
                        >
                            Volver al inicio
                        </button>
                    </motion.div>
                )}

                {/* RESULT VIEW */}
                {view === 'result' && selectedGuest && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative z-20 flex flex-col h-full bg-black"
                    >
                        {/* Video Player Mock */}
                        <div className="absolute inset-0 z-0 bg-slate-900">
                            {/* Here we would render the actual <video> tag */}
                            <div className="w-full h-full relative overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-60" alt="Video Placeholder" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full bg-[#FBBF24] flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(251,191,36,0.5)]">
                                        <Play size={40} className="text-black ml-2" />
                                    </div>
                                </div>
                                {/* Simulation of video playing UI */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                    <div className="h-full bg-[#FBBF24] w-1/3"></div>
                                </div>
                            </div>
                        </div>

                        {/* Overlay Content */}
                        <div className="relative z-10 flex flex-col justify-end h-full p-8 pb-16 bg-gradient-to-t from-black via-transparent to-transparent">
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-center"
                            >
                                <h3 className="text-slate-300 text-xl mb-2">Hola, {selectedGuest.first_name}</h3>
                                <div className="text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                                    TU MESA ES LA
                                </div>
                                <div className="text-8xl font-black text-[#FBBF24] drop-shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-110 transform">
                                    {selectedGuest.table_info ? selectedGuest.table_info.replace('Mesa ', '') : 'S/A'}
                                </div>
                                <div className="mt-8">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="text-sm text-slate-400 hover:text-white border border-white/20 px-4 py-2 rounded-full backdrop-blur-md bg-black/30"
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
