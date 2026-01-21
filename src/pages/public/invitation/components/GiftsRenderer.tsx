import { useState } from 'react';
import { Gift, X } from 'lucide-react';

interface Props {
    title?: string;
    subtitle?: string;
    content?: string;
}

export default function GiftsRenderer({ title = 'Regalos', subtitle, content }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <section className="py-20 bg-white text-center">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                    <Gift size={32} strokeWidth={1.5} />
                </div>

                <h2 className="text-6xl md:text-8xl font-serif text-slate-900 mb-8 font-bold">{title}</h2>
                <p className="text-slate-500 font-light mb-8 text-lg">{subtitle || 'Si deseas regalarnos algo más que tu hermosa presencia...'}</p>

                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-transparent border border-slate-300 text-slate-700 hover:border-slate-800 hover:text-slate-900 px-8 py-3 rounded-full text-sm font-medium tracking-wide transition-all"
                >
                    VER MÁS
                </button>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

                    <div className="bg-white w-full max-w-md rounded-2xl p-8 relative z-10 animate-in zoom-in-95 duration-300 shadow-2xl">
                        {/* Icono Flotante Superior */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                            <Gift size={36} className="text-indigo-600" strokeWidth={1.5} />
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="mt-8 text-center">
                            <h3 className="text-2xl font-serif text-slate-800 mb-6">{title}</h3>

                            <div className="text-slate-600 whitespace-pre-line leading-relaxed text-sm bg-slate-50 p-6 rounded-lg border border-slate-100">
                                {content || 'No hay información de regalos disponible.'}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
