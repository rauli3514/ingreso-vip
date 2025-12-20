# 🔧 SQL Correcto para Políticas de Storage

## ⚠️ El Error
```
ERROR: syntax error at or near "Nombre"
```

Esto ocurre porque las instrucciones eran para la **interfaz web**, no para SQL directo.

---

## ✅ SQL Correcto

Copia y pega **ESTE código** en **Supabase → SQL Editor**:

```sql
-- ============================================
-- POLÍTICAS PARA BUCKET: event-assets
-- ============================================

-- 1. Permitir que usuarios autenticados suban archivos
CREATE POLICY "authenticated_upload_event_assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-assets');

-- 2. Acceso público para leer archivos
CREATE POLICY "public_read_event_assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-assets');

-- 3. Permitir que usuarios autenticados actualicen archivos
CREATE POLICY "authenticated_update_event_assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'event-assets')
WITH CHECK (bucket_id = 'event-assets');

-- 4. Permitir que usuarios autenticados eliminen archivos
CREATE POLICY "authenticated_delete_event_assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'event-assets');

-- ============================================
-- POLÍTICAS PARA BUCKET: guest-videos
-- ============================================

-- 1. Permitir que usuarios autenticados suban videos
CREATE POLICY "authenticated_upload_guest_videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guest-videos');

-- 2. Acceso público para leer videos
CREATE POLICY "public_read_guest_videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'guest-videos');

-- 3. Permitir que usuarios autenticados actualicen videos
CREATE POLICY "authenticated_update_guest_videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'guest-videos')
WITH CHECK (bucket_id = 'guest-videos');

-- 4. Permitir que usuarios autenticados eliminen videos
CREATE POLICY "authenticated_delete_guest_videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'guest-videos');
```

---

## 📋 Pasos para Ejecutar

1. **Ve a Supabase Dashboard**
   - https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **SQL Editor**
   - Click en "SQL Editor" en el menú lateral
   - Click en "New query"

3. **Copia TODO el SQL de arriba**
   - Pégalo en el editor
   - Click en **"Run"** (o Ctrl/Cmd + Enter)

4. **Deberías ver:**
   ```
   Success. No rows returned
   ```

---

## 🔍 Si Sale Error

### Error: "policy already exists"
**Solución:** Las políticas ya existen. Salta este paso.

### Error: "bucket does not exist"
**Solución:** Crear los buckets primero:

```sql
-- Crear bucket event-assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-assets', 'event-assets', true);

-- Crear bucket guest-videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-videos', 'guest-videos', true);
```

Luego ejecuta las políticas de nuevo.

---

## ✅ Verificación

Después de ejecutar, verifica:

1. **Storage → event-assets → Policies**
   - Deberías ver 4 políticas
2. **Storage → guest-videos → Policies**
   - Deberías ver 4 políticas

---

## 🎯 Alternativa: UI (Sin SQL)

Si prefieres la interfaz web:

1. **Storage → event-assets → Policies**
2. Click **"New Policy"**
3. Template: **"Custom"**
4. **Policy name:** `public_read_event_assets`
5. **Target roles:** `public`
6. **Policy type:** `SELECT`
7. **Policy definition:** `true`
8. Click **"Review"** → **"Save"**

Repetir para:
- INSERT con `authenticated` y `bucket_id = 'event-assets'`
- UPDATE con `authenticated` y `bucket_id = 'event-assets'`
- DELETE con `authenticated` y `bucket_id = 'event-assets'`

---

**Ejecuta el SQL de arriba y el upload debería funcionar!** ✅
