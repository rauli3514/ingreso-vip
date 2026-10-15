import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { GOLD_BUTTON, GOLD_CARD, GOLD_TEXT } from '../eventpixServices';
import { trackEvent } from '../../../../lib/analytics';

interface UpsellBannerProps {
    /** Identifica la oferta: si el cliente la cierra, no vuelve a aparecer. */
    id: string;
    title: string;
    text: string;
    cta: string;
    onCta: () => void;
    secondary?: { label: string; href: string };
}

const dismissedKey = (id: string) => `eventpix_offer_dismissed_${id}`;

// Oferta de un servicio pago en el momento justo (dorado = pago).
export default function UpsellBanner({ id, title, text, cta, onCta, secondary }: UpsellBannerProps) {
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(dismissedKey(id)) === '1'; } catch { return false; }
    });
    if (dismissed) return null;

    const dismiss = () => {
        try { localStorage.setItem(dismissedKey(id), '1'); } catch { /* sin almacenamiento: solo se oculta ahora */ }
        setDismissed(true);
    };

    return (
        <div className={`${GOLD_CARD} rounded-2xl p-4 mb-4 relative animate-in fade-in slide-in-from-top-2`}>
            <button onClick={dismiss} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300" title="No mostrar más">
                <X size={16} />
            </button>
            <div className="flex flex-col md:flex-row md:items-center gap-3 pr-6">
                <div className="flex-1">
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${GOLD_TEXT} flex items-center gap-1.5 mb-1`}>
                        <Star size={12} className="fill-amber-400" /> {title}
                    </p>
                    <p className="text-sm text-slate-200">{text}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    {secondary && (
                        <a href={secondary.href} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 transition-colors">
                            {secondary.label}
                        </a>
                    )}
                    <button
                        onClick={() => { trackEvent('upsell_clicked', { offer: id }); onCta(); }}
                        className={`px-4 py-2 rounded-xl text-xs transition-all ${GOLD_BUTTON}`}
                    >
                        {cta}
                    </button>
                </div>
            </div>
        </div>
    );
}
