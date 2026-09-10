-- Drop the old mixed-set bank (240 Level 1 rows) and recreate empty.
-- sort_order is now the slot inside a (level, subject_id) pool, not a shared set number.

DROP TABLE IF EXISTS public.edudeca_questions CASCADE;

CREATE TABLE public.edudeca_questions (
  id text PRIMARY KEY,
  subject_id text NOT NULL,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 10),
  sort_order smallint NOT NULL CHECK (sort_order >= 1),
  stem text NOT NULL,
  options jsonb NOT NULL,
  correct_index smallint NOT NULL,
  explanation text,
  difficulty_rating smallint,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.edudeca_questions IS
  'EduDeca challenge bank. Empty until discipline pools are seeded. sort_order is the item slot inside a level+subject pool, not a mixed set number.';

COMMENT ON COLUMN public.edudeca_questions.sort_order IS
  'Position inside that subject pool on this level (1, 2, 3…). Not a shared set number.';

CREATE INDEX edudeca_questions_level_subject_published_idx
  ON public.edudeca_questions (level, subject_id, published);

ALTER TABLE public.edudeca_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_questions_select_published"
  ON public.edudeca_questions
  FOR SELECT
  TO authenticated
  USING (published = true);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.edudeca_questions
  TO anon, authenticated, service_role;
