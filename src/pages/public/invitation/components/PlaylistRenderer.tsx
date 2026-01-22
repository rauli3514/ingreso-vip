import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Music, Plus, Heart, Play, ExternalLink } from 'lucide-react';

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
    subtitle = "Ayúdanos a crear la mejor playlist para nuestra celebración",
    spotifyPlaylistUrl,
    themeColor = '#1DB954' // Spotify green
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

    useEffect(() => {
        fetchSongs();

        // Real-time subscription
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
                .order('created_at', { ascending: false });

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
        <section className="py-24 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-96 h-96 bg-green-400 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400 rounded-full filter blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <Music size={56} className="mx-auto mb-4" style={{ color: themeColor }} strokeWidth={1.5} />
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                        {title}
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                        {subtitle}
                    </p>

                    {/* Spotify Playlist Link */}
                    {spotifyPlaylistUrl && (
                        <a
                            href={spotifyPlaylistUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#1DB954] hover:bg-[#1ed760] text-white px-8 py-4 rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        >
                            <Play size={20} fill="white" />
                            Escuchar en Spotify
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Add Song Button */}
                    <div className="flex justify-center mb-8">
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="bg-white hover:bg-green-50 text-green-700 border-2 border-green-500 px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all transform hover:scale-105"
                        >
                            <Plus size={24} />
                            Sugerir Canción
                        </button>
                    </div>

                    {/* Form */}
                    {showForm && (
                        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 border-2 border-green-200 animate-in slide-in-from-top-4">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Nombre de la Canción *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.songName}
                                        onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                                        placeholder="Ej: Bohemian Rhapsody"
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Artista *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.artist}
                                        onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                                        placeholder="Ej: Queen"
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Tu Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.suggestedBy}
                                        onChange={(e) => setFormData({ ...formData, suggestedBy: e.target.value })}
                                        placeholder="Tu nombre"
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-green-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Agregando...' : 'Agregar Canción'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Songs List */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                        <div className="bg-gradient-to-r from-green-500 to-teal-500 px-6 py-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Heart size={24} />
                                Canciones Sugeridas ({songs.length})
                            </h3>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-500">Cargando canciones...</div>
                        ) : songs.length === 0 ? (
                            <div className="p-12 text-center">
                                <Music size={48} className="mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500 font-medium">No hay canciones aún</p>
                                <p className="text-slate-400 text-sm">¡Sé el primero en sugerir!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                                {songs.map((song, index) => (
                                    <div
                                        key={song.id}
                                        className="px-6 py-4 hover:bg-green-50 transition-colors flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800">{song.song_name}</p>
                                            <p className="text-sm text-slate-600">{song.artist}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500">Sugerida por</p>
                                            <p className="text-sm font-medium text-green-700">{song.suggested_by}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
