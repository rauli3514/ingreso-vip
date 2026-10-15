-- =============== LINK PERSONAL POR INVITADO (octubre 2026) ===============
-- Cada invitado recibe su propio link: /invitacion/<evento>?i=<id del invitado>.
-- El id es un código al azar imposible de adivinar, y con él el invitado:
--   - ve su nombre, sus pases y sus acompañantes;
--   - confirma o no, dice cuántos van y si alguien necesita menú especial;
--   - su estado en la lista cambia solo (confirmed / declined).
-- El invitado no puede tocar la tabla guests directamente: solo estas dos
-- funciones, que leen y cambian únicamente su propia fila.
--
-- También arregla el aviso por mail de cada respuesta: ahora le llega al dueño
-- del evento (antes llegaba siempre a la misma casilla, para todos los eventos).
--
-- Ejecutar una vez en el SQL Editor de Supabase. Se puede volver a ejecutar.

-- 1. COLUMNAS NUEVAS EN GUESTS
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS passes integer DEFAULT 1;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_response text;      -- 'yes' | 'no' | null (sin responder)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_at timestamptz;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS attending_count integer;  -- cuántos van (de sus pases)
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS dietary text;            -- menú especial
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS rsvp_message text;

-- 2. LEER LA PROPIA INVITACIÓN
CREATE OR REPLACE FUNCTION public.get_guest_invitation(p_guest_id uuid)
RETURNS TABLE (
    event_id uuid,
    first_name text,
    last_name text,
    passes integer,
    companions jsonb,
    rsvp_response text,
    attending_count integer,
    dietary text,
    rsvp_message text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT g.event_id, g.first_name, g.last_name, COALESCE(g.passes, 1),
           COALESCE(to_jsonb(g.companions), '[]'::jsonb),
           g.rsvp_response, g.attending_count, g.dietary, g.rsvp_message
    FROM public.guests g
    WHERE g.id = p_guest_id;
$$;

-- 3. RESPONDER LA PROPIA INVITACIÓN
CREATE OR REPLACE FUNCTION public.submit_guest_rsvp(
    p_guest_id uuid,
    p_attending boolean,
    p_attending_count integer DEFAULT NULL,
    p_dietary text DEFAULT NULL,
    p_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    g public.guests%ROWTYPE;
    v_count integer;
    v_dietary text := NULLIF(left(trim(COALESCE(p_dietary, '')), 200), '');
    v_message text := NULLIF(left(trim(COALESCE(p_message, '')), 500), '');
    v_invitation_id uuid;
    v_summary text;
BEGIN
    SELECT * INTO g FROM public.guests WHERE id = p_guest_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invitación no encontrada';
    END IF;

    -- Cuántos van: entre 1 y sus pases si confirma, 0 si no va.
    IF p_attending THEN
        v_count := GREATEST(1, LEAST(COALESCE(p_attending_count, COALESCE(g.passes, 1)), COALESCE(g.passes, 1)));
    ELSE
        v_count := 0;
        v_dietary := NULL;
    END IF;

    UPDATE public.guests SET
        rsvp_response = CASE WHEN p_attending THEN 'yes' ELSE 'no' END,
        rsvp_at = now(),
        attending_count = v_count,
        dietary = v_dietary,
        rsvp_message = v_message,
        -- Si ya llegó al evento, no se toca; si no, el estado sigue a la respuesta.
        status = CASE
            WHEN g.status = 'arrived' THEN g.status
            WHEN p_attending THEN 'confirmed'
            ELSE 'declined'
        END
    WHERE id = p_guest_id;

    -- También queda en las respuestas de la invitación (lista de RSVP y aviso por mail).
    SELECT id INTO v_invitation_id FROM public.event_invitations WHERE event_id = g.event_id LIMIT 1;
    IF v_invitation_id IS NOT NULL THEN
        v_summary := concat_ws(' · ',
            CASE WHEN p_attending THEN 'Van ' || v_count || ' de ' || COALESCE(g.passes, 1) END,
            CASE WHEN v_dietary IS NOT NULL THEN 'Menú especial: ' || v_dietary END,
            v_message
        );
        INSERT INTO public.invitation_responses (event_id, invitation_id, full_name, attending, type, message)
        VALUES (g.event_id, v_invitation_id, trim(concat_ws(' ', g.first_name, g.last_name)), p_attending, 'party', COALESCE(v_summary, ''));
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_invitation(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_guest_rsvp(uuid, boolean, integer, text, text) TO anon, authenticated;

-- 4. AVISO POR MAIL DE CADA RESPUESTA
-- La función send-notification-email recibe solo el id de la respuesta, la busca
-- en la base y le escribe al dueño del evento. Si el mail falla, la respuesta
-- se guarda igual.
-- ⚠️ Si tu proyecto no es ijvbnduaecrpsaivgzay, cambiá la dirección de abajo.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_new_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    BEGIN
        PERFORM net.http_post(
            url := 'https://ijvbnduaecrpsaivgzay.supabase.co/functions/v1/send-notification-email',
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('response_id', NEW.id)
        );
    EXCEPTION WHEN others THEN
        RAISE WARNING 'No se pudo avisar por mail la respuesta %: %', NEW.id, SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_invitation_response ON public.invitation_responses;
CREATE TRIGGER on_new_invitation_response
    AFTER INSERT ON public.invitation_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_response();
