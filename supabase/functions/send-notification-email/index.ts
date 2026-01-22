const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TO_EMAIL = 'bodalauyraul2026@gmail.com'

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const { record } = await req.json()

    // Determinar tipo de respuesta
    const typeLabel = record.type === 'ceremony' ? 'Ceremonia'
      : record.type === 'party' ? 'Fiesta'
        : 'Sugerencia de Canción'

    const attendingLabel = record.attending ? 'SÍ asistirá' : 'NO asistirá'

    // Enviar email usando Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Invitaciones VIP <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject: `📋 Nueva respuesta: ${record.full_name} - ${typeLabel}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
              Nueva Respuesta de Invitación
            </h2>
            
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>📝 Tipo:</strong> ${typeLabel}</p>
              <p style="margin: 10px 0;"><strong>👤 Nombre:</strong> ${record.full_name}</p>
              ${record.type !== 'song' ? `<p style="margin: 10px 0;"><strong>✅ Asistencia:</strong> ${attendingLabel}</p>` : ''}
              ${record.message ? `<p style="margin: 10px 0;"><strong>💬 Mensaje:</strong><br>${record.message}</p>` : ''}
            </div>
            
            <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
              Recibido el: ${new Date(record.created_at).toLocaleString('es-AR')}
            </p>
          </div>
        `,
      }),
    })

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
