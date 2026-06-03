import React from 'react';
import { Plus, Upload } from 'lucide-react';

interface MobileHeroProps {
    onAddGuest: () => void;
    onImportExcel: () => void;
}

export default function MobileHero({ onAddGuest, onImportExcel }: MobileHeroProps) {
    return (
        <div className="md:hidden bg-gradient-to-b from-blue-900/20 to-slate-950 p-6 pt-8 pb-4 border-b border-slate-800/50">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                🎉 Organizá tu evento <br className="hidden sm:block" /> sin estrés
            </h1>
            
            <div className="space-y-1 mb-6">
                <p className="text-blue-200/80 font-medium text-[15px] leading-snug">
                    Empezá por tus invitados y descubrí todo lo que realmente necesitás para tu fiesta.
                </p>
                <p className="text-slate-400 text-sm">
                    No hace falta tener todo resuelto hoy 😉 Vas paso a paso.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                <button 
                    onClick={onAddGuest}
                    className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white py-4 px-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 border border-blue-500/50"
                >
                    <Plus size={22} strokeWidth={2.5} />
                    Empezar con invitados
                </button>
                
                <button 
                    onClick={onImportExcel}
                    className="w-full bg-slate-900/80 hover:bg-slate-800 active:scale-[0.98] text-slate-300 py-3.5 px-4 rounded-2xl font-medium flex items-center justify-center gap-2 transition-all border border-slate-700/50 backdrop-blur-sm"
                >
                    <Upload size={18} className="text-slate-400" />
                    Importar Excel
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-1">
                    💡 <span className="font-medium text-slate-300">Tip web:</span> Ingresá desde tu compu para descargar la plantilla Excel modelo y cargar todo mucho más rápido.
                </p>
            </div>
        </div>
    );
}
