-- One question has at most one source-doc type. Null if the document has none.

ALTER TABLE public.edudeca_discipline_questions
  ADD COLUMN IF NOT EXISTS type text;

UPDATE public.edudeca_discipline_questions
SET type = CASE
  WHEN types IS NULL OR cardinality(types) = 0 THEN NULL
  ELSE NULLIF(btrim(types[1]), '')
END
WHERE type IS NULL;

ALTER TABLE public.edudeca_discipline_questions
  DROP COLUMN IF EXISTS types;

COMMENT ON COLUMN public.edudeca_discipline_questions.type IS
  'Optional source-doc taxonomy for this question only (e.g. TYPE 1 — VOCABULARY & WORD USAGE). One type per question. Null if the document has no type. Distinct from difficulty_rating.';
