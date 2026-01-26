import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Music, Plus, Heart, ThumbsUp } from 'lucide-react';
import { PlaylistRequest } from '../../../../types';

interface Props {
    eventId: string;
    title?: string;
    subtitle?: string;
    spotifyPlaylistUrl?: string;
    themeColor?: string;
    guestName?: string;
}

export default function PlaylistRenderer({
    eventId,
    title = "Playlist Colaborativa",
    subtitle = "Ayúdanos a crear la mejor playlist",
    spotifyPlaylistUrl,
    themeColor = '#1DB954',
    guestName
}: Props) {
    const [songs, setSongs] = useState<PlaylistRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [formVisible, setFormVisible] = useState(false);
    const [formData, setFormData] = useState({
        songName: '',
        artistName: '',
        guestName: guestName || ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Update form guest name if prop changes
    useEffect(() => {
        if (guestName) setFormData(prev => ({ ...prev, guestName }));
    }, [guestName]);



    // Extraer Spotify playlist ID del URL con lógica robusta
    const getSpotifyEmbedUrl = () => {
        if (!spotifyPlaylistUrl) return null;
        const val = spotifyPlaylistUrl.trim();

        // CASO 1: El usuario pegó todo el código <iframe>
        if (val.includes('<iframe') && val.includes('src="')) {
            const srcMatch = val.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) return srcMatch[1];
        }

        // CASO 2: URI de Spotify (spotify:playlist:...)
        if (val.startsWith('spotify:playlist:')) {
            const id = val.split(':')[2];
            return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;
        }

        // CASO 3: URL Web (https://open.spotify.com/...)
        try {
            // Limpiamos la URL para evitar problemas con query params extraños
            // Pero mantenemos los necesarios si fuera un embed ya hecho
            const urlObj = new URL(val.startsWith('http') ? val : `https://${val}`);
            const pathSegments = urlObj.pathname.split('/').filter(Boolean);

            // Detectar ID de playlist
            const playlistIndex = pathSegments.indexOf('playlist');
            if (playlistIndex !== -1 && pathSegments[playlistIndex + 1]) {
                const id = pathSegments[playlistIndex + 1];
                return `https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`;
            }

            // Detectar si es un link de embed directo que el usuario copió
            if (pathSegments.includes('embed') && pathSegments.includes('playlist')) {
                return val; // Ya es un link de embed, confiamos en él
            }

        } catch (e) {
            console.warn('Error parseando URL de Spotify:', e);
        }

        // Fallback: Regex simple para intentar rescatar algo si lo anterior falla
        const match = val.match(/playlist[\/:]([a-zA-Z0-9]+)/);
        if (match && match[1]) {
            return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0`;
        }

        return null;
    };

    const embedUrl = getSpotifyEmbedUrl();

    useEffect(() => {
        fetchSongs();

        const channel = supabase
            .channel('playlist-requests')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'playlist_requests',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    fetchSongs();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    const fetchSongs = async () => {
        try {
            const { data, error } = await supabase
                .from('playlist_requests')
                .select('*')
                .eq('event_id', eventId)
                .order('vote_count', { ascending: false })
                .limit(50);

            if (error) throw error;
            setSongs(data || []);
        } catch (error) {
            console.error('Error fetching songs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.songName || !formData.artistName) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('playlist_requests')
                .insert({
                    event_id: eventId,
                    song_name: formData.songName,
                    artist_name: formData.artistName,
                    guest_name: formData.guestName || 'Anónimo',
                    vote_count: 1,
                    status: 'pending'
                });

            if (error) throw error;

            setFormData(prev => ({ ...prev, songName: '', artistName: '' }));
            setFormVisible(false);
            fetchSongs(); // Instant update
        } catch (error) {
            console.error('Error adding song:', error);
            alert('Error al agregar canción. Intenta nuevamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (songId: string, currentVotes: number) => {
        // Optimistic update
        setSongs(prev => prev.map(s => s.id === songId ? { ...s, vote_count: s.vote_count + 1 } : s));

        try {
            const { error } = await supabase
                .from('playlist_requests')
                .update({ vote_count: currentVotes + 1 })
                .eq('id', songId);

            if (error) throw error;
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    return (
        <section id="playlist" className="py-20 bg-white">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 text-white shadow-lg animate-bounce" style={{ backgroundColor: themeColor }}>
                        <Music size={32} />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif text-slate-900 mb-4">{title}</h2>
                    <p className="text-slate-600 font-light text-lg max-w-2xl mx-auto">{subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Spotify Embed */}
                    <div className="w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl ring-1 ring-slate-900/5 aspect-[4/5] md:aspect-auto md:h-[600px]">
                        {embedUrl ? (
                            <iframe
                                src={embedUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy"
                                className="w-full h-full"
                            ></iframe>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                                <Music size={48} className="mb-4 opacity-50" />
                                {spotifyPlaylistUrl ? (
                                    <div className="text-red-400">
                                        <p className="font-bold">Error de Configuración</p>
                                        <p className="text-xs mt-1">El link de la playlist no es válido.</p>
                                        <p className="text-[10px] mt-2 opacity-70 break-all max-w-[200px] mx-auto">{spotifyPlaylistUrl}</p>
                                    </div>
                                ) : (
                                    <p>Spotify Playlist no configurada</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Suggestions List & Form */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-800 text-xl">Sugerencias</h3>
                                <button
                                    onClick={() => setFormVisible(!formVisible)}
                                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider py-2 px-4 rounded-full text-white transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    <Plus size={16} />
                                    {formVisible ? 'Cerrar' : 'Sugerir Canción'}
                                </button>
                            </div>

                            {formVisible && (
                                <form onSubmit={handleSubmit} className="mb-8 animate-in slide-in-from-top-2 duration-300 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Nombre de la canción"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm"
                                            style={{ '--tw-ring-color': themeColor } as any}
                                            value={formData.songName}
                                            onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Artista"
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm"
                                            style={{ '--tw-ring-color': themeColor } as any}
                                            value={formData.artistName}
                                            onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                                            required
                                        />
                                        {!guestName && (
                                            <input
                                                type="text"
                                                placeholder="Tu nombre (opcional)"
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all text-sm"
                                                style={{ '--tw-ring-color': themeColor } as any}
                                                value={formData.guestName}
                                                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                                            />
                                        )}
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-2.5 rounded-lg text-white font-bold text-sm uppercase tracking-wide transition-all hover:brightness-110 disabled:opacity-50"
                                            style={{ backgroundColor: themeColor }}
                                        >
                                            {submitting ? 'Enviando...' : 'Enviar Sugerencia'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <p className="text-center text-slate-400 py-4">Cargando sugerencias...</p>
                                ) : songs.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Heart size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Sé el primero en pedir un tema</p>
                                    </div>
                                ) : (
                                    songs.map((song) => (
                                        <div key={song.id} className="bg-white p-3 rounded-lg border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{song.song_name}</p>
                                                <p className="text-xs text-slate-500">{song.artist_name}</p>
                                                {(song as any).guest_name && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Por: {(song as any).guest_name}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleVote(song.id, song.vote_count)}
                                                    className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors group"
                                                >
                                                    <ThumbsUp size={14} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-xs font-bold">{song.vote_count}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                    border-radius: 20px;
                }
            `}</style>
        </section>
    );
}
