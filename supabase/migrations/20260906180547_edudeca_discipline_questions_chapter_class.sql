-- TYPE stays TYPE headings only. Chapter and class are separate columns.

ALTER TABLE public.edudeca_discipline_questions
  ADD COLUMN IF NOT EXISTS chapter text;

ALTER TABLE public.edudeca_discipline_questions
  ADD COLUMN IF NOT EXISTS class_level text;

ALTER TABLE public.edudeca_discipline_questions
  DROP CONSTRAINT IF EXISTS edudeca_discipline_questions_class_level_chk;

ALTER TABLE public.edudeca_discipline_questions
  ADD CONSTRAINT edudeca_discipline_questions_class_level_chk
  CHECK (class_level IS NULL OR class_level IN ('XI', 'XII'));

UPDATE public.edudeca_discipline_questions
SET
  chapter = type,
  type = NULL
WHERE type ~* '^(CHAPTER|TOPIC)[[:space:]]'
   OR type ~* '^RANDOM MIXED';

COMMENT ON COLUMN public.edudeca_discipline_questions.type IS
  'Optional TYPE heading from the source doc (e.g. TYPE 1 — VOCABULARY & WORD USAGE). Null if the document has no TYPE. Distinct from chapter and difficulty_rating.';

COMMENT ON COLUMN public.edudeca_discipline_questions.chapter IS
  'Optional CHAPTER or TOPIC heading from CBSE banks (including RANDOM MIXED leftover sections). Null if the document has no chapter heading. Distinct from type.';

COMMENT ON COLUMN public.edudeca_discipline_questions.class_level IS
  'CBSE class of the source bank: XI or XII. Null when the document is not class-tagged.';

CREATE INDEX IF NOT EXISTS edudeca_discipline_questions_class_level_idx
  ON public.edudeca_discipline_questions (discipline_id, class_level);

CREATE INDEX IF NOT EXISTS edudeca_discipline_questions_chapter_idx
  ON public.edudeca_discipline_questions (discipline_id, chapter);
