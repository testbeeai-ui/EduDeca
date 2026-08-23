-- Mark invite rows DONE (joined) when the email already exists on EduDeca profiles.
-- Admin GET can call this; students still convert via edudeca_sync_invite_conversion on sign-in.

CREATE OR REPLACE FUNCTION public.edudeca_reconcile_invite_registrations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer := 0;
  r record;
BEGIN
  IF NOT public.edudeca_is_college_admin() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  FOR r IN
    UPDATE public.edudeca_student_invitations i
    SET status = 'joined',
        joined_at = coalesce(i.joined_at, now()),
        notes = CASE
          WHEN i.notes IS NULL OR btrim(i.notes) = '' THEN
            'DONE — email already registered on EduDeca.'
          WHEN i.notes ILIKE '%already registered%' THEN i.notes
          ELSE i.notes || ' | DONE — email already registered on EduDeca.'
        END
    WHERE i.status IS DISTINCT FROM 'joined'
      AND EXISTS (
        SELECT 1
        FROM public.edudeca_profiles p
        WHERE p.email IS NOT NULL
          AND btrim(p.email) <> ''
          AND lower(btrim(p.email)) = lower(btrim(i.email))
      )
    RETURNING i.batch_id
  LOOP
    v_updated := v_updated + 1;
    UPDATE public.edudeca_invite_batches b
    SET joined_count = (
          SELECT count(*)::integer
          FROM public.edudeca_student_invitations x
          WHERE x.batch_id = b.id AND x.status = 'joined'
        ),
        sent_count = (
          SELECT count(*)::integer
          FROM public.edudeca_student_invitations x
          WHERE x.batch_id = b.id AND x.status = 'sent'
        ),
        queued_count = (
          SELECT count(*)::integer
          FROM public.edudeca_student_invitations x
          WHERE x.batch_id = b.id AND x.status = 'queued_tomorrow'
        )
    WHERE b.id = r.batch_id;
  END LOOP;

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.edudeca_reconcile_invite_registrations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.edudeca_reconcile_invite_registrations() TO authenticated;

COMMENT ON FUNCTION public.edudeca_reconcile_invite_registrations() IS
  'Admin: set invitation status to joined (DONE) when email already exists in edudeca_profiles.';
