-- Crear función que invoca la Edge Function cuando hay una nueva respuesta
CREATE OR REPLACE FUNCTION notify_new_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Invocar la Edge Function de manera asíncrona
  PERFORM
    net.http_post(
      url := 'https://ijvbnduaecrpsaivgzay.supabase.co/functions/v1/send-notification-email',
      headers := json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      )::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecuta después de cada INSERT en invitation_responses
DROP TRIGGER IF EXISTS on_new_invitation_response ON invitation_responses;

CREATE TRIGGER on_new_invitation_response
  AFTER INSERT ON invitation_responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_response();

-- Comentario
COMMENT ON FUNCTION notify_new_response() IS 'Envía notificación por email cuando se recibe una nueva respuesta de invitación';