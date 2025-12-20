# 🔧 Instalación Manual de QR Premium

## Pasos para Aplicar Mejoras

Ya que el archivo es ​​largo, aquí están los pasos exactos para aplicar las mejoras manualmente:

---

## PASO 1: Backup

1. **Haz una copia** de `src/pages/admin/EventDetails.tsx`
2. Guárdala como `EventDetails.tsx.backup`

---

## PASO 2: Abrir el Archivo

1. **Abre en tu editor:** 
   ```
   src/pages/admin/EventDetails.tsx
   ```

2. **Ve a la línea 311** (busca):
   ``` tsx
   const generateQRPoster = async (orientation: 'portrait' | 'landscape') => {
   ```

---

## PASO 3: Reemplazar Función Completa

### Método Rápido:

1. **Selecciona desde la línea 311 hasta la línea 502** (toda la función `generateQRPoster`)

2. **Elimina** todo el contenido seleccionado

3. **Pega** el contenido del archivo:
   ```
   generateQRPoster_MEJORADO.tsx
   ```

---

## PASO 4: Verificar

Asegúrate de que la función tenga estas características:

### ✅ Sección de Fondo (debe contener):
```tsx
// PASO 1: Fondo blureado (cubre todo el canvas)
ctx.filter = 'blur(40px) brightness(0.7)';
//... código de dibujo de fondo blur
ctx.filter = 'none';

// PASO 2: Imagen principal centrada (contenida, sin crop)
ctx.globalAlpha = 0.85;
//... código de dibujo de imagen nítida
ctx.globalAlpha = 1.0;
```

### ✅ Sección de Logo (debe contener):
```tsx
// LOGO CIRCULAR CON EFECTO CRISTAL (LATERAL)
const logoSize = orientation === 'landscape' ? 180 : 220;
//... clip circular
//... glassmorphism gradient
//... borde y sombra
```

---

## PASO 5: Guardar y Probar

1. **Guarda** el archivo (Ctrl/Cmd + S)

2. **El servidor debería recargar automáticamente**

3. **Ve a un evento** → Descargas → QR de Ingreso

4. **Genera un QR** y verifica:
   - ✅ Fondo blur + imagen nítida
   - ✅ Logo circular en esquina derecha
   - ✅ No hay errores en consola

---

## PROBLEMAS COMUNES

### Error de Sintaxis:
- Verifica que pegaste **toda** la función
- Verifica que no falte llaves `}` al final

### Logo no aparece:
- Verifica que el logo esté subido en "Diseño"
- Abre consola (F12) y busca errores

### Fondo sigue distorsionado:
- Verifica que estés usando la nueva función
- Busca `ctx.filter = 'blur(40px)'` en el código

---

## ALTERNATIVA: Cambios Mínimos

Si prefieres cambios más pequeños, puedes aplicar **solo las secciones críticas**:

### Solo Fondo Blur:

Busca en línea ~351:
```tsx
// 3. Fondo personalizado o gradiente del tema
```

Reemplaza desde ahí hasta `// 4. Cargar imagen QR` con el código de fondo blur de `generateQRPoster_MEJORADO.tsx` (líneas 42-134).

### Solo Logo Circular:

Busca en línea ~431:
```tsx
// Logo personalizado (si existe)
```

Reemplaza desde ahí hasta `// Branding` con el código de logo circular de `generateQRPoster_MEJORADO.tsx` (líneas 183-259).

---

## VERIFICACIÓN FINAL

Después de aplicar:

1. **No hay errores** en consola
2. **Servidor corriendo** sin problemas
3. **QR se genera** correctamente
4. **Fondo se ve nítido** con blur en fondo
5. **Logo es circular** con efecto cristal

---

## ARCHIVOS DE REFERENCIA

- 📄 `generateQRPoster_MEJORADO.tsx` - Función completa
- 📖 `QR_PREMIUM_V2.md` - Documentación técnica
- 📖 Este archivo - Guía de instalación

---

**¿Necesitas ayuda?** Abre la consola (F12) y copia cualquier error que aparezca.

**El servidor está en:** http://localhost:3001/ingreso-vip/
