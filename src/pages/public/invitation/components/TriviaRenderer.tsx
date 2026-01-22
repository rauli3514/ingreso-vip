import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Trophy, CheckCircle2, XCircle, Play, RotateCcw } from 'lucide-react';

interface TriviaQuestion {
    id: string;
    question: string;
    options: string[];
    correct_answer: number;
}

interface Props {
    eventId: string;
    themeColor: string;
}

export default function TriviaRenderer({ eventId, themeColor: _themeColor }: Props) {
    const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<number[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [guestName, setGuestName] = useState('');
    const [gameStarted, setGameStarted] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(true);

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

    const handleStartGame = () => {
        if (guestName.trim()) {
            setGameStarted(true);
        }
    };

    const handleAnswerSelect = (answerIndex: number) => {
        if (selectedAnswer !== null) return; // Ya respondió esta pregunta
        setSelectedAnswer(answerIndex);

        setTimeout(() => {
            const newAnswers = [...answers, answerIndex];
            setAnswers(newAnswers);

            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                setSelectedAnswer(null);
            } else {
                // Calcular puntuación
                const finalScore = newAnswers.reduce((total, answer, index) => {
                    return total + (answer === questions[index].correct_answer ? 1 : 0);
                }, 0);
                setScore(finalScore);
                setShowResult(true);
            }
        }, 1500); // Pausa para mostrar respuesta correcta/incorrecta
    };

    const handleSubmitScore = async () => {
        try {
            const { error } = await supabase
                .from('trivia_responses')
                .insert({
                    event_id: eventId,
                    guest_name: guestName,
                    answers: answers,
                    score: score
                });

            if (error) throw error;
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting trivia score:', error);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswers([]);
        setShowResult(false);
        setScore(0);
        setGameStarted(false);
        setSubmitted(false);
        setGuestName('');
    };

    if (loading) {
        return (
            <div className="py-24 bg-gradient-to-br from-indigo-50 to-purple-50 text-center">
                <p className="text-slate-500">Cargando trivia...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return null; // No mostrar si no hay preguntas
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-64 h-64 bg-purple-400 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <Trophy size={56} className="mx-auto mb-4 text-yellow-500" strokeWidth={1.5} />
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                        ¿Qué tanto conoces a la pareja?
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Pon a prueba tu conocimiento y descubre si eres un verdadero experto
                    </p>
                </div>

                {/* Pantalla de inicio */}
                {!gameStarted && !showResult && (
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                            ¡Comencemos!
                        </h3>
                        <input
                            type="text"
                            placeholder="Tu nombre"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl mb-6 focus:border-indigo-500 focus:outline-none text-lg"
                        />
                        <button
                            onClick={handleStartGame}
                            disabled={!guestName.trim()}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            <Play size={24} />
                            Comenzar Trivia
                        </button>
                        <p className="text-center text-sm text-slate-500 mt-4">
                            {questions.length} preguntas • ~2 minutos
                        </p>
                    </div>
                )}

                {/* Juego en progreso */}
                {gameStarted && !showResult && (
                    <div className="max-w-2xl mx-auto">
                        {/* Progreso */}
                        <div className="mb-8">
                            <div className="flex justify-between text-sm text-slate-600 mb-2">
                                <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                                <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Pregunta actual */}
                        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
                            <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-8 text-center">
                                {currentQuestion.question}
                            </h3>

                            <div className="space-y-4">
                                {currentQuestion.options.map((option, index) => {
                                    const isSelected = selectedAnswer === index;
                                    const isCorrect = index === currentQuestion.correct_answer;
                                    const showFeedback = selectedAnswer !== null;

                                    let buttonClass = "w-full p-4 rounded-xl border-2 transition-all font-medium text-left flex items-center justify-between hover:scale-105";

                                    if (!showFeedback) {
                                        buttonClass += " border-slate-200 hover:border-indigo-400 hover:bg-indigo-50";
                                    } else if (isSelected && isCorrect) {
                                        buttonClass += " border-green-500 bg-green-50 text-green-800";
                                    } else if (isSelected && !isCorrect) {
                                        buttonClass += " border-red-500 bg-red-50 text-red-800";
                                    } else if (isCorrect) {
                                        buttonClass += " border-green-500 bg-green-50 text-green-800";
                                    } else {
                                        buttonClass += " border-slate-200 opacity-50";
                                    }

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerSelect(index)}
                                            disabled={selectedAnswer !== null}
                                            className={buttonClass}
                                        >
                                            <span>{option}</span>
                                            {showFeedback && isSelected && isCorrect && <CheckCircle2 className="text-green-600" />}
                                            {showFeedback && isSelected && !isCorrect && <XCircle className="text-red-600" />}
                                            {showFeedback && !isSelected && isCorrect && <CheckCircle2 className="text-green-600" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pantalla de resultados */}
                {showResult && (
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
                        <Trophy size={80} className="mx-auto mb-6 text-yellow-500" />
                        <h3 className="text-3xl font-bold text-slate-800 mb-2">
                            ¡Finalizado!
                        </h3>
                        <p className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                            {score}/{questions.length}
                        </p>
                        <p className="text-lg text-slate-600 mb-8">
                            {score === questions.length && "¡Perfecto! Eres un experto 🎉"}
                            {score >= questions.length * 0.7 && score < questions.length && "¡Muy bien! Conoces mucho a la pareja 👏"}
                            {score >= questions.length * 0.5 && score < questions.length * 0.7 && "¡Bien hecho! Buen conocimiento 😊"}
                            {score < questions.length * 0.5 && "¡Sigue intentándolo! 💪"}
                        </p>

                        {!submitted ? (
                            <button
                                onClick={handleSubmitScore}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg mb-4 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                            >
                                Guardar mi Puntaje
                            </button>
                        ) : (
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-4">
                                <p className="text-green-800 font-semibold">✓ Puntaje guardado exitosamente</p>
                            </div>
                        )}

                        <button
                            onClick={handleRestart}
                            className="w-full border-2 border-slate-200 text-slate-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                        >
                            <RotateCcw size={20} />
                            Jugar de Nuevo
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
