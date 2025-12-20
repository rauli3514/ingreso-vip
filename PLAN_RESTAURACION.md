# 🔧 Plan de Restauración Completa

## ❌ Lo Que Se Perdió al Restaurar

Al hacer `git checkout`, se restauró EventDetails.tsx a una versión antigua SIN:

1. ❌ ThemeSelector component import
2. ❌ Función downloadGuestsPDF
3. ❌ Botones de descarga mejorados (QR y CSV)
4. ❌ Logo circular en QR
5. ❌ Integración con getThemeById
6. ❌ Pestaña "Diseño" con ThemeSelector

## ✅ Lo Que SÍ Está Intacto

1. ✅ GuestApp.tsx mejorado
2. ✅ ThemeSelector.tsx component (archivo existe)
3. ✅ themes.ts library (archivo existe)
4. ✅ Migración SQL preparada

## 📋 Qué Voy a Restaurar

### 1. Imports Necesarios
- ThemeSelector component
- getThemeById from themes
- jsPDF for PDF generation

### 2. Función downloadGuestsPDF
- Genera PDF de invitados
- Con mesa y estado

### 3. Botones de Descarga Visuales
- Sección Downloads Tab mejorada
- Botones QR Vertical/Horizontal
- Botón PDF
- Botón CSV

### 4. Pestaña "Diseño"
- ThemeSelector compacto
- Subida de fondo
- Subida de logo

### 5. Mejorar generateQRPoster
- Usar tema seleccionado
- Colores dinámicos

## ⏰ Orden de Implementación

1. Agregar imports
2. Agregar función downloadGuestsPDF
3. Actualizar generateQRPoster con temas
4. Agregar pestaña "Diseño"
5. Actualizar botones de descarga
6. Verificar todo

---

**Voy a restaurar TODO ahora, paso a paso.**
