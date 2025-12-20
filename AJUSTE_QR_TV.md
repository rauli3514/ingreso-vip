# ✅ Ajuste de Tamaño QR para TV de 50"

## 🎯 Problema Identificado

El QR estaba **demasiado grande** para visualización en TV de 50 pulgadas. Según las imágenes de referencia, el QR debe ser más pequeño para dejar espacio al fondo/fotos.

---

## 📊 Cambios Realizados

### Tamaño del QR:

| Orientación | Antes | Ahora | Reducción |
|-------------|-------|-------|-----------|
| **Landscape** (1920x1080) | 500px | **350px** | -30% |
| **Portrait** (1080x1920) | 800px | **450px** | -44% |

### Proporción en Pantalla:

| Orientación | Antes | Ahora |
|-------------|-------|-------|
| **Landscape** | 26% del ancho | **18% del ancho** ✅ |
| **Portrait** | 74% del ancho | **42% del ancho** ✅ |

---

## 🎨 Ajustes de Tipografía

### Título del Evento:

| Orientación | Antes | Ahora |
|-------------|-------|-------|
| Landscape | 90px | **70px** |
| Portrait | 90px | **80px** |

### Instrucción "Escanea...":
| Orientación | Antes | Ahora |
|-------------|-------|-------|
| Landscape | 55px | **40px** |
| Portrait | 55px | **45px** |

### Branding Footer:
| Orientación | Antes | Ahora |
|-------------|-------|-------|
| Landscape | 30px | **24px** |
| Portrait | 30px | **28px** |

---

## 🔴 Logo Circular:

| Orientación | Antes | Ahora |
|-------------|-------|-------|
| Landscape | 180px | **140px** |
| Portrait | 220px | **160px** |

---

## 📐 Layout Optimizado para TV

### Landscape (1920x1080):
```
┌─────────────────────────────────────┐
│ [Fondo con blur]              🔴140 │ ← Logo
│                                     │
│        NOMBRE DEL EVENTO (70px)     │
│                                     │
│           ┌──────────┐              │
│           │ QR 350px │              │ ← QR más pequeño
│           └──────────┘              │
│                                     │
│  "Escanea para encontrar..." (40px) │
│                                     │
│  INGRESO VIP • Tecno Eventos (24px) │
└─────────────────────────────────────┘
```

### Portrait (1080x1920):
```
┌──────────────────────┐
│ [Fondo blur]    🔴160│ ← Logo
│                      │
│ NOMBRE EVENTO (80px) │
│                      │
│   ┌─────────────┐    │
│   │  QR 450px   │    │ ← QR más pequeño
│   └─────────────┘    │
│                      │
│ "Escanea..." (45px)  │
│                      │
│ INGRESO VIP (28px)   │
└──────────────────────┘
```

---

## ✨ Visual ización en TV 50"

### Antes ❌:
- QR ocupaba casi toda la pantalla
- Poco espacio para el fondo/fotos
- Textos muy grandes
- Aspecto "apretado"

### Ahora ✅:
- **QR más pequeño y proporcional**
- **Más espacio para las fotos de fondo**
- **Textos balanceados**
- **Aspecto profesional y limpio**

---

## 🎯 Comparación con Imágenes de Referencia

Según tus imágenes de referencia:

### ✅ Lo que cumple:
1. **QR centrado y pequeño** - Similar al ejemplo
2. **Espacio para fotos de fondo** - Ahora con blur y nítida
3. **Proporción adecuada** - ~18-20% del ancho
4. **Texto legible pero discreto** - No domina la pantalla

### 💡 Diferencias (features adicionales):
- **Logo circular en esquina** - No está en el ejemplo pero es valor agregado
- **Glassmorphism effect** - Estilo premium
- **Blur + imagen nítida** - Técnica superior al ejemplo

---

## 📋 Especificaciones Técnicas

### Canvas:
- Landscape: **1920x1080px**
- Portrait: **1080x1920px**

### QR Code:
- Landscape: **350x350px** (18% ancho)
- Portrait: **450x450px** (42% ancho)
- Padding blanco: **25px** alrededor
- Sombra: **20px blur**

### Logo Circular:
- Landscape: **140x140px**
- Portrait: **160x160px**
- Posición: **Esquina superior derecha**
- Transparencia: **95%**

### Tipografía:
- Sistema: **system-ui, sans-serif**
- Peso: **Bold** para título, **Normal** para resto
- Sombra en textos: **30px blur**

---

## 🎯 Casos de Uso

### Bodas:
- Fondo: Collage de fotos de novios
- QR: 350px (landscape) para TV en recepción
- Logo: Iniciales de los novios

### Corporativos:
- Fondo: Branding de empresa
- QR: 350px para proyector
- Logo: Isotipo de empresa

### 15 Años:
- Fondo: Fotos de la quinceañera
- QR: 450px (portrait) para pantalla vertical
- Logo: Monograma del evento

---

## 🧪 Cómo Probar

1. Ve a evento → **Diseño**
2. Sube fondo y logo
3. Ve a **Descargas**
4. Genera **QR Horizontal** (para TV)
5. **Visualiza en pantalla completa** en tu computadora
6. El QR debería verse **proporcional y balanceado**

---

## 📊 Resumen de Cambios

| Elemento | Cambio | Impacto |
|----------|--------|---------|
| QR Size | -30% a -44% | ✅ Mejor visualización en TV |
| Título | -12% a -20% | ✅ Menos invasivo |
| Instrucción | -27% a -18% | ✅ Más discreto |
| Logo | -22% a -27% | ✅ Proporción correcta |
| Branding | -20% a -7% | ✅ Sutil |

---

## ✅ Resultado Final

**El QR ahora está optimizado para TV de 50 pulgadas:**

- ✅ **Tamaño proporcional** (18-20% del ancho)
- ✅ **Más espacio para fotos/fondo**
- ✅ **Textos legibles pero discretos**
- ✅ **Logo circular balanceado**
- ✅ **Aspecto profesional y limpio**
- ✅ **Similar a las imágenes de referencia**

---

**Archivo modificado:** `src/pages/admin/EventDetails.tsx`  
**Cambios:** Reducción de tamaños en QR, textos y logo  
**Estado:** ✅ Compilando correctamente

**¡Genera un nuevo QR y verás la diferencia!** 📺✨
