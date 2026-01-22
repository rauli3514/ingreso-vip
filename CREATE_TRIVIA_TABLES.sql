-- Tabla para preguntas de la trivia
CREATE TABLE IF NOT EXISTS trivia_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL, -- Array de opciones: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"]
    correct_answer INTEGER NOT NULL, -- Índice de la respuesta correcta (0-3)
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para respuestas de invitados
CREATE TABLE IF NOT EXISTS trivia_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    answers JSONB NOT NULL, -- Array de índices de respuestas seleccionadas
    score INTEGER NOT NULL, -- Puntaje obtenido
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_trivia_questions_event ON trivia_questions(event_id);
CREATE INDEX IF NOT EXISTS idx_trivia_responses_event ON trivia_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_trivia_responses_score ON trivia_responses(event_id, score DESC);

-- Habilitar RLS
ALTER TABLE trivia_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_responses ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
-- Cualquiera puede leer preguntas
CREATE POLICY "Anyone can read trivia questions" ON trivia_questions
    FOR SELECT USING (true);

-- Solo usuarios autenticados pueden crear/editar preguntas
CREATE POLICY "Authenticated users can manage trivia questions" ON trivia_questions
    FOR ALL USING (auth.role() = 'authenticated');

-- Cualquiera puede insertar respuestas
CREATE POLICY "Anyone can submit trivia responses" ON trivia_responses
    FOR INSERT WITH CHECK (true);

-- Solo usuarios autenticados pueden ver todas las respuestas
CREATE POLICY "Authenticated users can read all trivia responses" ON trivia_responses
    FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE trivia_questions IS 'Preguntas de trivia personalizadas por evento';
COMMENT ON TABLE trivia_responses IS 'Respuestas de invitados a la trivia';
