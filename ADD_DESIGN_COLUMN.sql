-- Agrega la columna 'design' a la tabla event_invitations
-- Esto es necesario para que funcione el nuevo "Diseño Overlay"

ALTER TABLE event_invitations 
ADD COLUMN IF NOT EXISTS design JSONB DEFAULT '{}'::jsonb;

-- Aseguramos que tenga permisos (aunque el dueño de la tabla suele tenerlos)
GRANT ALL ON event_invitations TO authenticated;
GRANT ALL ON event_invitations TO service_role;
