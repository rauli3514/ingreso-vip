-- FIX DEFINITIVO: Verificar que la tabla existe y luego añadir la columna

DO $$
BEGIN
    if exists (select constraint_name from information_schema.table_constraints where table_name='guests' and constraint_type='FOREIGN KEY') then
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guests' AND column_name='is_after_party') THEN
            ALTER TABLE public.guests ADD COLUMN is_after_party BOOLEAN DEFAULT FALSE;
        END IF;
    end if;
END $$;
