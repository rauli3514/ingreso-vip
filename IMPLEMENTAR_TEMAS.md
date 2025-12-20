# 🎨 Implementación de Temas Dinámicos - GuestApp

## ✅ Paso 1: Migración SQL (Ya completado)

Ver `MIGRACION_SQL.md` para las instrucciones de ejecución en Supabase.

## ✅ Paso 2: ThemeSelector (Ya completado)

- Componente creado en `/src/components/ThemeSelector.tsx`
- Integrado en la pestaña "Diseño" de Event Details
- Funciona correctamente

## ⏳ Paso 3: Aplicar Temas en GuestApp

### Estado Actual:
- ✅ Import agregado: `import { getThemeById } from '../../lib/themes'`
- ✅ Lógica de tema agregada:
```tsx
// Get theme colors
const theme = getThemeById(event?.theme_id || 'default');
const themeColors = theme?.colors || {
    primary: '#6b21a8',    // purple-800 (default)
    secondary: '#581c87',  // purple-900
    accent: '#FBBF24',     // yellow-400
    background: '#1a1030'
};
```

### Próximos Cambios Necesarios:

El GuestApp necesita aplicar dinámicamente los colores del tema en los siguientes elementos:

#### 1. Loading Screen (línea ~115)
```tsx
<div 
    style={{ background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.primary}, ${themeColors.background})` }}
>
    <div style={{ borderColor: `${themeColors.accent} transparent transparent transparent` }}>
    </div>
</div>
```

#### 2. Search View Background (línea ~182)
Reemplazar clases hardcodeadas:
- `bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900`

Con estilo dinámico:
```tsx
style={{ background: `linear-gradient(to bottom right, ${themeColors.secondary}, ${themeColors.primary}, ${themeColors.background})` }}
```

#### 3. Search Input (línea ~200)
```tsx
style={{
    background: `${themeColors.background}80`,
    border: `2px solid ${themeColors.accent}33`
}}
```

#### 4. Buttons y CTAs
- Aplicar `themeColors.primary` y `themeColors.accent` en bordes y backgrounds
- Usar gradientes dinámicos: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`

#### 5. Result View - Table Number (línea ~312)
```tsx
style={{
    backgroundImage: `linear-gradient(to right, ${themeColors.accent}, ${themeColors.primary})`,
    textShadow: `0 0 80px ${themeColors.accent}66`
}}
```

## ⏳ Paso 4: Update Generador de QR

### Ubicación:
`/src/pages/admin/EventDetails.tsx` - función `generateQRPoster` (línea ~200)

### Cambios Necesarios:

1. **Importar getThemeById**:
```tsx
import { getThemeById } from '../../lib/themes';
```

2. **Obtener tema del evento** (dentro de generateQRPoster):
```tsx
const theme = getThemeById(event.theme_id || 'default');
const colors = theme?.colors || {
    primary: '#6b21a8',
    secondary: '#581c87',
    accent: '#FBBF24'
};
```

3. **Aplicar gradiente del tema** (reemplazar líneas ~249-253):
```tsx
// 3. Fondo con gradiente del tema seleccionado
const gradient = ctx.createLinearGradient(0, 0, 0, height);
gradient.addColorStop(0, colors.secondary);
gradient.addColorStop(0.5, colors.primary);
gradient.addColorStop(1, colors.background || '#1a1030');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);
```

4. **Aplicar color de acento** (línea ~277):
```tsx
ctx.fillStyle = colors.accent; // En lugar de '#e9d5ff'
ctx.fillText('Ingreso VIP • by Tecno Eventos', width / 2, height - 80);
```

## 📋 Resultado Final

### Antes:
- Todos los colores hardcodeados (purple-900, purple-800, etc.)
- Mismo diseño para todos los eventos

### Después:
- ✅ Colores dinámicos basados en el `theme_id` del evento
- ✅ Cada tema (neon, boda, tecno, etc.) tiene su propia paleta
- ✅ GuestApp se adapta automáticamente
- ✅ QR Posters usan los colores del tema

## 🎨 Ejemplo de Uso

1. Admin selecciona "Boda Elegante" en la pestaña Diseño
2. Se guarda `theme_id = 'boda'` en la base de datos
3. GuestApp carga y aplica:
   - Primary: #C4A661 (dorado)
   - Secondary: #2C3E50 (azul marino)
   - Accent: #ECF0F1 (blanco perla)
4. QR generado usa el mismo esquema de colores

## ⚠️ Nota Importante

Debido al tamaño del archivo `GuestApp.tsx`, los cambios de aplicar los temas dinámicamente requieren múltiples ediciones pequeñas. 

**Recomendación**: 
- Aplicar cambios gradualmente, sección por sección
- Probar después de cada cambio
- Comenzar por loading screen, luego search view, luego result view

---

**Estado Actual**:
- ✅ Sistema de temas funcionando
- ✅ Migración SQL lista
- ✅ ThemeSelector integrado
- ⏳ GuestApp con lógica de tema (falta aplicar estilos)
- ⏳ Generador QR (falta aplicar colores dinámicos)
