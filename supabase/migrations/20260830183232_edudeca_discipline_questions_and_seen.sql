-- Proposed bank: one pool per discipline per level.
-- sort_order is the slot inside that pool (Physics 1, 2, 3…), not a mixed set number.
-- Drop the empty leftover edudeca_questions table (old name).

DROP TABLE IF EXISTS public.edudeca_questions CASCADE;

CREATE TABLE public.edudeca_discipline_questions (
  id text PRIMARY KEY,
  discipline_id text NOT NULL REFERENCES public.edudeca_disciplines (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
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

COMMENT ON TABLE public.edudeca_discipline_questions IS
  'EduDeca challenge pool. One row = one question, locked to a level and a discipline.';

COMMENT ON COLUMN public.edudeca_discipline_questions.sort_order IS
  'Slot inside that discipline pool on this level. Not a shared set number.';

CREATE UNIQUE INDEX edudeca_discipline_questions_pool_slot_uidx
  ON public.edudeca_discipline_questions (level, discipline_id, sort_order);

CREATE INDEX edudeca_discipline_questions_level_disc_published_idx
  ON public.edudeca_discipline_questions (level, discipline_id, published);

ALTER TABLE public.edudeca_discipline_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_discipline_questions_select_published"
  ON public.edudeca_discipline_questions
  FOR SELECT
  TO authenticated
  USING (published = true);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.edudeca_discipline_questions
  TO anon, authenticated, service_role;

-- Never-repeat log: correct, wrong, or skip uses up the question for that student.

CREATE TABLE public.edudeca_question_seen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  question_id text NOT NULL REFERENCES public.edudeca_discipline_questions (id) ON DELETE CASCADE,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 10),
  discipline_id text NOT NULL REFERENCES public.edudeca_disciplines (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  outcome text NOT NULL CHECK (outcome IN ('correct', 'wrong', 'skip')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

COMMENT ON TABLE public.edudeca_question_seen IS
  'Questions this student already faced. Correct, wrong, and skip all count. Never served again.';

CREATE INDEX edudeca_question_seen_user_level_idx
  ON public.edudeca_question_seen (user_id, level, discipline_id);

ALTER TABLE public.edudeca_question_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_question_seen_select_own"
  ON public.edudeca_question_seen
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "edudeca_question_seen_insert_own"
  ON public.edudeca_question_seen
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.edudeca_question_seen
  TO anon, authenticated, service_role;
