import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Music, Plus, Heart } from 'lucide-react';

interface Song {
    id: string;
    song_name: string;
    artist: string;
    suggested_by: string;
    created_at: string;
}

interface Props {
    eventId: string;
    title?: string;
    subtitle?: string;
    spotifyPlaylistUrl?: string;
    themeColor?: string;
}

export default function PlaylistRenderer({
    eventId,
    title = "Playlist Colaborativa",
    subtitle = "Ayúdanos a crear la mejor playlist",
    spotifyPlaylistUrl,
    themeColor = '#1DB954'
}: Props) {
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        songName: '',
        artist: '',
        suggestedBy: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const [timestamp] = useState(new Date().getTime());

    // Extraer Spotify playlist ID del URL
    const getSpotifyEmbedUrl = () => {
        if (!spotifyPlaylistUrl) return null;
        const match = spotifyPlaylistUrl.match(/playlist\/([a-zA-Z0-9]+)/);
        if (match) {
            return `https://open.spotify.com/embed/playlist/${match[1]}?utm_source=generator&theme=0&v=${timestamp}`;
        }
        return null;
    };

    const embedUrl = getSpotifyEmbedUrl();

    useEffect(() => {
        fetchSongs();

        const channel = supabase
            .channel('playlist-songs')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'playlist_songs',
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
                .from('playlist_songs')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false })
                .limit(50); // Muestra las últimas 50 sugerencias

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
        if (!formData.songName || !formData.artist || !formData.suggestedBy) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('playlist_songs')
                .insert({
                    event_id: eventId,
                    song_name: formData.songName,
                    artist: formData.artist,
                    suggested_by: formData.suggestedBy
                });

            if (error) throw error;

            setFormData({ songName: '', artist: '', suggestedBy: '' });
            setShowForm(false);
            alert('✓ ¡Canción agregada!');
        } catch (error) {
            console.error('Error adding song:', error);
            alert('Error al agregar la canción');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="py-16 bg-gradient-to-br from-green-50 to-teal-50">
            <div className="container mx-auto px-4">
                {/* Header Compacto */}
                <div className="text-center mb-8">
                    <Music size={40} className="mx-auto mb-3" style={{ color: themeColor }} strokeWidth={1.5} />
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                        {title}
                    </h2>
                    <p className="text-sm text-slate-600 max-w-xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Columna Izquierda: Spotify Player + Sugerir */}
                        <div className="space-y-4">
                            {/* Spotify Embed Player - COMPACT MODE */}
                            {embedUrl && (
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-green-200">
                                    <iframe
                                        src={embedUrl}
                                        width="100%"
                                        height="152"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        className="w-full"
                                        style={{ minHeight: '152px' }}
                                    ></iframe>
                                </div>
                            )}

                            {/* Botón Sugerir Compacto */}
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="w-full bg-transparent border-2 border-green-600 text-green-700 px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-green-50 transition-all"
                            >
                                <Plus size={18} />
                                {showForm ? 'Cerrar formulario' : 'Sugerir canción'}
                            </button>

                            {/* Form Compacto */}
                            {showForm && (
                                <div className="bg-white rounded-xl shadow-md p-6 border border-green-200">
                                    <form onSubmit={handleSubmit} className="space-y-3">
                                        <input
                                            type="text"
                                            value={formData.songName}
                                            onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                                            placeholder="Nombre de la canción"
                                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={formData.artist}
                                            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                            placeholder="Artista"
                                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={formData.suggestedBy}
                                            onChange={(e) => setFormData({ ...formData, suggestedBy: e.target.value })}
                                            placeholder="Tu nombre"
                                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                                            required
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                                            >
                                                {submitting ? 'Agregando...' : 'Agregar'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setShowForm(false)}
                                                className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 rounded-lg font-medium text-sm transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Columna Derecha: Lista de Canciones */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-green-200">
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 px-4 py-3">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Heart size={20} />
                                    Sugerencias ({songs.length})
                                </h3>
                            </div>

                            {loading ? (
                                <div className="p-8 text-center text-slate-500 text-sm">Cargando...</div>
                            ) : songs.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Music size={32} className="mx-auto mb-3 text-slate-300" />
                                    <p className="text-slate-500 text-sm">No hay canciones aún</p>
                                    <p className="text-slate-400 text-xs">¡Sé el primero!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                                    {songs.map((song) => (
                                        <div
                                            key={song.id}
                                            className="px-4 py-3 hover:bg-green-50 transition-colors"
                                        >
                                            <p className="font-semibold text-slate-800 text-sm">{song.song_name}</p>
                                            <p className="text-xs text-slate-600">{song.artist}</p>
                                            <p className="text-xs text-green-700 mt-1">por {song.suggested_by}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
