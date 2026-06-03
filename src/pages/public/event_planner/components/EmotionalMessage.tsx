import React, { useState, useEffect } from 'react';

interface EmotionalMessageProps {
    guestCount: number;
}

const warmTips = [
    "🎉 Tu evento ya empezó. Aunque hoy falte mucho, ya avanzaste 😉",
    "👥 Empezá por quienes querés tener cerca ese día.",
    "😄 La mayoría empieza calculando invitados para saber el tamaño del salón.",
    "🪑 No hace falta resolver dónde se sienta cada uno hoy.",
    "✨ Paso a paso también se arma una gran fiesta.",
    "😅 Mucha gente descubre que tiene más invitados de los que pensaba."
];

export default function EmotionalMessage({ guestCount }: EmotionalMessageProps) {
    const [tipIndex, setTipIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % warmTips.length);
        }, 6000); // Rotate every 6 seconds
        return () => clearInterval(interval);
    }, []);

    let statusMessage = "";
    if (guestCount <= 10) {
        statusMessage = "✨ Tu evento recién empieza";
    } else if (guestCount <= 30) {
        statusMessage = "🎉 Ya empieza a tomar forma";
    } else if (guestCount <= 80) {
        statusMessage = "😄 Ya tenés un panorama real";
    } else {
        statusMessage = "🔥 Esto ya parece un evento importante";
    }

    return (
        <div className="md:hidden px-4 pb-6 bg-slate-950">
            <div className="bg-gradient-to-r from-blue-900/10 to-transparent border-l-2 border-blue-500 py-3 px-4 rounded-r-2xl">
                <p className="text-white font-medium text-lg mb-1">{statusMessage}</p>
                <div className="min-h-[40px] flex items-center">
                    <p className="text-slate-400 text-sm animate-in fade-in duration-700" key={tipIndex}>
                        {warmTips[tipIndex]}
                    </p>
                </div>
            </div>
        </div>
    );
}
