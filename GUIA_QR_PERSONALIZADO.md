# ✅ QR Personalizado con Fondo y Logo - IMPLEMENTADO

## 🎉 ¡Listo para Usar!

El generador de QR ahora incluye automáticamente:

### ✅ **Fondo Personalizado**
- Usa la imagen subida en "Diseño → Fondo Personalizado"
- Ejemplo perfecto: **Foto de los novios en una boda**
- Se ajusta al tamaño completo del QR
- Overlay oscuro 40% para legibilidad de textos

### ✅ **Logo del Evento**
- Usa el logo subido en "Diseño → Logo del Evento"
- Se dibuja en la parte **superior centrado**
- Tamaño máximo: 250x150px (escala automática)
- Sombra para destacar sobre el fondo

---

## 📋 Cómo Usar (Paso a Paso)

### 1. Configurar Storage (PRIMERO)

Ejecuta esto en **Supabase → SQL Editor**:

```sql
CREATE POLICY "authenticated_upload_event_assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-assets');

CREATE POLICY "public_read_event_assets"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-assets');
```

### 2. Subir Fondo y Logo

1. **Ve a un evento** → Pestaña **"Diseño"**

2. **Fondo Personalizado:**
   - Click en el área de "Fondo Personalizado"
   - Sube foto (ej: foto de novios)
   - Formatos: JPG, PNG, MP4
   - Tamaño: 1920x1080 recomendado

3. **Logo:**
   - Click en "Logo del Evento"
   - Sube tu logo
   - PNG transparente recomendado
   - Se escalará automáticamente

### 3. Generar QR

1. **Pestaña "Descargas"**
2. Sección **"QR de Ingreso"**
3. Click **"Vertical (1080x1920)"** o **"Horizontal (1920x1080)"**
4. **¡El QR se descargará con fondo y logo!** ✅

---

## 🎨 Vista Previa del Resultado

```
┌─────────────────────────────────────┐
│                                     │
│     [TU LOGO CENTRADO]              │ ← Tu branding
│                                     │
│                                     │
│        BODA JUAN & MARÍA            │ ← Nombre
│                                     │
│        ╔═══════════════╗            │
│        ║               ║            │
│        ║   CÓDIGO QR   ║            │ ← QR
│        ║               ║            │
│        ╚═══════════════╝            │
│                                     │
│   Escanea para encontrar tu mesa   │
│                                     │
│   Ingreso VIP • by Tecno Eventos   │ ← Footer
│                                     │
└─────────────────────────────────────┘
 FONDO: Foto de los novios + overlay
```

---

## ⚙️ Funcionamiento Técnico

### Lógica de Fondo:
```
¿Hay theme_background_url?
    ↓ SÍ
Cargar imagen → Dibujar como fondo → Overlay 40%
    ↓ NO
Usar gradiente del tema seleccionado
```

### Lógica de Logo:
```
¿Hay theme_custom_logo_url?
    ↓ SÍ
Cargar imagen → Escalar (max 250x150) → Dibujar arriba
    ↓ NO
Solo texto de branding abajo
```

### Seguridad:
- Carga async con timeout de 5 segundos
- Fallback automático si falla la carga
- No bloquea el generador

---

## 🎯 Casos de Uso

### 🥂 Boda:
- **Fondo**: Foto de los novios
- **Logo**: Logo del salón/empresa
- **Resultado**: QR premium con la pareja de fondo

### 🎂 15 Años:
- **Fondo**: Foto de la quinceañera
- **Logo**: Logo del evento
- **Resultado**: QR personalizado con la foto

### 🏢 Evento Corporativo:
- **Fondo**: Logo corporativo grande
- **Logo**: Logo del proveedor
- **Resultado**: QR profesional con branding

### 🎨 Sin Personalización:
- **Fondo**: Gradiente del tema (neon, boda, etc.)
- **Logo**: Sin logo
- **Resultado**: QR con diseño del tema

---

## 🔧 Especificaciones

| Elemento | Tamaño | Formato | Posición |
|----------|--------|---------|----------|
| **Fondo** | 1920x1080 o 1080x1920 | JPG, PNG, WEBP | Full canvas |
| **Logo** | Max 250x150px | PNG, JPG | Superior centrado |
| **QR** | 900x900 o 600x600 | Interno | Centro |
| **Overlay** | Full canvas | Negro 40% | Sobre fondo |

---

## ⚠️ Solución de Problemas

### "Error al subir":
- Ver `SQL_STORAGE_POLITICAS.md`
- Ejecutar políticas de Storage
- Verificar que el bucket sea público

### Imagen no aparece en QR:
- Verificar que la imagen se subió correctamente
- Revisar consola (F12) para errores CORS
- Probar con otra imagen más pequeña

### Logo muy grande:
- No te preocupes, se escala automáticamente
- Max: 250x150px manteniendo proporción

---

## 📁 Archivos Relacionados

- 📖 `QR_PERSONALIZADO.md` - Este documento
- 📖 `SQL_STORAGE_POLITICAS.md` - Configurar Supabase
- 📖 `SOLUCION_UPLOAD.md` - Solucionar errores de subida

---

## ✅ Estado Actual

| Feature | Estado |
|---------|--------|
| Fondo personalizado en QR | ✅ Funcionando |
| Logo personalizado en QR | ✅ Funcionando |
| Fallback a gradiente | ✅ Funcionando |
| Escalado automático | ✅ Funcionando |
| Overlay para legibilidad | ✅ Funcionando |
| QR Vertical | ✅ Funcionando |
| QR Horizontal | ✅ Funcionando |

---

**El servidor está corriendo en:** **http://localhost:3001/ingreso-vip/**

**¡Ahora tus QR tendrán el fondo y logo que subas!** 🎨✨

Cada evento puede tener su propia identidad visual personalizada.
