// lib/mercadopago.ts
import { supabase } from './supabase';

/**
 * IMPORTANTE: Para producción, este código se conecta al backend
 * (Supabase Edge Functions) para no exponer el ACCESS_TOKEN en el frontend.
 */

// Credenciales de Producción
export const MP_PUBLIC_KEY = 'APP_USR-e318ae46-db63-459b-996e-6782a6737cbf';

export const createPreference = async (plan: 'esencial' | 'premium', eventId: string = 'demo', price: number) => {
    try {
        const { data, error } = await supabase.functions.invoke('mercadopago', {
            body: { plan, eventId, price }
        });

        if (error) {
            console.error("Supabase Function Error:", error);
            throw new Error('Error conectando con el servidor de pagos');
        }

        if (data.error) {
            throw new Error(data.error);
        }

        return data.init_point;
    } catch (error) {
        console.error('MercadoPago Error:', error);
        throw error;
    }
};
