-- Per-level trial log: students get 10 fail chances; a win qualifies them onward.
CREATE TABLE IF NOT EXISTS public.edudeca_level_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 10),
  outcome text NOT NULL CHECK (outcome IN ('won', 'strikes', 'time', 'below_threshold')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edudeca_level_trials_user_level_idx
  ON public.edudeca_level_trials (user_id, level);

ALTER TABLE public.edudeca_level_trials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edudeca_level_trials_select_own" ON public.edudeca_level_trials;
CREATE POLICY "edudeca_level_trials_select_own"
  ON public.edudeca_level_trials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "edudeca_level_trials_insert_own" ON public.edudeca_level_trials;
CREATE POLICY "edudeca_level_trials_insert_own"
  ON public.edudeca_level_trials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
