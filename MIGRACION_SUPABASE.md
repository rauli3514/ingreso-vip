# Migrar el organizador a un proyecto nuevo de Supabase

Proyecto viejo (en pausa): `ijvbnduaecrpsaivgzay`.
En esta guía, `NUEVO` es el identificador del proyecto nuevo (lo que va antes de `.supabase.co`).

## Qué hay que llevar

| Qué | Dónde está | Cómo se lleva |
|---|---|---|
| Base de datos (eventos, invitados, respuestas, pagos, usuarios con sus contraseñas) | Backup del proyecto viejo | Paso 1 y 3 |
| Archivos (fotos, videos, PDFs) | Buckets `assets`, `invitations`, `event-assets`, `guest-videos` | Paso 1 y 4 |
| Funciones | `supabase/functions/` (`mercadopago`, `mercadopago-webhook`, `send-notification-email`) | Paso 6 |
| Secretos | `MP_ACCESS_TOKEN`, `RESEND_API_KEY` | Paso 6 |
| Login con Google | Configuración de Auth + Google Cloud | Paso 7 |
| Dirección del proyecto en el sitio | `.env.local` y variables de Vercel | Paso 8 |

## 1. Bajar todo del proyecto en pausa (no hace falta reactivarlo)

En el panel de Supabase, abrí el proyecto viejo. En **Project Overview** de un
proyecto en pausa aparecen las opciones para descargar:

- el **backup de la base** (archivo `.backup`);
- los **archivos de Storage**.

Bajá las dos cosas y guardalas. **No borres el proyecto viejo** hasta terminar:
si se borra, se pierden los datos y los backups.

## 2. Crear el proyecto nuevo

- Misma región que el viejo si se puede (para Argentina, `sa-east-1` São Paulo).
- Guardá la contraseña de la base: se usa en el paso 3.
- En **Database → Extensions** activá `pg_net` (lo usa el aviso por mail).

## 3. Restaurar la base

Hace falta `psql` en tu computadora (viene con PostgreSQL 17).

1. En el proyecto nuevo: **Connect → Session pooler**, copiá la dirección de conexión.
2. Ejecutá esto, poniendo la dirección que copiaste (esta es solo de ejemplo) y tu contraseña en lugar de `[CONTRASEÑA]`:
   ```bash
   psql "postgresql://postgres.NUEVO:[CONTRASEÑA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" -f ARCHIVO.backup
   ```
   Si el archivo viene comprimido (`.gz`), descomprimilo antes.
3. Van a salir errores del tipo *"already exists"*: son normales, porque el
   proyecto nuevo ya trae las tablas internas de Supabase.
4. Revisá en **Table Editor** que estén `events`, `guests`, `invitation_responses`,
   `payments`, `app_settings`, etc., y en **Authentication → Users** los usuarios.

## 4. Subir los archivos

1. En **Storage** del proyecto nuevo creá los buckets con los mismos nombres:
   `assets`, `invitations`, `event-assets`, `guest-videos`.
   Marcalos como **públicos** si en el viejo lo eran (el sitio usa `getPublicUrl`).
2. Subí el contenido de cada bucket que bajaste en el paso 1, con la misma
   estructura de carpetas (desde el panel, o con
   `supabase storage cp -r ./carpeta ss:///NOMBRE_BUCKET --experimental`).

## 5. Cobro seguro

En el SQL Editor del proyecto nuevo ejecutá
`migrations/2026_10_cobro_seguro_planes.sql`.

Después actualizá el aviso por mail de respuestas, que tenía la dirección del
proyecto viejo escrita a mano (reemplazá `NUEVO`):

```sql
CREATE OR REPLACE FUNCTION notify_new_response()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://NUEVO.supabase.co/functions/v1/send-notification-email',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 6. Funciones y secretos

```bash
supabase login
supabase link --project-ref NUEVO
supabase secrets set MP_ACCESS_TOKEN=... RESEND_API_KEY=...
supabase functions deploy mercadopago
supabase functions deploy mercadopago-webhook --no-verify-jwt
supabase functions deploy send-notification-email
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase solo.

## 7. Login (Authentication)

- **URL Configuration**: Site URL `https://organizador.event-pix.com.ar` y en
  Redirect URLs agregá `https://organizador.event-pix.com.ar/**`.
- **Providers → Google**: activalo con el mismo Client ID y Client Secret del
  proyecto viejo.
- En **Google Cloud Console → Credenciales → tu cliente OAuth**, agregá en
  *URIs de redireccionamiento autorizados*:
  `https://NUEVO.supabase.co/auth/v1/callback`.

## 8. Apuntar el sitio al proyecto nuevo

- En **Vercel → Settings → Environment Variables** cambiá `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY` (el anon key está en **Project Settings → API**).
- Actualizá también `.env.local` en el repo.
- Volvé a publicar el sitio.

## 9. Probar

- Iniciar sesión con mail y con Google.
- Abrir un evento existente: invitados, mesas, videos de la recepcionista.
- Abrir una invitación publicada y confirmar asistencia (tiene que llegar el mail).
- Hacer un pago de prueba (ver `COBRO_SEGURO_MERCADOPAGO.md`).

Recién cuando todo funcione, borrá el proyecto viejo si querés liberar el lugar.
