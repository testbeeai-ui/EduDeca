-- Admin feedback visible to the college applicant on their application row.
ALTER TABLE public.edudeca_college_applications
  ADD COLUMN IF NOT EXISTS admin_feedback text,
  ADD COLUMN IF NOT EXISTS admin_feedback_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;

COMMENT ON COLUMN public.edudeca_college_applications.admin_feedback IS
  'Latest admin message for the college (approve note, reject reason, or guidance).';
COMMENT ON COLUMN public.edudeca_college_applications.admin_feedback_at IS
  'When admin_feedback was last set.';
COMMENT ON COLUMN public.edudeca_college_applications.rejected_at IS
  'When status was set to rejected by an admin.';

CREATE OR REPLACE FUNCTION public.edudeca_guard_college_application_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'approved'
     AND (
       NEW.institution_key IS DISTINCT FROM OLD.institution_key
       OR NEW.institution_name IS DISTINCT FROM OLD.institution_name
     )
     AND NOT public.edudeca_is_college_admin() THEN
    RAISE EXCEPTION 'Approved college identity cannot be changed'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
     OR NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback
     OR NEW.admin_feedback_at IS DISTINCT FROM OLD.admin_feedback_at THEN
    IF public.edudeca_is_college_admin() THEN
      RETURN NEW;
    END IF;

    IF OLD.status = 'rejected'
       AND NEW.status = 'pending'
       AND NEW.verified_at IS NULL
       AND NEW.user_id = (SELECT auth.uid()) THEN
      NEW.rejected_at := NULL;
      RETURN NEW;
    END IF;

    IF NEW.admin_feedback IS DISTINCT FROM OLD.admin_feedback
       OR NEW.admin_feedback_at IS DISTINCT FROM OLD.admin_feedback_at
       OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at THEN
      RAISE EXCEPTION 'Only EduDeca college admins can change verification feedback'
        USING ERRCODE = '42501';
    END IF;

    RAISE EXCEPTION 'Only EduDeca college admins can change verification status'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
