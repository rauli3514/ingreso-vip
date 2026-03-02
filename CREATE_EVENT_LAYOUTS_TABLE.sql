-- Create table for event layouts
CREATE TABLE public.event_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text DEFAULT 'Layout 1',
  width numeric DEFAULT 1000, -- Default width in cm (10m)
  height numeric DEFAULT 1000, -- Default height in cm (10m)
  objects jsonb DEFAULT '[]'::jsonb, -- Array of table objects
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for faster lookup by event
CREATE INDEX idx_event_layouts_event_id ON public.event_layouts(event_id);

-- Enable RLS
ALTER TABLE public.event_layouts ENABLE ROW LEVEL SECURITY;

-- Policies (Assuming standard authenticated users can read/write their own event layouts)
CREATE POLICY "Enable read access for all users" ON public.event_layouts
  FOR SELECT USING (true); -- Or restrict based on event ownership

CREATE POLICY "Enable insert for authenticated users" ON public.event_layouts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.event_layouts
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.event_layouts
  FOR DELETE USING (auth.role() = 'authenticated');
