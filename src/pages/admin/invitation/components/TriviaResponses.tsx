import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { TriviaResponse } from '../../../../types';
import { Trophy } from 'lucide-react';

interface Props {
    eventId: string;
}

export default function TriviaResponses({ eventId }: Props) {
    const [responses, setResponses] = useState<TriviaResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResponses();
    }, [eventId]);

    const fetchResponses = async () => {
        try {
            const { data, error } = await supabase
                .from('trivia_responses')
                .select('*')
                .eq('event_id', eventId)
                .order('score', { ascending: false })
                .order('completed_at', { ascending: true }); // En caso de empate, el primero gana

            if (error) throw error;
            setResponses(data || []);
        } catch (error) {
            console.error('Error fetching trivia responses:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando respuestas...</div>;
    }

    if (responses.length === 0) {
        return (
            <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center">
                <Trophy size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-slate-600 font-medium">No hay respuestas aún</p>
                <p className="text-slate-500 text-sm">Los invitados que completen la trivia aparecerán aquí</p>
            </div>
        );
    }

    const maxScore = Math.max(...responses.map(r => r.score));

    return (
        <div className="space-y-6">
            {/* Header con stats compactos */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-[10px] font-bold uppercase text-yellow-700">Total</p>
                    <p className="text-xl font-bold text-yellow-900 leading-none mt-1">{responses.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-[10px] font-bold uppercase text-green-700">Mejor</p>
                    <p className="text-xl font-bold text-green-900 leading-none mt-1">{maxScore}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-[10px] font-bold uppercase text-blue-700">Promedio</p>
                    <p className="text-xl font-bold text-blue-900 leading-none mt-1">
                        {(responses.reduce((sum, r) => sum + r.score, 0) / responses.length).toFixed(1)}
                    </p>
                </div>
            </div>

            {/* Ranking */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Trophy className="text-yellow-600" size={16} />
                        Ranking
                    </h3>
                </div>

                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                    {responses.map((response, index) => {
                        const isFirst = index === 0;

                        let medalIcon = null;
                        let bgClass = "hover:bg-slate-50";

                        if (isFirst) {
                            medalIcon = "🥇";
                            bgClass = "bg-yellow-50/50";
                        } else if (index === 1) {
                            medalIcon = "🥈";
                        } else if (index === 2) {
                            medalIcon = "🥉";
                        }

                        return (
                            <div
                                key={response.id}
                                className={`px-4 py-3 flex items-center gap-3 transition-colors ${bgClass}`}
                            >
                                {/* Posición */}
                                <div className="w-6 text-center text-sm font-bold text-slate-500">
                                    {medalIcon || `#${index + 1}`}
                                </div>

                                {/* Nombre + Respuestas */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-semibold text-sm text-slate-800 truncate">
                                            {response.guest_name}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {new Date(response.completed_at).toLocaleDateString('es-AR')}
                                        </p>
                                    </div>

                                    {/* Visualización de Respuestas (si estuvieran disponibles los detalles) 
                                        Nota: Actualmente solo tenemos numbers. Idealmente necesitaríamos comparar con las respuestas correctas.
                                        Como no tenemos las 'preguntas' aquí, solo mostramos score.
                                        Si queremos mostrar detalle verde/rojo, necesitaríamos traer las preguntas también.
                                    */}
                                    <div className="flex items-center gap-1">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                            {/* Barra de progreso visual simple basada en score */}
                                            {/* Como no sabemos el total de preguntas aquí sin hacer otro fetch, asumimos score es absoluto */}
                                            <div
                                                className="h-full bg-green-500"
                                                style={{ width: `${(response.score / (maxScore || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 min-w-[20px] text-right">{response.score} pts</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
