import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { InvitationData } from '../../../types';
import { InvitationTheme } from '../themes/types';

interface CountdownBlockProps {
    data: InvitationData;
    theme: InvitationTheme;
}

const CountdownBlock: React.FC<CountdownBlockProps> = ({ data, theme }) => {
    const sectionData = data.countdown_section;
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (!sectionData.target_date) return;

        const target = new Date(sectionData.target_date).getTime();

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000),
                });
            } else {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [sectionData.target_date]);

    if (!sectionData.show || !sectionData.target_date) return null;

    const TimeBox = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center mx-2 md:mx-4">
            <div
                className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center rounded-full backdrop-blur-sm border shadow-lg mb-2"
                style={{
                    borderColor: theme.colors.secondary,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.primary
                }}
            >
                <span className="text-2xl md:text-4xl font-bold" style={{ fontFamily: theme.fonts.heading }}>
                    {value}
                </span>
            </div>
            <span className="text-xs md:text-sm uppercase tracking-widest" style={{ color: theme.colors.textLight, fontFamily: theme.fonts.body }}>
                {label}
            </span>
        </div>
    );

    return (
        <section className="py-20 px-4 flex flex-col items-center justify-center min-h-[40vh]"
            style={{ backgroundColor: theme.colors.background }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center"
            >
                <h2 className="text-3xl md:text-5xl mb-12 font-medium"
                    style={{ fontFamily: theme.fonts.accent, color: theme.colors.primary }}
                >
                    {sectionData.title || 'Solo falta...'}
                </h2>

                <div className="flex justify-center flex-wrap gap-y-4">
                    <TimeBox value={timeLeft.days} label="Días" />
                    <TimeBox value={timeLeft.hours} label="Hs" />
                    <TimeBox value={timeLeft.minutes} label="Min" />
                    <TimeBox value={timeLeft.seconds} label="Seg" />
                </div>
            </motion.div>
        </section>
    );
};

export default CountdownBlock;
