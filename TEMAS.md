# Sistema de Temas - Ingreso VIP

## 📁 Estructura

```
ingreso-vip/
├── public/
│   └── themes/           ✅ Carpeta copiada desde el proyecto original
│       ├── 15 años/      - Imágenes para quinceañeras
│       ├── boda/         - Imágenes para bodas
│       ├── infantil/     - Imágenes para eventos infantiles
│       ├── neon/         - Imágenes con estética neón
│       ├── quince/       - Imágenes para quinceañeras
│       ├── rustic/       - Imágenes estilo rústico
│       ├── tecno/        - Imágenes tech/moderno
│       └── *.jpg         - Imágenes de fondo genéricas
│
├── src/
│   ├── lib/
│   │   └── themes.ts     ✅ Configuración de temas
│   ├── components/
│   │   └── ThemeSelector.tsx  ✅ Selector de temas
│   └── types.ts          ✅ Actualizado con theme_id
│
└── migrations/
    └── add_theme_id.sql  ✅ Migración de base de datos
```

## 🎨 Temas Disponibles

1. **Neón** (`neon`)
   - Primary: #00D9FF (Cyan eléctrico)
   - Secondary: #FF006E (Rosa neón)
   - Accent: #FFBE0B (Amarillo brillante)
   - Categoría: Moderno

2. **Tecnológico** (`tecno`)
   - Primary: #4169E1 (Azul eléctrico)
   - Secondary: #8B5CF6 (Morado)
   - Accent: #10B981 (Verde tech)
   - Categoría: Moderno

3. **Boda Elegante** (`boda`)
   - Primary: #C4A661 (Dorado elegante)
   - Secondary: #2C3E50 (Azul marino)
   - Accent: #ECF0F1 (Blanco perla)
   - Categoría: Evento

4. **15 Años** (`15-anos`)
   - Primary: #FF69B4 (Rosa vibrante)
   - Secondary: #9D4EDD (Morado)
   - Accent: #FFD700 (Dorado)
   - Categoría: Celebración

5. **Quinceañera** (`quince`)
   - Primary: #E91E63 (Rosa fuerte)
   - Secondary: #9C27B0 (Morado)
   - Accent: #FFB6C1 (Rosa claro)
   - Categoría: Celebración

6. **Infantil** (`infantil`)
   - Primary: #FF6B9D (Rosa pastel)
   - Secondary: #4ECDC4 (Turquesa)
   - Accent: #FFE66D (Amarillo suave)
   - Categoría: Celebración

7. **Rústico** (`rustic`)
   - Primary: #8B7355 (Marrón cálido)
   - Secondary: #556B2F (Verde oliva)
   - Accent: #DEB887 (Beige)
   - Categoría: Natural

8. **Ingreso VIP** (`default`)
   - Primary: #4169E1
   - Secondary: #6B21A8
   - Accent: #FBBF24
   - Categoría: Default

## 🔧 Implementación

### 1. Base de Datos

Para agregar soporte de temas a la base de datos, ejecuta la migración:

```sql
-- Ver migrations/add_theme_id.sql
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS theme_id TEXT DEFAULT 'default';
```

### 2. Uso en Componentes

```tsx
import { themes, getThemeById } from '../lib/themes';

// Obtener tema del evento
const theme = getThemeById(event.theme_id || 'default');

// Aplicar colores
<div style={{ 
  backgroundColor: theme.colors.background,
  color: theme.colors.primary 
}}>
  ...
</div>
```

### 3. Selector de Temas

```tsx
import ThemeSelector from '../components/ThemeSelector';

<ThemeSelector 
  selectedThemeId={event.theme_id}
  onThemeSelect={(themeId) => updateEvent({ theme_id: themeId })}
/>
```

## 📋 Tareas Pendientes

### Alta Prioridad
- [ ] Integrar ThemeSelector en el formulario de creación de eventos
- [ ] Integrar ThemeSelector en el formulario de edición de eventos
- [ ] Aplicar temas dinámicamente en GuestApp según el evento
- [ ] Actualizar generador de QR para usar colores del tema seleccionado

### Media Prioridad
- [ ] Crear selector de imagen de fondo desde la carpeta del tema
- [ ] Implementar preview del tema en tiempo real
- [ ] Agregar más temas según se necesiten

### Baja Prioridad
- [ ] Permitir temas personalizados (colores custom)
- [ ] Exportar/importar configuraciones de temas
- [ ] Galería de temas con screenshots

## 🚀 Próximos Pasos

1. **Ejecutar migración SQL** en Supabase
2. **Integrar ThemeSelector** en EventDetails.tsx
3. **Aplicar tema** en GuestApp.tsx según el theme_id del evento
4. **Probar** creación de eventos con diferentes temas
5. **Validar** que los colores se apliquen correctamente en toda la app

## ✅ Cambios Completados

- ✅ Carpeta themes copiada a public/
- ✅ Archivo themes.ts creado con 8 temas predefinidos
- ✅ Componente ThemeSelector creado
- ✅ Tipo Event actualizado con campo theme_id
- ✅ Migración SQL creada
- ✅ Todas las menciones de "EventPix" reemplazadas por "Ingreso VIP"

## 📝 Notas

- Los temas usan la misma paleta de colores de EventPix
- Las imágenes están en `public/themes/` y son accesibles vía URL
- El tema `default` mantiene los colores originales de Ingreso VIP
- Cada tema incluye descripción y categoría para facilitar la selección
