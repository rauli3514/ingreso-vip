import React, { useRef } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import { InvitationData } from '../../../types';
import { InvitationTheme } from '../themes/types';

interface HeroBlockProps {
    data: InvitationData;
    theme: InvitationTheme;
}

const HeroBlock: React.FC<HeroBlockProps> = ({ data, theme }) => {
    const sectionData = data.hero_section;
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

    if (!sectionData.show) return null;

    return (
        <div ref={containerRef} className="relative h-screen w-full overflow-hidden">
            {/* Parallax Background */}
            <motion.div
                style={{ y, opacity }}
                className="absolute inset-0 z-0"
            >
                <img
                    src={data.cover_image_url || 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1000'}
                    alt="Cover"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0" style={theme.styles.heroOverlay} />
            </motion.div>

            {/* Content Content */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                >
                    <p className="text-lg md:text-xl tracking-widest uppercase mb-4" style={{ fontFamily: theme.fonts.body, color: theme.colors.textLight || '#fff' }}>
                        {sectionData.subtitle || 'Nos Casamos'}
                    </p>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4"
                        style={{
                            fontFamily: theme.fonts.heading,
                            color: theme.colors.accent || '#fff',
                            textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                    >
                        {sectionData.title || 'Nombres del Evento'}
                    </h1>

                    {sectionData.date_format && (
                        <div className="mt-8 relative inline-block">
                            <span
                                className="text-2xl md:text-3xl relative z-10 block px-8 py-2 border-y md:border-y-0 border-white/30 md:border-transparent"
                                style={{ fontFamily: theme.fonts.body, color: '#fff' }}
                            >
                                {sectionData.date_format}
                            </span>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, y: [0, 10, 0] }}
                    transition={{ delay: 1.5, duration: 2, repeat: Infinity }}
                >
                    <span className="text-white/60 text-sm tracking-[0.3em] uppercase">Desliza</span>
                </motion.div>
            </div>
        </div>
    );
};

export default HeroBlock;
