-- Agregamos la columna para la Tarjeta de Presentación Principal
ALTER TABLE "public"."event_invitations" 
ADD COLUMN IF NOT EXISTS "main_card_url" TEXT;

COMMENT ON COLUMN "public"."event_invitations"."main_card_url" IS 'URL de la imagen de la tarjeta de presentación principal que se muestra tras la selección de música';
