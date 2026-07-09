// lib/mercadopago.ts
import { supabase } from './supabase';

/**
 * IMPORTANTE: Para producción, este código se conecta al backend
 * (Supabase Edge Functions) para no exponer el ACCESS_TOKEN en el frontend.
 */

// Credenciales de Producción (Real)
export const MP_PUBLIC_KEY = 'APP_USR-76370c80-b95e-45c0-96a5-b72d57a804b2';

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
