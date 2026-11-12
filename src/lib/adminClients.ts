import { supabase } from './supabase';
import { PAID_MODULES } from './plans';
import { computeProgress } from '../pages/public/event_planner/eventpixServices';

// Datos reales de cada cliente del organizador para el Business Admin:
// lo que cargó en su evento, si compró, si pidió presupuestos y cuándo entró.

export interface ClientEvent {
    id: string;
    name: string;
    date: string | null;
    daysLeft: number | null;
    guests: number;
    confirmed: number;
    tables: number;
    progress: number;
    modules: string[];
    hasInvitation: boolean;
    plannerData: any;
}

export type Opportunity = 'compro' | 'llamar' | 'empezando' | 'pasado' | 'sin_evento';

export interface ClientRow {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    created_at: string;
    is_active: boolean;
    lastSignIn: string | null;
    events: ClientEvent[];
    leadsCount: number;
    opportunity: Opportunity;
}

export const OPPORTUNITY_LABELS: Record<Opportunity, string> = {
    compro: 'Ya compró',
    llamar: 'Para llamar',
    empezando: 'Recién empieza',
    pasado: 'Evento pasado',
    sin_evento: 'Sin evento',
};

export const MODULE_LABELS: Record<string, string> = {
    invitation_pro: 'Invitación',
    vip_access: 'Ingreso VIP',
};

/** Días que faltan hasta la fecha (negativo si ya pasó). */
export function daysUntil(date: string | null | undefined): number | null {
    if (!date) return null;
    const target = new Date(`${date.slice(0, 10)}T00:00:00`);
    if (isNaN(target.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function formatDaysLeft(days: number | null): string {
    if (days === null) return 'Sin fecha';
    if (days < 0) return `Fue hace ${-days} día${days === -1 ? '' : 's'}`;
    if (days === 0) return 'Es hoy';
    return `Faltan ${days} día${days === 1 ? '' : 's'}`;
}

export function formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date.length === 10 ? `${date}T00:00:00` : date);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** "hace 3 días", "hoy", "hace 2 meses". */
export function timeAgo(date: string | null | undefined): string {
    if (!date) return 'Nunca';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    const months = Math.floor(days / 30);
    return `Hace ${months} mes${months === 1 ? '' : 'es'}`;
}

/** Link de WhatsApp con un mensaje ya escrito. null si no hay teléfono. */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
    const digits = (phone || '').replace(/[^0-9]/g, '');
    if (digits.length < 8) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function clientMessage(name: string, eventName?: string): string {
    const first = name.split(' ')[0];
    const evento = eventName ? ` "${eventName}"` : ' tu evento';
    return `¡Hola ${first}! Te escribo de EventPix. Vi que estás organizando${evento} en nuestro organizador. ¿Te puedo ayudar con la invitación digital o la recepción de invitados?`;
}

/** Resume un evento con lo que el cliente cargó en el organizador. */
export function summarizeEvent(e: any, invitationEventIds: Set<string>): ClientEvent {
    const pd = e.planner_data || {};
    const plannerGuests: any[] = Array.isArray(pd.guests) ? pd.guests : [];
    const dbGuests = Array.isArray(e.guests) && e.guests[0] ? e.guests[0].count || 0 : 0;
    const date = pd.date || e.date || null;
    let progress = 0;
    try {
        progress = computeProgress({
            ...pd,
            guests: plannerGuests,
            tables: Array.isArray(pd.tables) ? pd.tables : [],
            services: Array.isArray(pd.services) ? pd.services : [],
            estimatedBudget: pd.estimatedBudget || 0,
        });
    } catch {
        progress = 0;
    }
    return {
        id: e.id,
        name: pd.name || e.name || 'Sin nombre',
        date,
        daysLeft: daysUntil(date),
        guests: plannerGuests.length || dbGuests || 0,
        confirmed: plannerGuests.filter(g => g?.status === 'confirmed').length,
        tables: Array.isArray(pd.tables) ? pd.tables.length : (e.table_count || 0),
        progress,
        modules: (Array.isArray(pd.active_modules) ? pd.active_modules : []).filter((m: string) => PAID_MODULES.includes(m)),
        hasInvitation: invitationEventIds.has(e.id),
        plannerData: pd,
    };
}

function opportunityOf(events: ClientEvent[]): Opportunity {
    if (events.length === 0) return 'sin_evento';
    if (events.some(e => e.modules.length > 0)) return 'compro';
    const upcoming = events.filter(e => e.daysLeft === null || e.daysLeft >= 0);
    if (upcoming.length === 0) return 'pasado';
    // Tiene invitados cargados o el evento está cerca: vale la pena escribirle.
    if (upcoming.some(e => e.guests > 0 || (e.daysLeft !== null && e.daysLeft <= 120))) return 'llamar';
    return 'empezando';
}

/** Trae todos los clientes (no superadmin) con sus eventos y actividad. */
export async function fetchClients(): Promise<ClientRow[]> {
    const [profilesRes, eventsRes, invitationsRes, leadsRes, signInsRes] = await Promise.all([
        supabase.from('profiles').select('*').neq('role', 'superadmin').order('created_at', { ascending: false }),
        supabase.from('events').select('id, name, date, created_at, owner_id, table_count, planner_data, guests(count)'),
        supabase.from('event_invitations').select('event_id'),
        supabase.from('leads').select('*'),
        // Necesita migrations/2026_10_leads_reales.sql; sin eso, no se muestra el último ingreso.
        supabase.rpc('admin_last_sign_ins'),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const invitationIds = new Set<string>((invitationsRes.data || []).map((i: any) => i.event_id));
    const lastSignIn = new Map<string, string>(((signInsRes.data as any[]) || []).map(r => [r.id, r.last_sign_in_at]));
    const events = eventsRes.data || [];
    const eventOwner = new Map<string, string>(events.map((e: any) => [e.id, e.owner_id]));
    const leadsByOwner = new Map<string, number>();
    for (const l of (leadsRes.data as any[]) || []) {
        const owner = l.owner_id || (l.event_id ? eventOwner.get(l.event_id) : null);
        if (owner) leadsByOwner.set(owner, (leadsByOwner.get(owner) || 0) + 1);
    }

    return (profilesRes.data || []).map((p: any) => {
        const own = events
            .filter((e: any) => e.owner_id === p.id)
            .map((e: any) => summarizeEvent(e, invitationIds))
            .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
        const email = p.email || '';
        return {
            id: p.id,
            email,
            name: p.full_name || p.username || email.split('@')[0] || 'Sin nombre',
            phone: p.phone || null,
            created_at: p.created_at,
            is_active: p.is_active !== false,
            lastSignIn: lastSignIn.get(p.id) || null,
            events: own,
            leadsCount: leadsByOwner.get(p.id) || 0,
            opportunity: opportunityOf(own),
        };
    });
}
