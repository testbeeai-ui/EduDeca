-- Dedicated EduDeca signup/profile data (separate from shared public.profiles)
CREATE TABLE IF NOT EXISTS public.edudeca_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  class_level integer CHECK (class_level IN (11, 12)),
  institution_name text,
  state text,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edudeca_profiles_updated_at_idx
  ON public.edudeca_profiles (updated_at DESC);

ALTER TABLE public.edudeca_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "edudeca_profiles_select_own" ON public.edudeca_profiles;
CREATE POLICY "edudeca_profiles_select_own"
  ON public.edudeca_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "edudeca_profiles_insert_own" ON public.edudeca_profiles;
CREATE POLICY "edudeca_profiles_insert_own"
  ON public.edudeca_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "edudeca_profiles_update_own" ON public.edudeca_profiles;
CREATE POLICY "edudeca_profiles_update_own"
  ON public.edudeca_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.edudeca_set_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS edudeca_profiles_set_updated_at ON public.edudeca_profiles;
CREATE TRIGGER edudeca_profiles_set_updated_at
  BEFORE UPDATE ON public.edudeca_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.edudeca_set_profiles_updated_at();

INSERT INTO public.edudeca_profiles (id, class_level, institution_name, state, city)
SELECT
  p.id,
  p.class_level,
  NULLIF(btrim(p.institution_name), ''),
  NULLIF(btrim(p.state), ''),
  NULLIF(btrim(p.city), '')
FROM public.profiles p
WHERE
  p.class_level IS NOT NULL
  OR NULLIF(btrim(p.institution_name), '') IS NOT NULL
  OR NULLIF(btrim(p.state), '') IS NOT NULL
  OR NULLIF(btrim(p.city), '') IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
  class_level = COALESCE(edudeca_profiles.class_level, EXCLUDED.class_level),
  institution_name = COALESCE(
    NULLIF(btrim(edudeca_profiles.institution_name), ''),
    EXCLUDED.institution_name
  ),
  state = COALESCE(NULLIF(btrim(edudeca_profiles.state), ''), EXCLUDED.state),
  city = COALESCE(NULLIF(btrim(edudeca_profiles.city), ''), EXCLUDED.city);

COMMENT ON TABLE public.edudeca_profiles IS
  'EduDeca-specific signup profile data stored separately from shared profiles.';
