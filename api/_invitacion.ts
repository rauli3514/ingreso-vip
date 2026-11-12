// Datos de una invitación para la vista previa de WhatsApp, Facebook, Telegram, etc.
// Lo usan api/invitacion-preview.ts (el HTML con las etiquetas og:) y
// api/invitacion-imagen.ts (la imagen). Los archivos con "_" no son funciones.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ijvbnduaecrpsaivgzay.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface InvitationPreview {
    eventId: string;
    title: string;
    subtitle: string;
    dateText: string;
    guestName: string | null;
    coverUrl: string | null;
}

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** "Sábado 12 de diciembre de 2026". Lee solo la fecha (sin zona horaria). */
export function formatEventDate(value: string | null | undefined): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    const day = DAYS[d.getUTCDay()];
    return `${day[0].toUpperCase()}${day.slice(1)} ${+m[3]} de ${MONTHS[+m[2] - 1]} de ${m[1]}`;
}

async function rest(path: string, init?: RequestInit): Promise<any> {
    if (!SUPABASE_KEY) return null;
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
            ...init,
            headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function loadInvitationPreview(eventId: string | null, guestId: string | null): Promise<InvitationPreview | null> {
    if (!eventId || !UUID.test(eventId)) return null;

    const [invitations, events, guests] = await Promise.all([
        rest(`event_invitations?event_id=eq.${eventId}&select=hero_section,countdown_section,party_section,ceremony_section,cover_image_url&limit=1`),
        rest(`events?id=eq.${eventId}&select=name,date&limit=1`),
        guestId && UUID.test(guestId)
            ? rest('rpc/get_guest_invitation', { method: 'POST', body: JSON.stringify({ p_guest_id: guestId }) })
            : Promise.resolve(null),
    ]);

    const inv = Array.isArray(invitations) ? invitations[0] : null;
    const ev = Array.isArray(events) ? events[0] : null;
    if (!inv && !ev) return null;

    const hero = inv?.hero_section || {};
    const guest = Array.isArray(guests) ? guests[0] : guests;
    const guestName = guest && guest.event_id === eventId
        ? `${guest.first_name || ''} ${guest.last_name || ''}`.trim() || null
        : null;

    const rawDate = inv?.party_section?.start_time || inv?.ceremony_section?.start_time
        || inv?.countdown_section?.target_date || ev?.date || null;

    const cover = typeof inv?.cover_image_url === 'string' && /^https:\/\//.test(inv.cover_image_url) ? inv.cover_image_url : null;

    return {
        eventId,
        title: (hero.title || ev?.name || 'Estás invitado').toString().slice(0, 80),
        // El Creador Mágico pone "¡Estás Invitado!" de subtítulo: ya lo dice la tarjeta.
        subtitle: /est[aá]s invitad/i.test(hero.subtitle || '') ? '' : (hero.subtitle || '').toString().slice(0, 100),
        dateText: formatEventDate(rawDate),
        guestName,
        coverUrl: cover,
    };
}

export function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
