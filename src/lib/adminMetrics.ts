import { supabase } from './supabase';
import { PAID_MODULES } from './plans';

// Números reales del negocio, sacados de la base (no del navegador).
// Solo los puede leer el superadmin.

export type Period = '30d' | 'year' | 'all';

export const PERIOD_LABELS: Record<Period, string> = {
    '30d': 'Últimos 30 días',
    year: 'Este año',
    all: 'Desde el principio',
};

export const periodStart = (period: Period): Date | null => {
    const now = new Date();
    if (period === '30d') return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (period === 'year') return new Date(now.getFullYear(), 0, 1);
    return null;
};

export const inPeriod = (createdAt: string | null | undefined, period: Period) => {
    const start = periodStart(period);
    if (!start) return true;
    return !!createdAt && new Date(createdAt) >= start;
};

export const formatARS = (value: number) =>
    `$${Math.round(value).toLocaleString('es-AR')}`;

// PostgREST devuelve como máximo 1000 filas por pedido: se piden de a páginas.
async function fetchAll<T>(table: string, columns: string): Promise<T[]> {
    const pageSize = 1000;
    const rows: T[] = [];
    for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
            .from(table)
            .select(columns)
            .range(from, from + pageSize - 1);
        if (error) throw error;
        rows.push(...((data || []) as T[]));
        if (!data || data.length < pageSize) return rows;
    }
}

export interface MetricsEvent {
    id: string;
    name: string | null;
    created_at: string;
    owner_id: string | null;
    modules: string[] | null;
    first_planner_guest: unknown;
}

export interface MetricsPayment {
    id: string;
    event_id: string | null;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
    mp_payment_id: string | null;
}

export interface BusinessData {
    profiles: { id: string; email: string | null; created_at: string }[];
    events: MetricsEvent[];
    eventIdsWithGuests: Set<string>;
    eventIdsWithInvitation: Set<string>;
    payments: MetricsPayment[];
}

export async function fetchBusinessData(): Promise<BusinessData> {
    const [profiles, events, guests, invitations, payments] = await Promise.all([
        fetchAll<{ id: string; email: string | null; created_at: string }>('profiles', 'id, email, created_at'),
        fetchAll<MetricsEvent>('events', 'id, name, created_at, owner_id, modules:planner_data->active_modules, first_planner_guest:planner_data->guests->0'),
        fetchAll<{ event_id: string }>('guests', 'event_id'),
        fetchAll<{ event_id: string }>('event_invitations', 'event_id'),
        fetchAll<MetricsPayment>('payments', 'id, event_id, plan_name, amount, status, created_at, mp_payment_id'),
    ]);

    const eventIdsWithGuests = new Set(guests.map(g => g.event_id));
    events.forEach(e => { if (e.first_planner_guest) eventIdsWithGuests.add(e.id); });

    return {
        profiles,
        events,
        eventIdsWithGuests,
        eventIdsWithInvitation: new Set(invitations.map(i => i.event_id)),
        payments: payments.map(p => ({ ...p, amount: Number(p.amount) || 0 })),
    };
}

export const hasModule = (e: MetricsEvent, module: string) =>
    Array.isArray(e.modules) && e.modules.includes(module);

export const isPaidEvent = (e: MetricsEvent) =>
    Array.isArray(e.modules) && e.modules.some(m => PAID_MODULES.includes(m));

// Un pago confirmado por MercadoPago tiene su número de comprobante.
// Los anteriores al cobro seguro (octubre 2026) no lo tienen y no se pueden verificar.
export const isVerifiedPayment = (p: MetricsPayment) =>
    !!p.mp_payment_id && p.status === 'approved';

export interface FunnelStep {
    label: string;
    help: string;
    value: number;
}

// Embudo real de los eventos creados en el período: de cada evento creado,
// cuántos llegaron a cada paso.
export function buildFunnel(data: BusinessData, period: Period): { accounts: number; steps: FunnelStep[] } {
    const events = data.events.filter(e => inPeriod(e.created_at, period));
    const accounts = data.profiles.filter(p => inPeriod(p.created_at, period)).length;

    return {
        accounts,
        steps: [
            { label: 'Crearon un evento', help: 'Eventos guardados en el planificador o en el panel', value: events.length },
            { label: 'Cargaron invitados', help: 'Con al menos un invitado', value: events.filter(e => data.eventIdsWithGuests.has(e.id)).length },
            { label: 'Armaron la invitación', help: 'Con la invitación digital creada', value: events.filter(e => data.eventIdsWithInvitation.has(e.id)).length },
            { label: 'Pagaron un plan', help: 'Con Invitación Digital o Ingreso VIP activo', value: events.filter(isPaidEvent).length },
        ],
    };
}
