-- Asegurar que la tabla profiles tenga la columna assigned_event_ids como array de texto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'assigned_event_ids') THEN
        ALTER TABLE profiles ADD COLUMN assigned_event_ids text[] DEFAULT '{}';
    END IF;
END $$;

-- Política para permitir que los usuarios vean sus eventos asignados (si no existe)
-- Nota: Esto es opcional si ya tienes políticas configuradas, pero asegura el acceso.
