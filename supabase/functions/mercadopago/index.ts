import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, eventId, price } = await req.json()
    
    // Validate
    if (!plan || !price) {
      throw new Error('Faltan datos obligatorios')
    }

    const title = plan === 'esencial' ? 'Plan Invitación Digital EventPix' : 'Plan Ingreso VIP EventPix';
    
    // MODO PRODUCCIÓN: El token se saca de las variables de entorno de Supabase
    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');

    if (!MP_ACCESS_TOKEN) {
        throw new Error('El Token de MercadoPago no está configurado en Supabase Secrets');
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
            success: `https://organizador.event-pix.com.ar/planificador?payment_success=true&plan=${plan}`,
            failure: `https://organizador.event-pix.com.ar/planificador?payment_failure=true`,
            pending: `https://organizador.event-pix.com.ar/planificador?payment_pending=true`
        },
        external_reference: eventId
    };

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!mpResponse.ok) {
        const errorData = await mpResponse.json();
        console.error("MP Error:", errorData);
        throw new Error(errorData.message || 'Error en MercadoPago');
    }

    const mpData = await mpResponse.json();

    return new Response(
      JSON.stringify({ init_point: mpData.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
