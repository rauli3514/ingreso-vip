import { Music, Shirt, ClipboardList } from 'lucide-react';
import DressCodeModal from './DressCodeModal';

interface Props {
    title?: string;
    subtitle?: string;
    blocks?: any;
    onSuggestSong?: () => void;
    themeColor: string;
    componentsConfig?: any; // Configuración extra para DressCode, etc.
}

export default function ExtraInfoRenderer({ subtitle, blocks, onSuggestSong, themeColor, componentsConfig }: Props) {
    const musicBlock = blocks?.music || { show: true, title: 'Música' };
    const dressBlock = blocks?.dress_code || { show: true, title: 'Dress Code', content: '' };
    const tipsBlock = blocks?.tips || { show: true, title: 'Tips y Notas', content: '' };

    // Configuración Dress Code dinámica
    const dressColors = componentsConfig?.dress_code || {};
    const recommendedColors = dressColors.recommended_colors || ['#C5A572', '#F4E4D7', '#8B7355'];
    const avoidColors = dressColors.avoid_colors || ['#FFFFFF', '#000000'];

    // Color principal del tema
    const mainColor = themeColor || '#C5A976';

    const handleBtnEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = mainColor;
        e.currentTarget.style.color = mainColor;
    };

    const handleBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.style.borderColor = '#e7e5e4';
        e.currentTarget.style.color = '#57534e';
    };

    // Clase base común
    const cardClass = "bg-[#FCFCFA] p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 flex flex-col items-center text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 transform hover:-translate-y-1 group";
    const btnClass = "mt-auto bg-white border border-stone-200 text-stone-600 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm hover:shadow-md w-full max-w-[200px]";

    return (
        <section className="py-24 relative overflow-hidden bg-[#F4F5F1]">
            <div className="container mx-auto px-4 text-center relative z-10">
                <p className="text-stone-500 font-light max-w-2xl mx-auto mb-16 text-lg tracking-wide">
                    {subtitle || 'Hagamos juntos una fiesta épica. Aquí algunos detalles a tener en cuenta.'}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                    {/* Música */}
                    {musicBlock.show && (
                        <div className={cardClass}>
                            <div className="mb-6 p-4 text-stone-700 group-hover:scale-110 transition-transform duration-300">
                                <Music size={48} strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 font-serif transition-colors" style={{ color: mainColor }}>{musicBlock.title}</h3>
                            <p className="text-sm md:text-base text-stone-500 font-light mb-6 leading-relaxed flex-1">
                                ¿Cuál es la canción que no debe faltar en la PlayList de la fiesta?
                            </p>
                            <button
                                onClick={onSuggestSong}
                                className={btnClass}
                                onMouseEnter={handleBtnEnter}
                                onMouseLeave={handleBtnLeave}
                            >
                                SUGERIR CANCIÓN
                            </button>
                        </div>
                    )}

                    {/* Dress Code */}
                    {dressBlock.show && (
                        <div className={cardClass}>
                            <div className="mb-6 p-4 text-stone-700 group-hover:scale-110 transition-transform duration-300">
                                <Shirt size={48} strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 font-serif transition-colors" style={{ color: mainColor }}>{dressBlock.title}</h3>
                            <p className="text-sm md:text-base text-stone-500 font-light mb-6 leading-relaxed flex-1">
                                Una orientación para tu vestuario.
                            </p>
                            <DressCodeModal
                                dressCode={dressBlock.content || "Formal"}
                                recommendedColors={recommendedColors}
                                avoidColors={avoidColors}
                            />
                        </div>
                    )}

                    {/* Tips y Notas */}
                    {tipsBlock.show && (
                        <div className={cardClass}>
                            <div className="mb-6 p-4 text-stone-700 group-hover:scale-110 transition-transform duration-300">
                                <ClipboardList size={48} strokeWidth={1} />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-bold mb-4 font-serif transition-colors" style={{ color: mainColor }}>{tipsBlock.title}</h3>
                            <div className="text-sm md:text-base text-stone-500 font-light leading-relaxed whitespace-pre-line flex-1">
                                {tipsBlock.content || 'Información adicional para tener en cuenta.'}
                            </div>
                            {/* No mostramos botón aquí ya que la info está visible */}
                        </div>
                    )}

                </div>
            </div>
        </section>
    );
}
