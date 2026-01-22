import { Shirt, Palette, Check, X } from 'lucide-react';

interface Props {
    title?: string;
    subtitle?: string;
    dressCode?: string;
    note?: string;
    recommendedColors?: string[]; // Array de colores hex
    avoidColors?: string[]; // Array de colores hex
    exampleImages?: string[]; // URLs de imágenes de ejemplo
}

export default function DressCodeRenderer({
    title = "Dress Code",
    subtitle = "Vestimenta sugerida para el evento",
    dressCode = "Formal",
    note,
    recommendedColors = ['#C5A572', '#F4E4D7', '#8B7355'],
    avoidColors = ['#FFFFFF', '#000000'],
    exampleImages = []
}: Props) {
    return (
        <section className="py-24 bg-gradient-to-br from-slate-50 to-stone-50 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-20 left-10 w-96 h-96 bg-stone-400 rounded-full filter blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-400 rounded-full filter blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <Shirt size={56} className="mx-auto mb-4 text-stone-600" strokeWidth={1.5} />
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
                        {title}
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                {/* Dress Code Principal */}
                <div className="max-w-4xl mx-auto mb-16">
                    <div className="bg-white rounded-2xl shadow-2xl p-10 text-center border-4 border-stone-200">
                        <h3 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-stone-600 to-stone-800 mb-4">
                            {dressCode}
                        </h3>
                        {note && (
                            <p className="text-lg text-slate-600 italic">
                                {note}
                            </p>
                        )}
                    </div>
                </div>

                {/* Paleta de Colores */}
                {(recommendedColors.length > 0 || avoidColors.length > 0) && (
                    <div className="max-w-5xl mx-auto mb-16">
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Colores Recomendados */}
                            {recommendedColors.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <Check className="text-green-600" size={20} />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800">
                                            Colores Recomendados
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {recommendedColors.map((color, index) => (
                                            <div key={index} className="flex flex-col items-center gap-2">
                                                <div
                                                    className="w-20 h-20 rounded-xl shadow-md border-2 border-white ring-2 ring-slate-200 hover:scale-110 transition-transform cursor-pointer"
                                                    style={{ backgroundColor: color }}
                                                ></div>
                                                <span className="text-xs font-mono text-slate-500">
                                                    {color.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Colores a Evitar */}
                            {avoidColors.length > 0 && (
                                <div className="bg-white rounded-xl shadow-lg p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                            <X className="text-red-600" size={20} />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-800">
                                            Evitar estos Colores
                                        </h4>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {avoidColors.map((color, index) => (
                                            <div key={index} className="flex flex-col items-center gap-2 relative">
                                                <div className="relative">
                                                    <div
                                                        className="w-20 h-20 rounded-xl shadow-md border-2 border-white ring-2 ring-slate-200 opacity-50"
                                                        style={{ backgroundColor: color }}
                                                    ></div>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-24 h-1 bg-red-500 rotate-45 rounded-full"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-slate-500">
                                                    {color.toUpperCase()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Galería de Ejemplos */}
                {exampleImages.length > 0 && (
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-8">
                            <Palette size={40} className="mx-auto mb-3 text-stone-600" />
                            <h4 className="text-2xl font-bold text-slate-800">
                                Ejemplos de Inspiración
                            </h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {exampleImages.map((imageUrl, index) => (
                                <div
                                    key={index}
                                    className="aspect-[3/4] rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group"
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Ejemplo ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
