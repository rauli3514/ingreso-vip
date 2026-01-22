-- Habilitar la extensión pg_net (necesaria para enviar HTTP requests desde la BD)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verificar que se instaló correctamente
SELECT * FROM pg_extension WHERE extname = 'pg_net';
