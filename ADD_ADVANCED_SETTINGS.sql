-- Agregamos la columna 'advanced_settings' a la tabla de invitaciones
-- Esta columna será tipo JSONB para guardar configuraciones flexibles (decoraciones, estilos, etc.)

ALTER TABLE "public"."event_invitations" 
ADD COLUMN IF NOT EXISTS "advanced_settings" JSONB DEFAULT '{}'::jsonb;

-- Comentario explicativo
COMMENT ON COLUMN "public"."event_invitations"."advanced_settings" IS 'Guarda configuraciones avanzadas del editor visual: posiciones de elementos, tipografía personalizada, filtros, etc.';
