import { useState, useEffect } from 'react';
import { Music, ThumbsUp, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { Event, PlaylistRequest } from '../../../../types';

interface PlaylistTabProps {
    event: Event;
}

export default function PlaylistTab({ event }: PlaylistTabProps) {
    const [requests, setRequests] = useState<PlaylistRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, [event.id]);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('playlist_requests')
                .select('*')
                .eq('event_id', event.id)
                .order('vote_count', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching playlist requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('playlist_requests')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('playlist_requests')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-4xl space-y-6">
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                    <Music size={18} className="text-[#FBBF24]" /> Playlist Colaborativa
                </h3>

                {loading ? (
                    <div className="text-center py-8 text-slate-400">Cargando sugerencias...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-xl border border-white/5">
                        <Music size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Aún no hay sugerencias de canciones por parte de los invitados.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {requests.map((req) => (
                            <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
                                        {req.vote_count}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-base">{req.song_name}</h4>
                                        <p className="text-xs text-slate-400">{req.artist_name || 'Artista desconocido'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {req.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(req.id, 'approved')}
                                                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                                title="Aprobar"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                                                title="Rechazar"
                                            >
                                                <X size={18} />
                                            </button>
                                        </>
                                    )}
                                    {req.status === 'approved' && (
                                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                            Aprobada
                                        </span>
                                    )}
                                    {req.status === 'rejected' && (
                                        <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                                            Rechazada
                                        </span>
                                    )}

                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        className="p-2 ml-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
