import type { EventData } from './types';

// Servicios propios de EventPix que el organizador ofrece dentro de la
// checklist de "Mi Evento" (en vez de un banner aparte).

export const EVENTPIX_WHATSAPP = '5493624547382';
export const EVENTPIX_INFO_URL = 'https://event-pix.com.ar/eventos';

// Dorado: solo para lo que es pago o lo hace EventPix. Lo gratis va en azul.
export const GOLD_BUTTON = 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20';
export const GOLD_CARD = 'bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30';
export const GOLD_TEXT = 'text-amber-400';

export interface EventPixOffer {
    title: string;
    description: string;
    bullets: string[];
    /** 'plan': se compra en el organizador (Invitación / Ingreso VIP). 'contact': se pide presupuesto por WhatsApp. */
    kind: 'plan' | 'contact';
    demoUrl?: string;
}

/** Oferta de EventPix para cada ítem de la checklist (por nombre del servicio). */
export const EVENTPIX_OFFERS: Record<string, EventPixOffer> = {
    'Invitaciones': {
        title: 'Invitación Digital EventPix',
        description: 'Una web hermosa para tu evento: cada invitado recibe su link, confirma solo y te dice si necesita menú especial.',
        bullets: ['Link personal por invitado', 'Confirmación y menú especial', 'Ubicación, regalos y música'],
        kind: 'plan',
        demoUrl: '/invitacion/muestra',
    },
    'Recepción / Ingreso': {
        title: 'Recepcionista Virtual',
        description: 'En la entrada, cada invitado busca su nombre en una pantalla y ve su mesa con un video de bienvenida. Sin listas de papel ni filas.',
        bullets: ['Búsqueda por nombre o por voz', 'Mesa y video de bienvenida', 'Usa tu lista y tus mesas de acá'],
        kind: 'plan',
    },
    'Fotografía / Video': {
        title: 'EventPix en pantalla',
        description: 'Tus invitados suben fotos y mensajes con un QR y aparecen en vivo en la pantalla del salón. Después te quedás con el álbum completo.',
        bullets: ['Fotos de los invitados en vivo', 'Mensajes y dedicatorias', 'Álbum de la fiesta en Drive'],
        kind: 'contact',
    },
    'Pantalla LED': {
        title: 'EventPix en pantalla',
        description: 'Llevá la pantalla a otro nivel: muro de fotos y mensajes de los invitados en vivo, sorteos y juegos.',
        bullets: ['Muro de fotos en vivo', 'Sorteos y trivia en pantalla', 'Se maneja desde el celular'],
        kind: 'contact',
    },
    'Entretenimiento / show': {
        title: 'Kiosco Box y Espejo Mágico',
        description: 'Cabina de fotos con inteligencia artificial: los invitados se transforman en personajes, se llevan la foto impresa y sale en la pantalla.',
        bullets: ['Fotos con IA y marcos del evento', 'Impresión al instante', 'Figuritas y espejo mágico'],
        kind: 'contact',
    },
};

export const eventPixWhatsAppUrl = (offer: EventPixOffer, eventData: EventData) => {
    const date = eventData.date ? ` el ${eventData.date.split('-').reverse().join('/')}` : '';
    const text = `¡Hola EventPix! Estoy organizando "${eventData.name || 'mi evento'}"${date} para ${eventData.guests.length || 'unos'} invitados y me interesa ${offer.title}. ¿Me pasan un presupuesto?`;
    return `https://wa.me/${EVENTPIX_WHATSAPP}?text=${encodeURIComponent(text)}`;
};

/**
 * Progreso del evento (0 a 100). Un solo cálculo para todo el organizador:
 * invitados 20, mesas 20, presupuesto 10 y lo imprescindible resuelto 50.
 */
export function computeProgress(eventData: EventData): number {
    const imprescindible = eventData.services.filter(s => s.group === 'imprescindible');
    let progress = 0;
    if (eventData.guests.length > 0) progress += 20;
    if (eventData.tables.length > 0) progress += 20;
    if (eventData.estimatedBudget > 0) progress += 10;
    if (imprescindible.length > 0) {
        progress += Math.floor((imprescindible.filter(s => s.status === 'ready').length / imprescindible.length) * 50);
    }
    return Math.min(progress, 100);
}
