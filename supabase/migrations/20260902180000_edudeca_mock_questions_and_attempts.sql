-- EduDeca mock papers (Word-file sets). Separate from Daily Challenge
-- (edudeca_discipline_questions) and from EduBlast JEE/CBSE mocks
-- (mock_papers / mock_questions / mock_test_attempts).

CREATE TABLE public.edudeca_mock_questions (
  id text PRIMARY KEY,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 3),
  set_number smallint NOT NULL CHECK (set_number BETWEEN 1 AND 20),
  discipline_id text NOT NULL REFERENCES public.edudeca_disciplines (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  sort_order smallint NOT NULL CHECK (sort_order >= 1),
  stem text NOT NULL,
  options jsonb NOT NULL,
  correct_index smallint NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  explanation text,
  difficulty_rating smallint,
  type text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edudeca_mock_questions_options_len_chk
    CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) = 4)
);

COMMENT ON TABLE public.edudeca_mock_questions IS
  'EduDeca mock-paper bank. One row = one MCQ in a level/set/discipline slot. Not the Daily Challenge pool.';

COMMENT ON COLUMN public.edudeca_mock_questions.sort_order IS
  'Slot inside that set and discipline (L1: 1, L2: 1–2, L3: 1–3).';

COMMENT ON COLUMN public.edudeca_mock_questions.type IS
  'At most one Type label copied from the source document. Null when the document has no Type heading.';

COMMENT ON COLUMN public.edudeca_mock_questions.difficulty_rating IS
  'Numeric difficulty from source labels (Higher-Medium, Tricky, …). Never stored in type.';

CREATE UNIQUE INDEX edudeca_mock_questions_slot_uidx
  ON public.edudeca_mock_questions (level, set_number, discipline_id, sort_order);

CREATE INDEX edudeca_mock_questions_level_set_published_idx
  ON public.edudeca_mock_questions (level, set_number, published);

ALTER TABLE public.edudeca_mock_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_mock_questions_select_published"
  ON public.edudeca_mock_questions
  FOR SELECT
  TO authenticated
  USING (published = true);

REVOKE ALL ON TABLE public.edudeca_mock_questions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.edudeca_mock_questions TO authenticated;
GRANT ALL ON TABLE public.edudeca_mock_questions TO service_role;

CREATE TABLE public.edudeca_mock_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  level smallint NOT NULL CHECK (level BETWEEN 1 AND 3),
  set_number smallint NOT NULL CHECK (set_number BETWEEN 1 AND 20),
  status text NOT NULL CHECK (status IN ('inprogress', 'completed')),
  correct integer CHECK (correct IS NULL OR correct >= 0),
  total integer CHECK (total IS NULL OR total >= 0),
  score_pct integer CHECK (score_pct IS NULL OR score_pct BETWEEN 0 AND 100),
  answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, level, set_number)
);

COMMENT ON TABLE public.edudeca_mock_attempts IS
  'One mock-paper slot per student per level+set. Keep the best completed percent; never downgrade completed to inprogress.';

CREATE INDEX edudeca_mock_attempts_user_level_idx
  ON public.edudeca_mock_attempts (user_id, level);

ALTER TABLE public.edudeca_mock_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_mock_attempts_select_own"
  ON public.edudeca_mock_attempts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "edudeca_mock_attempts_insert_own"
  ON public.edudeca_mock_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "edudeca_mock_attempts_update_own"
  ON public.edudeca_mock_attempts
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.edudeca_mock_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.edudeca_mock_attempts TO authenticated;
GRANT ALL ON TABLE public.edudeca_mock_attempts TO service_role;

DROP TRIGGER IF EXISTS edudeca_mock_attempts_set_updated_at ON public.edudeca_mock_attempts;
CREATE TRIGGER edudeca_mock_attempts_set_updated_at
  BEFORE UPDATE ON public.edudeca_mock_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.edudeca_set_progress_updated_at();
