import { useNavigate } from 'react-router-dom';
import { MessageCircle, Instagram, Globe } from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center relative overflow-hidden bg-[#0F172A] text-slate-100">

            <div className="max-w-md w-full fade-in">
                <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">Ingreso VIP</h1>
                <p className="text-yellow-500 text-xs mb-10 tracking-[0.2em] uppercase font-semibold">by Tecno Eventos</p>

                <div className="space-y-6">
                    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
                        <p className="text-sm font-medium leading-relaxed text-slate-300">
                            Sistema de gestión de invitados.
                            <br />
                            <span className="text-xs opacity-50 mt-2 block">Control seguro y eficiente.</span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 justify-center mt-8">
                        <button
                            onClick={() => navigate('/login')}
                            className="btn btn-primary w-full py-3 text-base shadow-lg shadow-yellow-500/20"
                        >
                            Iniciar Sesión
                        </button>
                        <button className="btn btn-outline w-full py-3 text-sm opacity-70 hover:opacity-100 border-slate-600 hover:bg-slate-800">
                            Escanear QR (Demo)
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/5491112345678" // TODO: Replace with actual number
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 p-4 bg-green-500 rounded-full shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all duration-300 z-50 hover:scale-110 group"
                aria-label="Contactar por WhatsApp"
            >
                <div className="absolute -top-10 right-0 bg-white text-slate-900 text-xs font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                    ¡Hablemos!
                </div>
                <MessageCircle className="w-7 h-7 text-white" />
            </a>

            <footer className="mt-12 text-[10px] text-slate-500 uppercase tracking-widest fixed bottom-4 flex flex-col items-center gap-3 w-full">
                <div className="flex gap-6 opacity-60">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors duration-300">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="https://tecnoeventos.com.ar" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors duration-300">
                        <Globe className="w-5 h-5" />
                    </a>
                </div>
                <span className="opacity-40">&copy; 2025 Tecno Eventos</span>
            </footer>
        </div>
    );
}
