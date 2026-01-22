-- Habilitar RLS en la tabla (por si acaso no está)
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Borrar políticas antiguas restrictivas para evitar conflictos
DROP POLICY IF EXISTS "Enable read access for all users" ON playlist_songs;
DROP POLICY IF EXISTS "Enable insert for all users" ON playlist_songs;
DROP POLICY IF EXISTS "Public can view songs" ON playlist_songs;
DROP POLICY IF EXISTS "Public can add songs" ON playlist_songs;
DROP POLICY IF EXISTS "Users can view their own songs" ON playlist_songs;

-- Crear política permisiva para LEER (SELECT)
-- Cualquiera puede ver las canciones (publico)
CREATE POLICY "Public can view all songs" 
ON playlist_songs FOR SELECT 
USING (true);

-- Crear política permisiva para INSERTAR
-- Cualquiera puede sugerir canciones
CREATE POLICY "Public can suggest songs" 
ON playlist_songs FOR INSERT 
WITH CHECK (true);

-- Política para UPDATE/DELETE (opcional, solo admin o service role debería poder, pero por ahora...)
-- Dejemos que solo se puedan leer e insertar públicamente.
-- Borrar y editar lo hará el admin desde el dashboard (que usa service role o auth authenticated).
-- Si el admin usa el dashboard con su cuenta autenticada, necesitará policies para delete/update.

CREATE POLICY "Admin full access" 
ON playlist_songs 
USING (auth.role() = 'authenticated');
