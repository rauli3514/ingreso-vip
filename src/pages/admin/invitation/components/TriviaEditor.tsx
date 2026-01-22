import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { TriviaQuestion } from '../../../../types';
import { Plus, Trash2, GripVertical, Trophy, Save } from 'lucide-react';

interface Props {
    eventId: string;
}

export default function TriviaEditor({ eventId }: Props) {
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, [eventId]);

    const fetchQuestions = async () => {
        try {
            const { data, error } = await supabase
                .from('trivia_questions')
                .select('*')
                .eq('event_id', eventId)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setQuestions(data || []);
        } catch (error) {
            console.error('Error fetching trivia questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const addQuestion = () => {
        const newQuestion: Partial<TriviaQuestion> = {
            id: `temp-${Date.now()}`,
            event_id: eventId,
            question: '',
            options: ['', '', '', ''],
            correct_answer: 0,
            order_index: questions.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        setQuestions([...questions, newQuestion as TriviaQuestion]);
    };

    const removeQuestion = async (index: number) => {
        const question = questions[index];

        // Si es una pregunta existente, eliminarla de la BD
        if (!question.id.startsWith('temp-')) {
            try {
                const { error } = await supabase
                    .from('trivia_questions')
                    .delete()
                    .eq('id', question.id);

                if (error) throw error;
            } catch (error) {
                console.error('Error deleting question:', error);
                alert('Error al eliminar la pregunta');
                return;
            }
        }

        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const updateQuestion = (index: number, field: keyof TriviaQuestion, value: any) => {
        const newQuestions = [...questions];
        (newQuestions[index] as any)[field] = value;
        setQuestions(newQuestions);
    };

    const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options[optionIndex] = value;
        setQuestions(newQuestions);
    };

    const saveAllQuestions = async () => {
        setSaving(true);
        try {
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];
                const questionData = {
                    event_id: eventId,
                    question: question.question,
                    options: question.options,
                    correct_answer: question.correct_answer,
                    order_index: i
                };

                if (question.id.startsWith('temp-')) {
                    // Nueva pregunta
                    const { error } = await supabase
                        .from('trivia_questions')
                        .insert(questionData);

                    if (error) throw error;
                } else {
                    // Actualizar pregunta existente
                    const { error } = await supabase
                        .from('trivia_questions')
                        .update({ ...questionData, updated_at: new Date().toISOString() })
                        .eq('id', question.id);

                    if (error) throw error;
                }
            }

            alert('✓ Preguntas guardadas exitosamente');
            await fetchQuestions(); // Recargar para obtener IDs reales
        } catch (error) {
            console.error('Error saving questions:', error);
            alert('Error al guardar las preguntas');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Cargando trivia...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                <div className="flex items-center gap-3 mb-2">
                    <Trophy className="text-yellow-600" size={32} />
                    <h3 className="text-2xl font-bold text-slate-800">Trivia sobre la Pareja</h3>
                </div>
                <p className="text-slate-600">
                    Crea preguntas divertidas para que los invitados pongan a prueba su conocimiento sobre la pareja.
                </p>
            </div>

            {/* Preguntas */}
            <div className="space-y-4">
                {questions.map((question, qIndex) => (
                    <div key={question.id} className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-indigo-300 transition-all">
                        <div className="flex items-start gap-4">
                            {/* Drag handle */}
                            <div className="cursor-move text-slate-400 mt-3">
                                <GripVertical size={20} />
                            </div>

                            <div className="flex-1 space-y-4">
                                {/* Número y pregunta */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Pregunta #{qIndex + 1}
                                    </label>
                                    <input
                                        type="text"
                                        value={question.question}
                                        onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                        placeholder="¿Dónde se conocieron?"
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                {/* Opciones */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Opciones
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {question.options.map((option, optIndex) => (
                                            <div key={optIndex} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`correct-${qIndex}`}
                                                    checked={question.correct_answer === optIndex}
                                                    onChange={() => updateQuestion(qIndex, 'correct_answer', optIndex)}
                                                    className="w-5 h-5 text-green-600"
                                                />
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                                                    placeholder={`Opción ${optIndex + 1}`}
                                                    className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        ✓ Marca el radio button de la respuesta correcta
                                    </p>
                                </div>
                            </div>

                            {/* Botón eliminar */}
                            <button
                                onClick={() => removeQuestion(qIndex)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors mt-2"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3">
                <button
                    onClick={addQuestion}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md"
                >
                    <Plus size={20} />
                    Agregar Pregunta
                </button>

                {questions.length > 0 && (
                    <button
                        onClick={saveAllQuestions}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Guardando...' : 'Guardar Todo'}
                    </button>
                )}
            </div>

            {questions.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                    <Trophy size={48} className="mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600 font-medium">No hay preguntas aún</p>
                    <p className="text-slate-500 text-sm">Agrega la primera pregunta para comenzar</p>
                </div>
            )}
        </div>
    );
}
