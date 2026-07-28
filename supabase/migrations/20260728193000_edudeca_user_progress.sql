-- EduDeca campaign progress (source of truth for signed-in users)
-- Applied to TestBee: edudeca_user_progress

CREATE TABLE IF NOT EXISTS public.edudeca_user_progress (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  campaign_level integer NOT NULL DEFAULT 1 CHECK (campaign_level BETWEEN 1 AND 10),
  xp integer NOT NULL DEFAULT 0 CHECK (xp >= 0),
  streak_days integer NOT NULL DEFAULT 1 CHECK (streak_days >= 0),
  subject_levels jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_proctored_paid boolean NOT NULL DEFAULT false,
  free_zone_complete boolean NOT NULL DEFAULT false,
  last_challenge_date date,
  anti_capture_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edudeca_user_progress_updated_at_idx
  ON public.edudeca_user_progress (updated_at DESC);

ALTER TABLE public.edudeca_user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edudeca_progress_select_own" ON public.edudeca_user_progress;
CREATE POLICY "edudeca_progress_select_own"
  ON public.edudeca_user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "edudeca_progress_insert_own" ON public.edudeca_user_progress;
CREATE POLICY "edudeca_progress_insert_own"
  ON public.edudeca_user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "edudeca_progress_update_own" ON public.edudeca_user_progress;
CREATE POLICY "edudeca_progress_update_own"
  ON public.edudeca_user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.edudeca_set_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS edudeca_user_progress_set_updated_at ON public.edudeca_user_progress;
CREATE TRIGGER edudeca_user_progress_set_updated_at
  BEFORE UPDATE ON public.edudeca_user_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.edudeca_set_progress_updated_at();
