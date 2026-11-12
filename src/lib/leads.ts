import { supabase } from './supabase';
import type { EventData } from '../pages/public/event_planner/types';

/**
 * Guarda un pedido de presupuesto hecho desde el organizador.
 * providerId null = el pedido es para EventPix (Kiosco Box, pantalla, etc.).
 * Guarda quién lo pidió (la base completa owner_id con la cuenta) y no corta
 * el flujo: si falla, el cliente igual sigue a WhatsApp.
 */
export async function recordLead({ providerId, service, eventData }: {
    providerId: string | null;
    service: string;
    eventData: EventData;
}) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const meta = user?.user_metadata || {};
        const { error } = await supabase.from('leads').insert([{
            provider_id: providerId,
            event_id: eventData.cloudEventId || null,
            client_name: meta.full_name || meta.name || user?.email?.split('@')[0] || 'Sin cuenta',
            client_email: user?.email || null,
            client_phone: meta.phone || null,
            estimated_budget: eventData.estimatedBudget || 0,
            event_details: {
                service_requested: service,
                event_name: eventData.name || null,
                date: eventData.date || null,
                guests_count: eventData.guests?.length || 0,
                tables_count: eventData.tables?.length || 0,
            },
            status: 'nuevo',
        }]);
        if (error) throw error;
    } catch (err) {
        console.error('No se pudo guardar el lead:', err);
    }
}
