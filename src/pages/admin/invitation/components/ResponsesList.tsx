import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { InvitationResponse } from '../../../../types';
import { Download, CheckCircle, XCircle, Music } from 'lucide-react';

interface Props {
    eventId: string;
}

export default function ResponsesList({ eventId }: Props) {
    const [responses, setResponses] = useState<InvitationResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'ceremony' | 'party' | 'song'>('all');

    useEffect(() => {
        fetchResponses();
    }, [eventId]);

    const fetchResponses = async () => {
        try {
            const { data, error } = await supabase
                .from('invitation_responses')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResponses(data || []);
        } catch (error) {
            console.error('Error fetching responses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResponses = responses.filter(r => filter === 'all' || r.type === filter);


    // Función simple de exportar CSV si no tenemos XLSX
    const exportToCSV = () => {
        const headers = ["Nombre", "Tipo", "Asistencia", "Mensaje", "Fecha"];
        const rows = responses.map(r => [
            r.full_name,
            r.type,
            r.attending ? "SI" : "NO",
            `"${r.message || ''}"`,
            new Date(r.created_at).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "invitados_confirmados.csv");
        document.body.appendChild(link);
        link.click();
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando respuestas...</div>;

    const stats = {
        total: responses.length,
        ceremony: responses.filter(r => r.type === 'ceremony' && r.attending).length,
        party: responses.filter(r => r.type === 'party' && r.attending).length,
        songs: responses.filter(r => r.type === 'song').length
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 font-bold uppercase">Total Respuestas</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-xs text-indigo-600 font-bold uppercase">Confirmados Fiesta</p>
                    <p className="text-2xl font-bold text-indigo-900">{stats.party}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                    <p className="text-xs text-emerald-600 font-bold uppercase">Confirmados Ceremonia</p>
                    <p className="text-2xl font-bold text-emerald-900">{stats.ceremony}</p>
                </div>
                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 shadow-sm">
                    <p className="text-xs text-pink-600 font-bold uppercase">Canciones Sugeridas</p>
                    <p className="text-2xl font-bold text-pink-900">{stats.songs}</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['all', 'ceremony', 'party', 'song'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {f === 'all' ? 'Ver Todos' : f === 'ceremony' ? 'Ceremonia' : f === 'party' ? 'Fiesta' : 'Música'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <Download size={16} /> Exportar CSV
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {filteredResponses.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <p>No hay respuestas aún.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3">Nombre</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Respuesta</th>
                                <th className="px-6 py-3">Mensaje / Detalle</th>
                                <th className="px-6 py-3">Fecha</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredResponses.map((res) => (
                                <tr key={res.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-3 font-medium text-slate-900">{res.full_name}</td>
                                    <td className="px-6 py-3 capitalize text-slate-600">
                                        {res.type === 'song' ? <span className="flex items-center gap-1.5"><Music size={14} className="text-pink-500" /> Canción</span> : res.type === 'party' ? 'Fiesta' : 'Ceremonia'}
                                    </td>
                                    <td className="px-6 py-3">
                                        {res.type === 'song' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Sugerencia</span>
                                        ) : res.attending ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircle size={12} /> Asistirá
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                <XCircle size={12} /> No Asistirá
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-slate-500 max-w-xs truncate" title={res.message}>
                                        {res.message || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">
                                        {new Date(res.created_at).toLocaleDateString()} {new Date(res.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
