import { createClient } from 'npm:@supabase/supabase-js@2.96.0'
// Planes que se cobran con MercadoPago y qué módulos activa cada uno.
// La misma lista está en mercadopago y mercadopago-webhook (cada función va en
// un solo archivo para poder pegarla desde el panel): si cambia, cambiar las dos.

type PlanName = 'esencial' | 'premium';

const PLANS: Record<PlanName, { title: string; priceColumn: string; fallbackPrice: number; modules: string[] }> = {
  esencial: {
    title: 'Plan Invitación Digital EventPix',
    priceColumn: 'plan_esencial_price',
    fallbackPrice: 45000,
    modules: ['invitation_pro'],
  },
  premium: {
    title: 'Plan Ingreso VIP EventPix',
    priceColumn: 'plan_premium_price',
    fallbackPrice: 85000,
    modules: ['invitation_pro', 'vip_access'],
  },
};

const isPlanName = (value: unknown): value is PlanName =>
  value === 'esencial' || value === 'premium';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://organizador.event-pix.com.ar'

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // El precio que manda el navegador se ignora: se lee de app_settings.
    const { plan, eventId } = await req.json()

    if (!isPlanName(plan) || !eventId) {
      throw new Error('Faltan datos obligatorios')
    }

    const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
    if (!MP_ACCESS_TOKEN) {
      throw new Error('El Token de MercadoPago no está configurado en Supabase Secrets')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // El evento tiene que existir y ser de quien está pagando.
    const authHeader = req.headers.get('Authorization') ?? ''
    const { data: { user } } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) {
      throw new Error('Tenés que iniciar sesión para pagar')
    }
    const { data: event } = await admin
      .from('events')
      .select('id, owner_id')
      .eq('id', eventId)
      .single()
    if (!event || event.owner_id !== user.id) {
      throw new Error('No encontramos tu evento')
    }

    const config = PLANS[plan]
    const { data: settings } = await admin
      .from('app_settings')
      .select(config.priceColumn)
      .eq('id', 1)
      .single()
    const price = Number((settings as Record<string, unknown> | null)?.[config.priceColumn]) || config.fallbackPrice

    const body = {
      items: [
        {
          title: config.title,
          description: `Acceso a ${config.title}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: price,
        }
      ],
      back_urls: {
        success: `${SITE_URL}/planificador?payment_success=true&plan=${plan}`,
        failure: `${SITE_URL}/planificador?payment_failure=true`,
        pending: `${SITE_URL}/planificador?payment_pending=true`
      },
      // MercadoPago avisa acá cada cambio del pago; es lo único que activa el plan.
      notification_url: `${supabaseUrl}/functions/v1/mercadopago-webhook`,
      external_reference: `${eventId}:${plan}`,
      metadata: { event_id: eventId, plan, expected_price: price },
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json()
      throw new Error(errorData.message || 'Error en MercadoPago')
    }

    const mpData = await mpResponse.json()

    return new Response(
      JSON.stringify({ init_point: mpData.init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
