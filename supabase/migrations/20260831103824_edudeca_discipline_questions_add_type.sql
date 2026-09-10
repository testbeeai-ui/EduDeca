-- Optional author taxonomy from source docs (TYPE 1 — VOCABULARY & WORD USAGE, etc.).
-- Null when a document has no type. Do not invent values at seed time.

ALTER TABLE public.edudeca_discipline_questions
  ADD COLUMN IF NOT EXISTS type text;

COMMENT ON COLUMN public.edudeca_discipline_questions.type IS
  'Optional question taxonomy from the source document, e.g. Vocabulary & Word Usage. Null if the doc has no type heading. Distinct from difficulty_rating (Simple / Medium / Difficult / Tricky).';
