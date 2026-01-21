import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
    title?: string;
    subtitle?: string;
    images: string[];
}

export default function GalleryRenderer({ title = 'Galería', subtitle, images }: Props) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Si no hay imágenes, no mostrar nada
    if (!images || images.length === 0) return null;

    const openLightbox = (index: number) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex + 1) % images.length);
    };
    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    };

    return (
        <section className="py-20 bg-slate-50 overflow-hidden select-none">
            <div className="container mx-auto px-4 text-center mb-10">
                <h2 className="text-6xl md:text-8xl font-serif text-slate-900 mb-8 font-bold">{title}</h2>
                {subtitle && <p className="text-slate-500 max-w-2xl mx-auto font-light tracking-wide text-lg">{subtitle}</p>}
            </div>

            {/* CARRUSEL INFINITO ESTILO POLAROID */}
            <div className="relative w-full py-4">
                <style>
                    {`
                        @keyframes scroll {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(calc(-300px * ${images.length} - 32px * ${images.length})); }
                        }
                        .animate-scroll {
                            /* Velocidad MUY lenta: 15 segundos por foto para suavidad extrema */
                            animation: scroll ${Math.max(40, images.length * 15)}s linear infinite;
                            will-change: transform;
                        }
                        .animate-scroll:hover {
                            animation-play-state: paused;
                        }
                        /* Máscara de desvanecimiento en los bordes para que se vea "contenido" */
                        .fade-mask {
                            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                            -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
                        }
                    `}
                </style>

                {/* Icono de Cámara Decorativo */}
                <div className="flex justify-center mb-12 text-slate-300">
                    <div className="border border-slate-300 p-3 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                    </div>
                </div>

                <div className="fade-mask overflow-hidden py-4 w-full">
                    {/* pl-[50vw] ayuda a empezar desde el centro visualmente si hay pocas fotos, aunque la animación lo moverá */}
                    <div className="flex w-max animate-scroll hover:cursor-grab active:cursor-grabbing pl-[10vw]">
                        {/* Renderizamos las imágenes 3 veces para infinito real */}
                        {[...images, ...images, ...images].map((img, idx) => (
                            <div
                                key={`${idx}-${img}`}
                                onClick={() => openLightbox(idx % images.length)}
                                className="relative w-[300px] h-[360px] mx-4 flex-shrink-0 bg-white p-3 shadow-xl rounded-sm transform transition-all duration-500 hover:scale-[1.02] hover:-rotate-1 cursor-pointer"
                            >
                                <div className="w-full h-[280px] overflow-hidden bg-slate-100 mb-3">
                                    <img
                                        src={img}
                                        alt={`Gallery ${idx}`}
                                        className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                                        loading="lazy"
                                        draggable="false"
                                    />
                                </div>
                                {/* Espacio blanco inferior de la Polaroid */}
                                <div className="h-[40px] flex items-center justify-center opacity-30">
                                    {/* Línea decorativa sutil o firma */}
                                    <div className="w-12 h-0.5 bg-slate-300 rounded-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-stone-900/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={closeLightbox}>

                    <button onClick={closeLightbox} className="absolute top-4 right-4 text-white/50 hover:text-white p-2 z-20 transition-colors">
                        <X size={32} />
                    </button>

                    <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-4 rounded-full hover:bg-white/5 transition-all z-20 group"
                    >
                        <ChevronLeft size={48} className="transform group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={images[lightboxIndex]}
                            className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-sm border-[8px] border-white"
                        />
                        <div className="text-center text-white/40 mt-6 font-light tracking-[0.2em] text-xs uppercase">
                            Recuerdo {lightboxIndex + 1} de {images.length}
                        </div>
                    </div>

                    <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-4 rounded-full hover:bg-white/5 transition-all z-20 group"
                    >
                        <ChevronRight size={48} className="transform group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </section>
    );
}
