import { useNavigate } from 'react-router-dom';

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

            <footer className="mt-12 text-[10px] text-slate-500 opacity-40 uppercase tracking-widest fixed bottom-4">
                &copy; 2025 Tecno Eventos
            </footer>
        </div>
    );
}
