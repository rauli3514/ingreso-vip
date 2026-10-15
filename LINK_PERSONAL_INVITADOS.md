# Link personal por invitado

Cada invitado de la lista tiene su propio link: `/invitacion/<evento>?i=<código>`.
El código es el id del invitado (al azar, no se puede adivinar).

## Qué ve el invitado

- Su nombre, sus pases y sus acompañantes.
- **Confirmar asistencia** sin escribir su nombre: dice si va, cuántos van (de sus
  pases) y si alguien necesita menú especial (vegetariano, vegano, celíaco u otro).
- Si ya respondió, lo ve y puede cambiar la respuesta.

Los links viejos (`?guest=Nombre`) siguen funcionando como antes.

## Qué ve el organizador

- **Invitación → Invitados**: el botón Copiar y el de WhatsApp ya usan el link
  personal. Cada invitado muestra *Va · 2 de 3*, *No va* o *Sin responder*, su menú
  especial y su mensaje. Arriba, el resumen para el catering: personas que van,
  confirmaciones, no van / sin responder y cuántos menús especiales de cada tipo.
- **Evento → Invitados**: el estado cambia solo (*Confirmado*, *No va*), con
  cuántos van y el menú especial.
- Editar un invitado ya no borra su respuesta.

## Aviso por mail

Cada respuesta le llega por mail **al dueño del evento** (antes llegaba siempre a
la misma casilla, para todos los eventos). Lo manda la base, no el navegador.

## Pasos para ponerlo en producción

1. **SQL:** ejecutar `migrations/2026_10_link_personal_invitados.sql` en el SQL
   Editor. Si el proyecto no es `ijvbnduaecrpsaivgzay`, cambiar antes la
   dirección de la función en la sección 4 del script.
2. **Función `send-notification-email`:** en **Edge Functions**, reemplazar su
   código por `supabase/functions/send-notification-email/index.ts`, **Deploy**, y en
   su **Settings** desactivar **Verify JWT**.
3. **Resend:**
   - **Cambiar la API key**: la vieja estuvo escrita en el código de este repo
     público. En https://resend.com/api-keys borrarla, crear una nueva y cargarla
     en **Edge Functions → Secrets** como `RESEND_API_KEY`.
   - Con el remitente de prueba `onboarding@resend.dev`, Resend solo deja mandar
     a tu propia casilla. Para que les llegue a tus clientes, verificá tu dominio
     en Resend (por ejemplo `event-pix.com.ar`) y cargá en Secrets
     `NOTIFICATION_FROM_EMAIL` = `Invitaciones <avisos@event-pix.com.ar>`.
4. **Sitio:** publicar el frontend nuevo.

## Cómo probarlo

1. En **Invitación → Invitados**, crear un invitado con 3 pases y copiar su link.
2. Abrirlo en el celular: tiene que saludar por nombre y mostrar los 3 pases.
3. Confirmar: van 2, menú celíaco. En el panel tiene que aparecer *Va · 2 de 3* y
   *🍽 Celíaco (sin TACC)*, y en el resumen 2 personas y 1 menú especial.
4. Volver a abrir el link: tiene que decir "Ya confirmaste (van 2)".
