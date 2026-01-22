import { useRef } from 'react';
import { Instagram, Camera } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props {
    title: string;
    subtitle: string;
    hashtag: string;
    backgroundUrl?: string; // Para el parallax
    buttons: any[];
}

export default function SocialRenderer({ title, subtitle, hashtag, backgroundUrl, buttons }: Props) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-20%", "10%"]);

    // Color de fondo de la página (generalmente slate-50 o stone-50)
    const pageBgColor = "#fafaf9"; // stone-50

    return (
        <section ref={ref} className="relative py-32 flex items-center justify-center text-center text-white overflow-hidden">
            {/* Parallax Background */}
            <motion.div
                className="absolute inset-0 z-0 h-[120%]"
                style={{ y, top: '-10%' }}
            >
                <img
                    src={backgroundUrl || 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=2602&auto=format&fit=crop'}
                    alt="Social Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50"></div>
            </motion.div>

            {/* SEPARADOR SUPERIOR (Conexión con sección anterior) */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] z-20">
                <svg
                    className="relative block w-full h-[50px] md:h-[100px]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    {/* Ola VALLE (Cóncava) rellena de blanco ARRIBA */}
                    <path
                        d="M0,0 Q600,100 1200,0 H0 Z"
                        fill={pageBgColor}
                    ></path>
                </svg>
            </div>


            <div className="relative z-10 container mx-auto px-4 max-w-3xl">
                <h2 className="text-2xl md:text-5xl font-serif mb-4 text-shadow-lg leading-snug" style={{ fontFamily: '"Great Vibes", cursive' }}>{title}</h2>
                <p className="text-white/90 font-light mb-8 text-shadow-sm">{subtitle}</p>

                <div className="mb-10">
                    <span className="text-2xl md:text-5xl font-bold tracking-tight text-shadow-lg opacity-90 break-all">{hashtag}</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    {buttons?.map((btn, idx) => {
                        if (!btn.show) return null;
                        const Icon = btn.icon === 'instagram' ? Instagram : Camera; // Simple mapping

                        return (
                            <a
                                key={idx}
                                href={btn.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/90 backdrop-blur-sm text-slate-900 hover:bg-white px-8 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 inline-flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                            >
                                <Icon size={20} className="text-indigo-600" />
                                {btn.label}
                            </a>
                        );
                    })}
                </div>
            </div>

            {/* SEPARADOR INFERIOR (Conexión con footer) */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] z-20">
                <svg
                    className="relative block w-full h-[50px] md:h-[100px]"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                >
                    {/* Ola MONTAÑA (Convexa) rellena de blanco ABAJO */}
                    <path
                        d="M0,120 Q600,20 1200,120 H0 Z"
                        fill={pageBgColor}
                    ></path>
                </svg>
            </div>

        </section>
    );
}
