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

// MercadoPago llama a esta función cada vez que cambia un pago.
// El aviso trae solo el número de pago: con ese número se le pregunta a
// MercadoPago (con nuestro token) cómo quedó el pago. Así un aviso falso no
// activa nada, porque el pago tiene que existir, estar aprobado y ser nuestro.
// Se publica sin verificación de JWT (MercadoPago no manda uno): ver config.toml.

const ok = (message: string) => new Response(JSON.stringify({ message }), {
  headers: { 'Content-Type': 'application/json' },
  status: 200,
})

Deno.serve(async (req) => {
  const url = new URL(req.url)
  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // Los avisos viejos (IPN) vienen sin cuerpo, solo con parámetros en la URL.
  }

  // Formato nuevo (webhook): { type: 'payment', data: { id } } o ?type=payment&data.id=
  // Formato viejo (IPN): ?topic=payment&id=
  const type = body?.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic')
  const paymentId = body?.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id')

  if (type !== 'payment' || !paymentId) {
    return ok('Aviso ignorado')
  }

  const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')
  if (!MP_ACCESS_TOKEN) {
    // 500 para que MercadoPago reintente cuando el token esté configurado.
    return new Response('MP_ACCESS_TOKEN no configurado', { status: 500 })
  }

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(String(paymentId))}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` },
  })
  if (mpResponse.status === 404) {
    return ok('Pago inexistente')
  }
  if (!mpResponse.ok) {
    return new Response('No se pudo consultar el pago', { status: 502 })
  }
  const payment = await mpResponse.json()

  if (payment.status !== 'approved') {
    return ok(`Pago en estado ${payment.status}`)
  }

  // external_reference = "<eventId>:<plan>" (lo arma la función mercadopago).
  const [eventId, plan] = String(payment.external_reference ?? '').split(':')
  if (!eventId || !isPlanName(plan)) {
    return ok('Pago que no es de un plan')
  }

  // El precio esperado lo guardó el servidor al crear el pago; el monto
  // cobrado tiene que llegar a ese precio y ser en pesos.
  const expectedPrice = Number(payment.metadata?.expected_price) || PLANS[plan].fallbackPrice
  if (payment.currency_id !== 'ARS' || Number(payment.transaction_amount) < expectedPrice) {
    console.error('Monto o moneda no coinciden', { paymentId, eventId, plan, amount: payment.transaction_amount, expectedPrice })
    return ok('Monto no coincide')
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('id, planner_data')
    .eq('id', eventId)
    .single()
  if (eventError || !event) {
    console.error('Evento no encontrado para el pago', { paymentId, eventId, eventError })
    return ok('Evento no encontrado')
  }

  const plannerData = event.planner_data || {}
  const modules = new Set<string>(plannerData.active_modules || [])
  PLANS[plan].modules.forEach(m => modules.add(m))

  const { error: updateError } = await admin
    .from('events')
    .update({ planner_data: { ...plannerData, active_modules: Array.from(modules) } })
    .eq('id', eventId)
  if (updateError) {
    console.error('No se pudo activar el plan', updateError)
    return new Response('No se pudo activar el plan', { status: 500 })
  }

  // Un pago se registra una sola vez aunque MercadoPago avise varias veces.
  const { error: paymentError } = await admin
    .from('payments')
    .upsert({
      event_id: eventId,
      plan_name: plan,
      amount: Number(payment.transaction_amount),
      status: 'approved',
      mp_payment_id: String(payment.id),
    }, { onConflict: 'mp_payment_id', ignoreDuplicates: true })
  if (paymentError) {
    console.error('No se pudo registrar el pago', paymentError)
  }

  return ok('Plan activado')
})
