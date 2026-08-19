-- Keep profiles.email and edudeca_profiles.email as a mirror of auth.users.email.
-- Client payloads cannot spoof a different address.

CREATE OR REPLACE FUNCTION public.sync_row_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  NEW.email := (
    SELECT u.email
    FROM auth.users u
    WHERE u.id = NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_email_from_auth ON public.profiles;
CREATE TRIGGER profiles_sync_email_from_auth
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_row_email_from_auth();

DROP TRIGGER IF EXISTS edudeca_profiles_sync_email_from_auth ON public.edudeca_profiles;
CREATE TRIGGER edudeca_profiles_sync_email_from_auth
  BEFORE INSERT OR UPDATE ON public.edudeca_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_row_email_from_auth();

-- Fill any leftover blank emails from auth.
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id
  AND (p.email IS NULL OR btrim(p.email) = '');

UPDATE public.edudeca_profiles ep
SET email = au.email
FROM auth.users au
WHERE au.id = ep.id
  AND (ep.email IS NULL OR btrim(ep.email) = '');
