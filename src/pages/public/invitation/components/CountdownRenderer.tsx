import { useEffect, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { Heart } from 'lucide-react';

interface Props {
    targetDate: string;
    title?: string;
    subtitle?: string;
    theme?: string;
}

// Mapa de colores por tema
const THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string; bg: string }> = {
    // TEMAS ORIGINALES (Conservados)
    rustic: { primary: '#5D7052', secondary: '#8A9A5B', accent: '#8B4513', bg: '#F4F5F0' },  // Verde Rústico (Hojas) ✓
    romantic: { primary: '#D48BA3', secondary: '#F3D1DC', accent: '#A64D79', bg: '#FFF5F8' }, // Rosa Romántico ✓

    // NUEVOS TEMAS (15)
    ocean: { primary: '#0891B2', secondary: '#22D3EE', accent: '#164E63', bg: '#ECFEFF' },      // Ocean Breeze
    coral: { primary: '#F87171', secondary: '#FCA5A5', accent: '#B91C1C', bg: '#FEF2F2' },      // Sunset Coral
    forest: { primary: '#059669', secondary: '#34D399', accent: '#064E3B', bg: '#ECFDF5' },     // Forest Emerald
    lavender: { primary: '#A78BFA', secondary: '#C4B5FD', accent: '#6D28D9', bg: '#F5F3FF' },   // Lavender Dreams
    golden: { primary: '#D97706', secondary: '#FBBF24', accent: '#92400E', bg: '#FFFBEB' },     // Golden Hour
    navy: { primary: '#1E3A8A', secondary: '#3B82F6', accent: '#1E40AF', bg: '#EFF6FF' },       // Midnight Navy
    terracotta: { primary: '#C2410C', secondary: '#FB923C', accent: '#7C2D12', bg: '#FFF7ED' }, // Terracotta Earth
    mint: { primary: '#10B981', secondary: '#6EE7B7', accent: '#065F46', bg: '#F0FDF4' },       // Mint Garden
    burgundy: { primary: '#991B1B', secondary: '#DC2626', accent: '#7F1D1D', bg: '#FEF2F2' },   // Burgundy Wine
    peach: { primary: '#FB923C', secondary: '#FED7AA', accent: '#C2410C', bg: '#FFF7ED' },      // Peach Blush
    sage: { primary: '#84CC16', secondary: '#BEF264', accent: '#4D7C0F', bg: '#F7FEE7' },       // Sage & Ivory
    plum: { primary: '#7C3AED', secondary: '#A78BFA', accent: '#5B21B6', bg: '#FAF5FF' },       // Plum Velvet
    rosegold: { primary: '#BE7C68', secondary: '#E5B299', accent: '#8B5A3C', bg: '#FFF5F0' },   // Rose Gold
    black: { primary: '#EAB308', secondary: '#FDE047', accent: '#CA8A04', bg: '#18181B' },      // Black & Gold
    champagne: { primary: '#C9A96E', secondary: '#E8D4A2', accent: '#9B7F4A', bg: '#FDFBF7' },  // Champagne
};

export default function CountdownRenderer({ targetDate, title = 'Falta', subtitle, theme = 'rustic' }: Props) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    // Seleccionar colores según el tema (fallback a 'rustic')
    const colors = THEME_COLORS[theme] || THEME_COLORS['rustic'];

    useEffect(() => {
        if (!targetDate) return;

        const interval = setInterval(() => {
            const now = new Date();
            const target = new Date(targetDate);

            if (now >= target) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setTimeLeft({
                days: differenceInDays(target, now),
                hours: differenceInHours(target, now) % 24,
                minutes: differenceInMinutes(target, now) % 60,
                seconds: differenceInSeconds(target, now) % 60
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <section
            className="py-24 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-500"
            style={{ backgroundColor: colors.bg }}
        >
            {/* Fondo decorativo geométrico sutil */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg className="absolute -left-20 top-20 w-96 h-96 animate-spin-slow" viewBox="0 0 100 100" fill="none" stroke={colors.primary}>
                    <circle cx="50" cy="50" r="40" strokeWidth="0.5" />
                    <rect x="25" y="25" width="50" height="50" strokeWidth="0.5" transform="rotate(45 50 50)" />
                </svg>
            </div>

            {/* Contenedor Principal: Círculo Blanco con Sombra */}
            <div className="relative z-10 w-[320px] h-[320px] md:w-[400px] md:h-[400px] bg-white rounded-full shadow-2xl flex flex-col items-center justify-center p-8 animate-in zoom-in duration-700">

                {/* Borde Decorativo */}
                <div
                    className="absolute inset-0 border-[3px] rounded-full scale-110 pointer-events-none transition-colors duration-500"
                    style={{ borderColor: `${colors.secondary}50` }} // 30% opacidad hex sim
                ></div>
                <div
                    className="absolute inset-0 border rounded-full scale-[1.03] pointer-events-none transition-colors duration-500"
                    style={{ borderColor: `${colors.secondary}80` }}
                ></div>

                {/* Título "Falta" */}
                <h3
                    className="text-3xl md:text-5xl font-serif mb-4 md:mb-8 font-light tracking-wide drop-shadow-sm transition-colors duration-500 text-center"
                    style={{ color: colors.primary }}
                >
                    {title}
                </h3>

                {/* Números */}
                <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
                    <TimeBox value={timeLeft.days} label="días" color={colors.primary} />
                    <Separator color={colors.secondary} />
                    <TimeBox value={timeLeft.hours} label="hs" color={colors.primary} />
                    <Separator color={colors.secondary} />
                    <TimeBox value={timeLeft.minutes} label="min" color={colors.primary} />
                    <Separator color={colors.secondary} />
                    <TimeBox value={timeLeft.seconds} label="seg" color={colors.primary} />
                </div>

                {/* Corazón Decorativo Abajo */}
                <div className="mt-6 md:mt-10 animate-pulse transition-colors duration-500" style={{ color: colors.accent }}>
                    <Heart fill="currentColor" size={32} />
                </div>
            </div>

            {/* Subtítulo debajo del círculo */}
            {subtitle && (
                <p
                    className="mt-8 text-xl md:text-2xl font-light text-center max-w-2xl px-4 animate-in fade-in duration-700 delay-300"
                    style={{ color: colors.accent }}
                >
                    {subtitle}
                </p>
            )}
        </section>
    );
}

function TimeBox({ value, label, color }: { value: number; label: string; color: string }) {
    return (
        <div className="flex flex-col items-center min-w-[50px] md:min-w-[60px]">
            <div className="text-3xl md:text-5xl font-bold text-slate-600 tabular-nums leading-none">
                {String(value).padStart(2, '0')}
            </div>
            <span
                className="text-sm md:text-base font-light mt-1 transition-colors duration-500"
                style={{ color: color }}
            >
                {label}
            </span>
        </div>
    );
}

function Separator({ color }: { color: string }) {
    return (
        <div className="h-8 md:h-12 w-px mx-1 md:mx-2 self-center mb-6 transition-colors duration-500" style={{ backgroundColor: `${color}80` }}></div>
    );
}
