-- Borrar TODAS las respuestas de invitación (confirmaciones y canciones)
-- ⚠️ CUIDADO: Esto borrará TODOS los datos de prueba

-- Opción 1: Borrar TODO de la tabla invitation_responses
DELETE FROM invitation_responses;

-- Opción 2: Si quieres borrar solo de un evento específico, usa esto en su lugar:
-- DELETE FROM invitation_responses WHERE event_id = 'TU_EVENT_ID_AQUI';

-- Verificar que se borró todo
SELECT COUNT(*) as total_respuestas_restantes FROM invitation_responses;
