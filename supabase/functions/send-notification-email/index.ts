import { createClient } from 'npm:@supabase/supabase-js@2.96.0'

// Avisa por mail al dueño del evento cada respuesta de su invitación.
// La llama el trigger on_new_invitation_response con { response_id }: la
// respuesta se busca en la base, así que un llamado con datos inventados no
// manda nada. Se publica sin verificación de JWT (ver config.toml).

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('NOTIFICATION_FROM_EMAIL') ?? 'Invitaciones VIP <onboarding@resend.dev>'

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { response_id } = await req.json()
    if (!response_id) return json({ error: 'Falta response_id' }, 400)
    if (!RESEND_API_KEY) return json({ error: 'RESEND_API_KEY no configurada' }, 500)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: record } = await admin
      .from('invitation_responses')
      .select('*')
      .eq('id', response_id)
      .single()
    if (!record) return json({ message: 'Respuesta no encontrada' })

    const { data: event } = await admin
      .from('events')
      .select('name, owner_id')
      .eq('id', record.event_id)
      .single()
    if (!event?.owner_id) return json({ message: 'Evento sin dueño' })

    const { data: owner } = await admin.auth.admin.getUserById(event.owner_id)
    const toEmail = owner?.user?.email
    if (!toEmail) return json({ message: 'El dueño del evento no tiene mail' })

    const typeLabel = record.type === 'ceremony' ? 'Ceremonia'
      : record.type === 'party' ? 'Fiesta'
        : 'Sugerencia de Canción'
    const attendingLabel = record.attending ? 'SÍ asistirá' : 'NO asistirá'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: `📋 ${event.name || 'Tu evento'}: ${record.full_name} - ${typeLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
              Nueva respuesta de invitación
            </h2>

            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>🎉 Evento:</strong> ${escapeHtml(event.name)}</p>
              <p style="margin: 10px 0;"><strong>📝 Tipo:</strong> ${typeLabel}</p>
              <p style="margin: 10px 0;"><strong>👤 Nombre:</strong> ${escapeHtml(record.full_name)}</p>
              ${record.type !== 'song' ? `<p style="margin: 10px 0;"><strong>✅ Asistencia:</strong> ${attendingLabel}</p>` : ''}
              ${record.message ? `<p style="margin: 10px 0;"><strong>💬 Mensaje:</strong><br>${escapeHtml(record.message)}</p>` : ''}
            </div>

            <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
              Recibido el: ${new Date(record.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
            </p>
          </div>
        `,
      }),
    })

    return json(await res.json(), res.ok ? 200 : 502)
  } catch (error) {
    console.error('Error:', error)
    return json({ error: (error as Error).message }, 500)
  }
})
