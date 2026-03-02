-- Migración para añadir soporte de nombres personalizados a las mesas
-- Añade la columna custom_table_names a la tabla events de forma segura

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS custom_table_names JSONB DEFAULT '{}'::jsonb;

-- Verificar la columna
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'custom_table_names';
