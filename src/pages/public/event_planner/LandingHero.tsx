import { useState, useEffect } from 'react';
import { ArrowRight, Check, Users, MapPin, Calculator, FileSpreadsheet, LayoutGrid, CheckSquare } from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';

interface LandingHeroProps {
    onStart: () => void;
    onLoginClick: () => void;
}

const VARIANTS = [
    {
        title: "Organizá tu evento gratis",
        subtitle: "Armá tu lista de invitados, distribuí mesas y descubrí lo que realmente necesitás para tu fiesta."
    },
    {
        title: "Tu evento empieza acá",
        subtitle: "Organizá invitados, mesas y evitá el caos antes del gran día."
    },
    {
        title: "¿Pensabas que eran 80 invitados?",
        subtitle: "Organizá tu lista y descubrí el tamaño real de tu evento antes de gastar de más."
    }
];

export default function LandingHero({ onStart, onLoginClick }: LandingHeroProps) {
    const [variantIndex, setVariantIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setVariantIndex((prev) => (prev + 1) % VARIANTS.length);
                setFade(true);
            }, 500); // 500ms fade out
        }, 5000); // Change every 5 seconds

        trackEvent('page_view', { page: 'landing_planner' });

        return () => clearInterval(interval);
    }, []);

    const currentVariant = VARIANTS[variantIndex];

    const handleStart = () => {
        trackEvent('event_started', { variant: currentVariant.title });
        onStart();
    };

    return (
        <div className="bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl tracking-tight text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(37,99,235,0.5)]">
                            <span className="text-white text-lg">E</span>
                        </div>
                        EventPix
                    </div>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={onLoginClick}
                            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 py-1"
                        >
                            Ingresar
                        </button>
                        <button 
                            onClick={handleStart}
                            className="text-sm font-medium px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-colors border border-blue-500/20"
                        >
                            Crear Evento Gratis
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <div className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
                {/* Background Glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto px-6 text-center z-10 w-full">
                    {/* Rotating Title & Subtitle */}
                    <div className="min-h-[220px] md:min-h-[200px] flex flex-col items-center justify-center">
                        <h1 className={`text-5xl md:text-7xl font-bold mb-6 tracking-tight transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
                            {currentVariant.title}
                        </h1>
                        <p className={`text-xl md:text-2xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed transition-opacity duration-500 ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}>
                            {currentVariant.subtitle}
                        </p>
                    </div>

                    {/* CTA Section */}
                    <div className="flex flex-col items-center justify-center gap-4 mt-4">
                        <button
                            onClick={handleStart}
                            className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_0_60px_-10px_rgba(37,99,235,0.7)] hover:-translate-y-1"
                        >
                            Comenzar a organizar <ArrowRight size={22} />
                        </button>
                        
                        {/* Trust text */}
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-4 text-sm font-medium text-slate-400">
                            <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-400" /> Gratis para empezar</span>
                            <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-400" /> Importá Excel</span>
                            <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-400" /> Sin complicaciones</span>
                        </div>
                    </div>

                    {/* Realistic Preview Mockup (CSS) */}
                    <div className="mt-20 max-w-4xl mx-auto relative group perspective-1000">
                        <div className="absolute -inset-1 bg-gradient-to-b from-blue-500/20 to-transparent blur-2xl rounded-3xl opacity-50"></div>
                        <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.02]">
                            {/* Browser Header */}
                            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                                </div>
                                <div className="ml-4 bg-slate-900 border border-slate-800 rounded-md h-6 w-64 flex items-center px-3">
                                    <span className="text-[10px] text-slate-500 font-mono">eventpix.com/planificador</span>
                                </div>
                            </div>
                            {/* App Content Fake */}
                            <div className="flex h-64 md:h-96">
                                {/* Fake Sidebar */}
                                <div className="w-1/4 lg:w-1/5 bg-slate-900 border-r border-slate-800 p-4 hidden md:block">
                                    <div className="h-4 w-24 bg-slate-800 rounded mb-6"></div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700">
                                            <div className="w-5 h-5 rounded-full bg-slate-700"></div>
                                            <div className="h-3 w-16 bg-slate-700 rounded"></div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700">
                                            <div className="w-5 h-5 rounded-full bg-slate-700"></div>
                                            <div className="h-3 w-20 bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* Fake Canvas */}
                                <div className="flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] relative flex items-center justify-center overflow-hidden">
                                    {/* Table 1 */}
                                    <div className="absolute top-1/4 left-1/4 w-24 h-24 rounded-full border-2 border-blue-500 bg-slate-900 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                        <span className="text-blue-400 font-bold text-sm">Mesa 1</span>
                                        {/* Chairs */}
                                        <div className="absolute -top-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                        <div className="absolute -bottom-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                        <div className="absolute -left-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                        <div className="absolute -right-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                    </div>
                                    {/* Table 2 */}
                                    <div className="absolute bottom-1/4 right-1/4 w-32 h-20 rounded-lg border-2 border-slate-700 bg-slate-900 flex items-center justify-center">
                                        <span className="text-slate-400 font-bold text-sm">Mesa 2</span>
                                        {/* Chairs */}
                                        <div className="absolute -top-3 left-4 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                        <div className="absolute -top-3 right-4 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                        <div className="absolute -bottom-3 left-4 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                        <div className="absolute -bottom-3 right-4 w-4 h-4 rounded-full bg-slate-800 border border-slate-600"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ASÍ FUNCIONA SECTION */}
            <div className="py-24 bg-slate-950 border-t border-slate-900 relative">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Organizar tu evento es más fácil de lo que pensás</h2>
                        <p className="text-blue-400 font-medium">La mayoría termina ajustando la cantidad de invitados 😉</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0"></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center bg-slate-950">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20 shadow-lg">
                                    <FileSpreadsheet size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">1. Armá tu lista</h3>
                                <p className="text-slate-400">Importá Excel o agregá invitados manualmente.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center bg-slate-950">
                                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-6 border border-pink-500/20 shadow-lg">
                                    <LayoutGrid size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">2. Organizá las mesas</h3>
                                <p className="text-slate-400">Acomodá visualmente quién se sienta con quién.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center bg-slate-950">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg">
                                    <CheckSquare size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">3. Convertí tu evento en realidad</h3>
                                <p className="text-slate-400">Descubrí qué necesitás realmente según tu cantidad de invitados.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3 CARDS SECTION */}
            <div className="py-24 bg-slate-900/50 border-t border-slate-800/50">
                <div className="max-w-5xl mx-auto px-6">
                    
                    <p className="text-center text-slate-500 text-sm mb-12 italic">"Muchos creen que son 80 y terminan siendo más."</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-colors flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                                <Users size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mt-2">Invitados en orden</h3>
                            <p className="text-slate-400 leading-relaxed">Importá Excel o cargalos fácilmente.</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-colors flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-pink-400 border border-slate-700">
                                <MapPin size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mt-2">Mesas inteligentes</h3>
                            <p className="text-slate-400 leading-relaxed">Organizá quién se sienta con quién visualmente.</p>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-blue-900/50 transition-colors flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                                <Calculator size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mt-2 relative z-10">Tu evento en números</h3>
                            <p className="text-slate-400 leading-relaxed relative z-10">Descubrí cuántas personas realmente serán.</p>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <button
                            onClick={handleStart}
                            className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-2 mx-auto border border-slate-700"
                        >
                            Ir al Organizador Gratuito <ArrowRight size={20} />
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
}
