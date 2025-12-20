# 🚀 Instrucciones para Aplicar Migración SQL

## Paso 1: Acceder a Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto **Ingreso VIP**
3. En el menú lateral, haz click en **SQL Editor**

## Paso 2: Ejecutar la Migración

Copia y pega el siguiente código SQL:

```sql
-- Agregar campo theme_id a la tabla events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS theme_id TEXT DEFAULT 'default';

-- Crear índice para búsquedas por tema
CREATE INDEX IF NOT EXISTS idx_events_theme_id ON events(theme_id);

-- Comentario de la columna
COMMENT ON COLUMN events.theme_id IS 'ID del tema visual seleccionado (neon, boda, tecno, rustic, infantil, quince, 15-anos, default)';
```

## Paso 3: Ejecutar

1. Haz click en el botón **Run** (o presiona `Ctrl/Cmd + Enter`)
2. Deberías ver el mensaje: **Success. No rows returned**

## Paso 4: Verificar

Para verificar que se aplicó correctamente, ejecuta:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'theme_id';
```

Deberías ver:
- **column_name**: theme_id
- **data_type**: text
- **column_default**: 'default'::text

## ✅ ¡Listo!

Una vez ejecutado, el campo `theme_id` estará disponible en todos los eventos y el ThemeSelector funcionará correctamente.

---

## 🎨 Temas Disponibles

Los siguientes IDs de tema son válidos:
- `neon` - Neón moderno
- `tecno` - Tecnológico
- `boda` - Boda elegante
- `15-anos` - 15 años
- `quince` - Quinceañera
- `infantil` - Infantil
- `rustic` - Rústico
- `default` - Ingreso VIP (predeterminado)
