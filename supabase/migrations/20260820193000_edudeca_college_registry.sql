-- EduDeca college applications + roster (replaces data/college-registry.json)
-- RLS: own rows for colleges; admin allowlist for verification; roster scoped by institution_key.

CREATE OR REPLACE FUNCTION public.edudeca_is_college_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = ANY (
    ARRAY[
      'michaelkillgta@gmail.com',
      'michaelkilligta@gmail.com',
      'alexis36sg@gmail.com',
      'mailidpwd@gmail.com'
    ]
  );
$$;

REVOKE ALL ON FUNCTION public.edudeca_is_college_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.edudeca_is_college_admin() TO authenticated;

CREATE TABLE IF NOT EXISTS public.edudeca_college_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  institution_name text NOT NULL,
  institution_key text NOT NULL,
  state text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  xi_count text NOT NULL DEFAULT '',
  xii_count text NOT NULL DEFAULT '',
  math boolean NOT NULL DEFAULT true,
  bio boolean NOT NULL DEFAULT false,
  principal_name text NOT NULL DEFAULT '',
  principal_mobile text NOT NULL DEFAULT '',
  principal_email text NOT NULL DEFAULT '',
  contact_name text NOT NULL DEFAULT '',
  contact_mobile text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  pledge boolean NOT NULL DEFAULT false,
  xi_file_name text,
  xii_file_name text,
  xi_stored_rel_path text,
  xii_stored_rel_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edudeca_college_applications_status_submitted_idx
  ON public.edudeca_college_applications (status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS edudeca_college_applications_institution_key_idx
  ON public.edudeca_college_applications (institution_key);

CREATE INDEX IF NOT EXISTS edudeca_college_applications_approved_key_idx
  ON public.edudeca_college_applications (institution_key)
  WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS public.edudeca_college_roster (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_key text NOT NULL,
  student_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  display_name text NOT NULL,
  student_code text,
  class_level integer CHECK (class_level IS NULL OR class_level IN (11, 12)),
  campaign_level integer NOT NULL DEFAULT 1,
  is_proctored_paid boolean NOT NULL DEFAULT false,
  last_challenge_date text,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_key, student_user_id)
);

CREATE INDEX IF NOT EXISTS edudeca_college_roster_institution_key_idx
  ON public.edudeca_college_roster (institution_key);

CREATE INDEX IF NOT EXISTS edudeca_college_roster_student_user_id_idx
  ON public.edudeca_college_roster (student_user_id);

CREATE OR REPLACE FUNCTION public.edudeca_set_college_applications_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS edudeca_college_applications_set_updated_at
  ON public.edudeca_college_applications;
CREATE TRIGGER edudeca_college_applications_set_updated_at
  BEFORE UPDATE ON public.edudeca_college_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.edudeca_set_college_applications_updated_at();

-- Only college admins may approve / reject.
CREATE OR REPLACE FUNCTION public.edudeca_guard_college_application_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    IF NOT public.edudeca_is_college_admin() THEN
      RAISE EXCEPTION 'Only EduDeca college admins can change verification status'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS edudeca_college_applications_guard_status
  ON public.edudeca_college_applications;
CREATE TRIGGER edudeca_college_applications_guard_status
  BEFORE UPDATE ON public.edudeca_college_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.edudeca_guard_college_application_status();

ALTER TABLE public.edudeca_college_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edudeca_college_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS edudeca_college_applications_select ON public.edudeca_college_applications;
CREATE POLICY edudeca_college_applications_select
  ON public.edudeca_college_applications
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.edudeca_is_college_admin()
  );

DROP POLICY IF EXISTS edudeca_college_applications_insert ON public.edudeca_college_applications;
CREATE POLICY edudeca_college_applications_insert
  ON public.edudeca_college_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
  );

DROP POLICY IF EXISTS edudeca_college_applications_update ON public.edudeca_college_applications;
CREATE POLICY edudeca_college_applications_update
  ON public.edudeca_college_applications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.edudeca_is_college_admin()
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.edudeca_is_college_admin()
  );

DROP POLICY IF EXISTS edudeca_college_roster_select ON public.edudeca_college_roster;
CREATE POLICY edudeca_college_roster_select
  ON public.edudeca_college_roster
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (SELECT auth.uid())
    OR public.edudeca_is_college_admin()
    OR EXISTS (
      SELECT 1
      FROM public.edudeca_college_applications a
      WHERE a.user_id = (SELECT auth.uid())
        AND a.status = 'approved'
        AND a.institution_key = edudeca_college_roster.institution_key
    )
  );

DROP POLICY IF EXISTS edudeca_college_roster_insert ON public.edudeca_college_roster;
CREATE POLICY edudeca_college_roster_insert
  ON public.edudeca_college_roster
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.edudeca_college_applications a
      WHERE a.status = 'approved'
        AND a.institution_key = edudeca_college_roster.institution_key
    )
  );

DROP POLICY IF EXISTS edudeca_college_roster_update ON public.edudeca_college_roster;
CREATE POLICY edudeca_college_roster_update
  ON public.edudeca_college_roster
  FOR UPDATE
  TO authenticated
  USING (student_user_id = (SELECT auth.uid()) OR public.edudeca_is_college_admin())
  WITH CHECK (student_user_id = (SELECT auth.uid()) OR public.edudeca_is_college_admin());

-- Match approved college by key + upsert the signed-in student's roster row.
CREATE OR REPLACE FUNCTION public.edudeca_sync_student_college_roster(
  p_institution_key text,
  p_display_name text,
  p_student_code text,
  p_class_level integer,
  p_campaign_level integer,
  p_is_proctored_paid boolean,
  p_last_challenge_date text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_key text := nullif(btrim(p_institution_key), '');
  v_matched boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF v_key IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'institution_key', null);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.edudeca_college_applications a
    WHERE a.status = 'approved'
      AND a.institution_key = v_key
  ) INTO v_matched;

  IF NOT v_matched THEN
    RETURN jsonb_build_object('matched', false, 'institution_key', null);
  END IF;

  INSERT INTO public.edudeca_college_roster (
    institution_key,
    student_user_id,
    display_name,
    student_code,
    class_level,
    campaign_level,
    is_proctored_paid,
    last_challenge_date,
    synced_at
  )
  VALUES (
    v_key,
    v_uid,
    coalesce(nullif(btrim(p_display_name), ''), 'Student'),
    nullif(btrim(p_student_code), ''),
    CASE WHEN p_class_level IN (11, 12) THEN p_class_level ELSE NULL END,
    coalesce(p_campaign_level, 1),
    coalesce(p_is_proctored_paid, false),
    nullif(btrim(p_last_challenge_date), ''),
    now()
  )
  ON CONFLICT (institution_key, student_user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    student_code = EXCLUDED.student_code,
    class_level = EXCLUDED.class_level,
    campaign_level = EXCLUDED.campaign_level,
    is_proctored_paid = EXCLUDED.is_proctored_paid,
    last_challenge_date = EXCLUDED.last_challenge_date,
    synced_at = now();

  RETURN jsonb_build_object('matched', true, 'institution_key', v_key);
END;
$$;

REVOKE ALL ON FUNCTION public.edudeca_sync_student_college_roster(
  text, text, text, integer, integer, boolean, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.edudeca_sync_student_college_roster(
  text, text, text, integer, integer, boolean, text
) TO authenticated;

COMMENT ON TABLE public.edudeca_college_applications IS
  'College / institution EduDeca registrations awaiting or after admin verification.';
COMMENT ON TABLE public.edudeca_college_roster IS
  'Students linked to an approved college via matching institution_key.';
