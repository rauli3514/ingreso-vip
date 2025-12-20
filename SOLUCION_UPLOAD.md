# 🔧 Solución: Error al Subir Logo/Fondo

## ❌ Problema
Al intentar subir un logo o fondo personalizado aparece el error:
```
Error al subir el archivo. Intenta de nuevo.
```

## 🎯 Causas Comunes

### 1. **Permisos de Storage en Supabase** (Más Probable)

Los buckets de Supabase necesitan políticas RLS (Row Level Security) correctas.

#### Solución:

1. **Ve a Supabase Dashboard**
   - https://supabase.com/dashboard
   - Selecciona tu proyecto Ingreso VIP

2. **Navega a Storage**
   - Click en "Storage" en el menú lateral
   - Verás tus buckets: `event-assets` y `guest-videos`

3. **Configura Políticas para `event-assets`**
   - Click en `event-assets`
   - Tab "Policies"
   - Click "New Policy"

4. **Crear Política de INSERT** (Subir archivos):
```sql
-- Nombre: Allow authenticated users to upload
-- Tipo: INSERT

-- Policy SQL:
(auth.role() = 'authenticated')

-- Target roles: authenticated
```

5. **Crear Política de SELECT** (Ver archivos):
```sql
-- Nombre: Public read access
-- Tipo: SELECT

-- Policy SQL:
true

-- Target roles: public, authenticated
```

6. **Hacer el bucket PUBLIC** (opcional pero recomendado):
   - En la página del bucket, click en "Configuration"
   - Marca "Public bucket"
   - Guarda cambios

### 2. **Tamaño del Archivo**

Supabase tiene límites de tamaño por defecto (típicamente 50MB).

#### Solución:
- Comprime la imagen antes de subir
- Usa formatos optimizados (JPG en lugar de PNG para fotos)
- Para fondos: máximo 5MB recomendado
- Para logos: máximo 1MB recomendado

### 3. **Formato del Archivo**

Verifica que el formato sea compatible.

#### Formatos Soportados:
- **Logo**: PNG, JPG, JPEG, WEBP
- **Fondo**: PNG, JPG, JPEG, WEBP, MP4 (video)

### 4. **Buckets No Creados**

Si los buckets no existen, créalos:

1. **Storage → Create bucket**
2. **Nombre**: `event-assets`
3. **Public**: Yes
4. **Allowed MIME types**: `image/*,video/*`
5. Repetir para `guest-videos`

---

## 🔍 Diagnóstico

Con el nuevo mensaje de error mejorado, ahora verás:
```
Error al subir el archivo: [mensaje específico]

Revisa:
- Permisos de Storage en Supabase
- Tamaño del archivo
- Formato del archivo

Consola (F12) para más detalles.
```

**Pasos:**
1. Intenta subir el archivo de nuevo
2. Lee el mensaje de error específico
3. Abre la consola (F12)
4. Busca el error detallado en rojo
5. Sigue la solución según el error

---

## 📋 Políticas RLS Completas

Si prefieres ejecutar SQL directamente, aquí están las políticas completas:

```sql
-- Bucket: event-assets

-- Policy 1: Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'event-assets');

-- Policy 2: Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-assets');

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'event-assets')
WITH CHECK (bucket_id = 'event-assets');

-- Policy 4: Allow authenticated users to delete
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-assets');
```

Repite lo mismo para `guest-videos`:

```sql
-- Reemplaza 'event-assets' con 'guest-videos' en las políticas anteriores
```

---

## ✅ Verificación

Después de aplicar las políticas:

1. Ve a un evento
2. Pestaña "Diseño"
3. Click en "Click para subir" (Fondo o Logo)
4. Selecciona una imagen pequeña (ej: 500KB)
5. **Debería subir correctamente** ✅

Si sigue fallando:
- Revisa la consola (F12)
- Copia el error exacto
- Verifica que los buckets existan
- Confirma que estás autenticado (logged in)

---

## 🎉 Bonus: QR Horizontal Implementado

También se agregaron dos botones en la sección de **Descargas → QR de Ingreso**:

- ✅ **Vertical (1080x1920)** - Para pantallas verticales
- ✅ **Horizontal (1920x1080)** - Para pantallas horizontales

Ahora puedes elegir la orientación que necesites!
