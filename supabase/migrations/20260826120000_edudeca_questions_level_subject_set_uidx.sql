-- Level 1 ships 20 sets × 12 subjects. Unique is one row per subject per set per level.
DROP INDEX IF EXISTS public.edudeca_questions_level_subject_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS edudeca_questions_level_subject_set_uidx
  ON public.edudeca_questions (level, subject_id, sort_order);

CREATE INDEX IF NOT EXISTS edudeca_questions_level_sort_published_idx
  ON public.edudeca_questions (level, sort_order, published);
