-- ============================================================
-- FUNCIÓN RPC PARA GUARDAR CONFIGURACIÓN DEL QUIOSCO DE FOTOS
-- Ejecutar en: Supabase > SQL Editor
-- Bypassea el schema cache de PostgREST
-- ============================================================

CREATE OR REPLACE FUNCTION save_photo_kiosk_config(p_event_id uuid, p_config jsonb)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET photo_kiosk_config = p_config 
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que se creó correctamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'save_photo_kiosk_config';

-- ✅ Resultado esperado: 1 fila con save_photo_kiosk_config | FUNCTION
