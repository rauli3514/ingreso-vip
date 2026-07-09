// lib/mercadopago.ts
import { supabase } from './supabase';

/**
 * IMPORTANTE: Para producción, este código debería moverse a un backend 
 * (ej. Supabase Edge Functions) para no exponer el ACCESS_TOKEN en el frontend.
// Credenciales de Producción
export const MP_PUBLIC_KEY = 'APP_USR-e318ae46-db63-459b-996e-6782a6737cbf';
// EL TOKEN DE ACCESO FUE ELIMINADO POR SEGURIDAD. NO DEBE ESTAR EN EL FRONTEND.
// SE DEBE UTILIZAR UNA EDGE FUNCTION O BACKEND PARA CREAR LA PREFERENCIA.
const MP_ACCESS_TOKEN = 'TOKEN_ELIMINADO_POR_SEGURIDAD';

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
