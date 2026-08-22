-- EduDeca student email invitations & invite batches table schema
-- Admin console invites, daily quota management, and automated conversion tracking.

CREATE TABLE IF NOT EXISTS public.edudeca_invite_batches (
  id text PRIMARY KEY,
  college_name text NOT NULL,
  total_count integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  queued_count integer NOT NULL DEFAULT 0,
  joined_count integer NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  xi_count integer NOT NULL DEFAULT 0,
  xii_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.edudeca_student_invitations (
  id text PRIMARY KEY,
  batch_id text NOT NULL REFERENCES public.edudeca_invite_batches(id) ON DELETE CASCADE,
  college_name text NOT NULL,
  email text NOT NULL,
  name text,
  student_code text,
  class_level integer CHECK (class_level IS NULL OR class_level IN (11, 12)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('joined', 'sent', 'queued_tomorrow', 'pending')),
  invited_at timestamptz,
  joined_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edudeca_student_invitations_email_idx
  ON public.edudeca_student_invitations (email);

CREATE INDEX IF NOT EXISTS edudeca_student_invitations_status_idx
  ON public.edudeca_student_invitations (status);

CREATE INDEX IF NOT EXISTS edudeca_student_invitations_college_name_idx
  ON public.edudeca_student_invitations (college_name);

ALTER TABLE public.edudeca_invite_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edudeca_student_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS edudeca_invite_batches_admin ON public.edudeca_invite_batches;
CREATE POLICY edudeca_invite_batches_admin
  ON public.edudeca_invite_batches
  FOR ALL
  TO authenticated
  USING (public.edudeca_is_college_admin())
  WITH CHECK (public.edudeca_is_college_admin());

DROP POLICY IF EXISTS edudeca_student_invitations_admin ON public.edudeca_student_invitations;
CREATE POLICY edudeca_student_invitations_admin
  ON public.edudeca_student_invitations
  FOR ALL
  TO authenticated
  USING (
    public.edudeca_is_college_admin()
    OR email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  WITH CHECK (
    public.edudeca_is_college_admin()
    OR email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Marks matching invite rows joined for the JWT email and refreshes batch joined_count.
CREATE OR REPLACE FUNCTION public.edudeca_sync_invite_conversion()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_updated integer := 0;
  r record;
BEGIN
  IF v_email = '' THEN
    RETURN 0;
  END IF;

  FOR r IN
    UPDATE public.edudeca_student_invitations
    SET status = 'joined',
        joined_at = coalesce(joined_at, now())
    WHERE lower(email) = v_email
      AND status IS DISTINCT FROM 'joined'
    RETURNING batch_id
  LOOP
    v_updated := v_updated + 1;
    UPDATE public.edudeca_invite_batches b
    SET joined_count = (
      SELECT count(*)::integer
      FROM public.edudeca_student_invitations i
      WHERE i.batch_id = b.id AND i.status = 'joined'
    )
    WHERE b.id = r.batch_id;
  END LOOP;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.edudeca_sync_invite_conversion() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.edudeca_sync_invite_conversion() TO authenticated;
