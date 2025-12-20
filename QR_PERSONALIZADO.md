# 🎨 QR con Fondo y Logo Personalizados

## ✅ Implementado

El generador de QR ahora usa automáticamente:

1. **Fondo Personalizado** (`theme_background_url`)
   - Ejemplo: Foto de los novios en una boda
   - Se ajusta al tamaño del QR manteniendo proporción
   - Overlay oscuro semi-transparente para mejor legibilidad

2. **Logo Personalizado** (`theme_custom_logo_url`)
   - Tu logo empresarial
   - Se dibuja en la parte superior centrado
   - Tamaño máximo: 250x150px (mantiene aspect ratio)
   - Sombra para mejor visibilidad

---

## 🎯 Cómo Funciona

### Prioridad de Fondo:
1. **Si hay fondo personalizado** → Usa la imagen subida
2. **Si no hay fondo** → Usa gradiente del tema seleccionado
3. **Si falla la carga** → Fallback a gradiente

### Estructura del QR:

```
┌─────────────────────────────────┐
│  [Logo Personalizado]           │ ← Arriba centrado
│                                 │
│         NOMBRE DEL EVENTO       │ ← Texto grande
│                                 │
│      ┌───────────────┐          │
│      │               │          │
│      │   CÓDIGO QR   │          │ ← QR en caja blanca
│      │               │          │
│      └───────────────┘          │
│                                 │
│  Escanea para encontrar tu mesa │ ← Instrucción
│                                 │
│  Ingreso VIP • by Tecno Eventos │ ← Branding
└─────────────────────────────────┘
  [Fondo: Foto de novios + overlay]
```

---

## 📋 Ejemplo de Uso - Boda

### Configuración:

1. **Ve a un evento → Pestaña "Diseño"**

2. **Fondo Personalizado:**
   - Click en "Fondo Personalizado"
   - Sube foto de los novios (JPG, 1920x1080)
   - La foto se guarda en `theme_background_url`

3. **Logo del Evento:**
   - Click en "Logo del Evento"
   - Sube tu logo (PNG transparente recomendado)
   - Se guarda en `theme_custom_logo_url`

4. **Generar QR:**
   - Pestaña "Descargas" →  "QR de Ingreso"
   - Click "Vertical" o "Horizontal"
   - **¡El QR incluirá la foto y tu logo!** ✅

---

## 🎨 Especificaciones Técnicas

### Fondo Personalizado:
- **Formatos**: JPG, PNG, WEBP
- **Tamaño recomendado**: 
  - Vertical: 1080x1920px
  - Horizontal: 1920x1080px
- **Peso**: Máximo 5MB
- **Overlay**: Negro 40% de opacidad para legibilidad

### Logo:
- **Formatos**: PNG (transparente), JPG, WEBP
- **Tamaño**: Escalado automático a max 250x150px
- **Aspect Ratio**: Mantenido automáticamente
- **Posición**: Superior centrado, 60px del borde
- **Efecto**: Sombra negra para destacar

### QR Code:
- **Contenedor**: Caja blanca con sombra
- **Tamaño**:
  - Vertical: 900x900px
  - Horizontal: 600x600px
- **Posición**: Centrado en el canvas

---

## 🔄 Fallbacks

### Si el fondo falla:
```
Fondo Personalizado 
    ↓ (error)
Gradiente del Tema Seleccionado
    ↓ (según theme_id)
Colores: primary → secondary → background
```

### Si el logo falla:
```
Logo Personalizado
    ↓ (error)
Sin logo (solo texto de branding abajo)
```

---

## ✨ Ejemplo Visual

### Boda con Fondo y Logo:

```
QR Vertical (1080x1920):
┌─────────────────────────────────┐
│                                 │
│     [Logo: Tecno Eventos]       │ ← Tu logo
│                                 │
│      BODA JUAN & MARÍA          │ ← Nombre evento
│                                 │
│         ╔═══════════╗           │
│         ║  QR CODE  ║           │ ← Código QR
│         ║           ║           │
│         ╚═══════════╝           │
│                                 │
│  Escanea para encontrar tu mesa │
│                                 │
│  Ingreso VIP • by Tecno Eventos │
└─────────────────────────────────┘
Background: Foto de los novios
            + overlay oscuro 40%
```

---

## 🎯 Ventajas

1. **Branding Personalizado**
   - Cada evento tiene su identidad visual
   - Logo visible en todo momento

2. **Experiencia Profesional**
   - QR con foto de fondo se ve premium
   - Perfecto para bodas, 15 años, eventos corporativos

3. **Flexible**
   - Si no hay fondo/logo, funciona igual con gradiente
   - No rompe eventos existentes

4. **Optimizado**
   - Carga async de imágenes
   - Timeouts para evitar bloqueos
   - Fallbacks automáticos

---

## 📝 Notas Importantes

1. **CORS**: Las imágenes de Supabase Storage deben tener CORS habilitado (ya configurado si es bucket público)

2. **Tamaños**: El logo se escala automáticamente, no necesitas redimensionar

3. **Transparencia**: Para logotipos, PNG transparente se ve mejor

4. **Overlay**: El fondo tiene un overlay oscuro automático para que el texto sea legible

---

## 🚀 Próximos Pasos

1. **Configure políticas de Storage** (ver `SQL_STORAGE_POLITICAS.md`)
2. **Sube un fondo** en Diseño → Fondo Personalizado
3. **Sube tu logo** en Diseño → Logo del Evento
4. **Genera el QR** en Descargas → QR de Ingreso
5. **¡Listo!** Tu QR tendrá fondo y logo personalizados

---

**¡Ahora tus QR se verán profesionales con la foto del evento y tu branding!** 🎉
