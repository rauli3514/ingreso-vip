import { useState } from 'react';
import { Shirt, Check, X } from 'lucide-react';

interface Props {
    dressCode?: string;
    note?: string;
    recommendedColors?: string[];
    avoidColors?: string[];
}

export default function DressCodeModal({
    dressCode = "Formal",
    note,
    recommendedColors = ['#C5A572', '#F4E4D7', '#8B7355'],
    avoidColors = ['#FFFFFF', '#000000']
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="mt-auto bg-white border border-stone-200 text-stone-600 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md w-full max-w-[200px]"
            >
                VER DETALLES
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

                    <div
                        className="bg-white w-full max-w-2xl rounded-2xl p-8 relative z-10 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <Shirt size={32} className="text-stone-600" />
                                <h3 className="text-3xl font-bold text-slate-800">Dress Code</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Dress Code Principal */}
                        <div className="bg-gradient-to-br from-stone-50 to-slate-50 rounded-xl p-8 mb-6 text-center border-2 border-stone-200">
                            <h4 className="text-4xl md:text-5xl font-bold text-stone-700 mb-2">
                                {dressCode}
                            </h4>
                            {note && (
                                <p className="text-slate-600 italic">
                                    {note}
                                </p>
                            )}
                        </div>

                        {/* Paleta de Colores */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Colores Recomendados */}
                            {recommendedColors.length > 0 && (
                                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="text-white" size={16} />
                                        </div>
                                        <h5 className="font-bold text-slate-800">Recomendados</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {recommendedColors.map((color, index) => (
                                            <div key={index} className="flex flex-col items-center gap-1">
                                                <div
                                                    className="w-16 h-16 rounded-lg shadow-md border-2 border-white"
                                                    style={{ backgroundColor: color }}
                                                ></div>
                                                <span className="text-[10px] font-mono text-slate-500">
                                                    {color.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Colores a Evitar */}
                            {avoidColors.length > 0 && (
                                <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                                            <X className="text-white" size={16} />
                                        </div>
                                        <h5 className="font-bold text-slate-800">Evitar</h5>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {avoidColors.map((color, index) => (
                                            <div key={index} className="flex flex-col items-center gap-1 relative">
                                                <div className="relative">
                                                    <div
                                                        className="w-16 h-16 rounded-lg shadow-md border-2 border-white opacity-60"
                                                        style={{ backgroundColor: color }}
                                                    ></div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-20 h-0.5 bg-red-500 rotate-45"></div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500">
                                                    {color.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
