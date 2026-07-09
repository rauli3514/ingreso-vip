// lib/mercadopago.ts

/**
 * IMPORTANTE: Para producción, este código debería moverse a un backend 
 * (ej. Supabase Edge Functions) para no exponer el ACCESS_TOKEN en el frontend.
 * Para fase de pruebas con credenciales TEST, es seguro utilizarlo aquí.
 */

// Credenciales de Producción
export const MP_PUBLIC_KEY = 'APP_USR-3c4e6c7e-3578-47b0-800a-527a5fd01df6';
const MP_ACCESS_TOKEN = 'APP_USR-6926660168158196-070821-5fdad881e3b09333594d7f7731ae1254-3451172544';

export const createPreference = async (plan: 'esencial' | 'premium', eventId: string = 'demo', price: number) => {
    
    let title = '';
    
    if (plan === 'esencial') {
        title = 'Plan Invitación Digital EventPix';
    } else {
        title = 'Plan Ingreso VIP EventPix';
    }

    const body = {
        items: [
            {
                title: title,
                description: `Acceso a ${title}`,
                quantity: 1,
                currency_id: 'ARS',
                unit_price: price,
            }
        ],
        back_urls: {
            success: `${window.location.origin}/planificador?payment_success=true&plan=${plan}`,
            failure: `${window.location.origin}/planificador?payment_failure=true`,
            pending: `${window.location.origin}/planificador?payment_pending=true`
        },
        external_reference: eventId
    };

    try {
        const response = await fetch('/mp-api/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error('Error MP Data:', errData);
            throw new Error(errData.message || 'Error creando preferencia de pago');
        }

        const data = await response.json();
        // Volvemos a init_point porque sandbox_init_point falla con ERR_TOO_MANY_REDIRECTS en Chrome Incógnito
        return data.init_point; 
    } catch (error) {
        console.error('MercadoPago Error:', error);
        throw error;
    }
};
