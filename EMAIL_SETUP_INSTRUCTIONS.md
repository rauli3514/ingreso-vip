# 📧 Configuración de Notificaciones por Email

Este documento explica cómo configurar las notificaciones automáticas por email cuando alguien responde a tu invitación.

## 🔑 Datos que necesitas:

- **Resend API Key**: la sacás de https://resend.com/api-keys (nunca la escribas en el código ni en este repo: es público)
- **Email destino**: ya no se configura; el aviso le llega al dueño de cada evento (ver `migrations/2026_10_link_personal_invitados.sql`)
- **Supabase Project**: Tu proyecto en https://supabase.com/dashboard

---

## 📝 Paso 1: Configurar la API Key en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Ve a **Settings** (⚙️) → **Edge Functions** (en el menú izquierdo)
3. Busca la sección **"Secrets"** o **"Environment Variables"**
4. Agrega un nuevo secret:
   - **Key**: `RESEND_API_KEY`
   - **Value**: tu API key de Resend
5. Click en **Save**

---

## 🚀 Paso 2: Desplegar la Edge Function

Abre tu terminal y ejecuta estos comandos desde la carpeta del proyecto:

```bash
# 1. Login a Supabase (te pedirá tu token de acceso)
npx supabase login

# 2. Link al proyecto (te preguntará cuál proyecto)
npx supabase link

# 3. Desplegar la función
npx supabase functions deploy send-notification-email
```

**Nota**: Cuando te pida el "Access Token", obtén uno desde:
https://supabase.com/dashboard/account/tokens (Create new token)

---

## 🔧 Paso 3: Configurar el Trigger Automático

1. Ve a tu proyecto en Supabase
2. Ve a **SQL Editor**
3. Abre el archivo `SETUP_EMAIL_TRIGGER.sql` que está en esta carpeta
4. **IMPORTANTE**: Reemplaza `YOUR_PROJECT_REF` con el ref real de tu proyecto
   - El ref se encuentra en: **Settings** → **General** → **Reference ID**
   - Ejemplo: `abcdefghijklmnop`
5. Ejecuta el SQL completo en el SQL Editor
6. Click en **Run**

---

## ✅ Paso 4: Probar

1. Ve a tu invitación pública
2. Haz click en "Sugerir Canción" o "Confirmar Asistencia"
3. Llena el formulario y envía
4. Revisa el email de la cuenta dueña del evento
5. Deberías recibir un email con todos los detalles

---

## 🐛 Solución de Problemas

### No llegan los emails:

1. **Verifica que la API Key esté correcta en Supabase**
   - Settings → Edge Functions → Secrets

2. **Revisa los logs de la Edge Function**
   - Ve a Edge Functions en Supabase
   - Click en `send-notification-email`
   - Ve a la pestaña "Logs"

3. **Verifica el trigger**
   - SQL Editor → ejecuta:
     ```sql
     SELECT * FROM pg_trigger WHERE tgname = 'on_new_invitation_response';
     ```

### Error "pg_net extension not found":

Si obtienes este error, ejecuta en el SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

---

## 📊 Ver Respuestas sin Email

Siempre puedes ver todas las respuestas en tu Panel de Administración:

1. Ve a: https://vip.event-pix.com.ar/admin/dashboard
2. Entra a tu evento
3. Click en "📋 Lista de Invitados"
4. Ahí verás todas las confirmaciones y sugerencias

---

## 💰 Límites de Resend (Plan Gratuito)

- **100 emails por día**
- **3,000 emails por mes**
- Si necesitas más, puedes actualizar a su plan de pago

---

¿Necesitas ayuda? Contacta soporte o revisa los logs en Supabase.
