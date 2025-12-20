# ✅ Restauración Simplificada - Cambios Críticos

## Estado: EN PROGRESO

### ✅ Paso 1: Imports Agregados
- ✅ ThemeSelector
- ✅ getThemeById  
- ✅ jsPDF

---

## 📋 Próximos Pasos (Orden de Prioridad)

### CRÍTICO 1: Función downloadGuestsPDF

Necesitas agregar esta función después de `downloadGuestsCSV` (≈línea 195):

[Ver archivo PDF_IMPLEMENTATION.md para el código completo]

### CRÍTICO 2: Botones de Descarga

En la pestaña Downloads, agregar onClick handlers a los botones:
- Botón QR → `onClick={() => generateQRPoster('portrait')}`
- Botón CSV → `onClick={downloadGuestsCSV}`
- Botón PDF → `onClick={downloadGuestsPDF}`

### CRÍTICO 3: Tema en QR (getThemeById)

En `generateQRPoster`, línea ≈207, agregar:
```tsx
const theme = getThemeById(event.theme_id || 'default');
const colors = theme?.colors || {
    primary: '#6b21a8',
    secondary: '#581c87',
    accent: '#FBBF24',
    background: '#1a1030'
};
```

Y usar `colors` en lugar de colores hardcodeados.

### IMPORTANTE 4: Theme Selector Tab

Agregar pestaña "Diseño" con ThemeSelector component.

Buscar donde están las tabs (línea ≈680) y agregar:
```tsx
{activeTab === 'design' && (
    <div className="p-6">
        <ThemeSelector
            selectedTheme={event.theme_id || 'default'}
            onThemeChange={handleThemeChange}
            compact
        />
    </div>
)}
```

---

## 🎯 Decisión: ¿Qué Restauro Primero?

**Opción A: TODO (Recomendada)**
- Restauro las 4 funciones críticas
- Toma ~10-15 minutos

**Opción B: Solo Descargas**
- Restauro PDF + botones
- Toma ~5 minutos
- El resto lo haces tú después

**Opción C: Aplicar archivo backup completo**
- Si existe un backup antes del git checkout
- Instantáneo

---

**¿Qué prefieres que haga?**

Por ahora tenemos los imports listos. Continúo con el resto?
