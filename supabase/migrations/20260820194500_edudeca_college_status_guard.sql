-- Allow applicants to reopen rejected → pending; freeze approved institution identity.

CREATE OR REPLACE FUNCTION public.edudeca_guard_college_application_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Freeze identity once verified (roster matching key).
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
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    IF public.edudeca_is_college_admin() THEN
      RETURN NEW;
    END IF;

    -- Applicant may reopen a rejected application as pending.
    IF OLD.status = 'rejected'
       AND NEW.status = 'pending'
       AND NEW.verified_at IS NULL
       AND NEW.user_id = (SELECT auth.uid()) THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Only EduDeca college admins can change verification status'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
