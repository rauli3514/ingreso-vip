import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { TriviaResponse } from '../../../../types';
import { Trophy, Medal, Award } from 'lucide-react';

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
            {/* Header con stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                    <p className="text-xs font-bold uppercase text-yellow-700 mb-1">Total Participantes</p>
                    <p className="text-4xl font-bold text-yellow-900">{responses.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <p className="text-xs font-bold uppercase text-green-700 mb-1">Mejor Puntaje</p>
                    <p className="text-4xl font-bold text-green-900">{maxScore}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <p className="text-xs font-bold uppercase text-blue-700 mb-1">Puntaje Promedio</p>
                    <p className="text-4xl font-bold text-blue-900">
                        {(responses.reduce((sum, r) => sum + r.score, 0) / responses.length).toFixed(1)}
                    </p>
                </div>
            </div>

            {/* Ranking */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Trophy className="text-yellow-600" size={24} />
                        Ranking de Participantes
                    </h3>
                </div>

                <div className="divide-y divide-slate-100">
                    {responses.map((response, index) => {
                        const isFirst = index === 0;
                        const isSecond = index === 1;
                        const isThird = index === 2;

                        let medalIcon = null;
                        let bgClass = "hover:bg-slate-50";
                        let textColor = "text-slate-700";

                        if (isFirst) {
                            medalIcon = <Trophy className="text-yellow-500" size={28} />;
                            bgClass = "bg-gradient-to-r from-yellow-50 to-yellow-100/50 hover:from-yellow-100 hover:to-yellow-100";
                            textColor = "text-yellow-900";
                        } else if (isSecond) {
                            medalIcon = <Medal className="text-gray-400" size={28} />;
                            bgClass = "bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-100";
                            textColor = "text-gray-700";
                        } else if (isThird) {
                            medalIcon = <Award className="text-orange-600" size={28} />;
                            bgClass = "bg-gradient-to-r from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-100";
                            textColor = "text-orange-900";
                        }

                        return (
                            <div
                                key={response.id}
                                className={`px-6 py-4 flex items-center gap-4 transition-colors ${bgClass}`}
                            >
                                {/* Posición/Medalla */}
                                <div className="w-12 text-center">
                                    {medalIcon || (
                                        <span className="text-2xl font-bold text-slate-400">
                                            #{index + 1}
                                        </span>
                                    )}
                                </div>

                                {/* Nombre */}
                                <div className="flex-1">
                                    <p className={`font-semibold text-lg ${textColor}`}>
                                        {response.guest_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(response.completed_at).toLocaleString('es-AR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>

                                {/* Puntaje */}
                                <div className="text-right">
                                    <p className={`text-3xl font-bold ${textColor}`}>
                                        {response.score}
                                    </p>
                                    <p className="text-xs text-slate-500">puntos</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
