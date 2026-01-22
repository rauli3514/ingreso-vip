-- Intentar habilitar pg_net si no existe
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Asegurarse que el usuario tiene permisos
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;
