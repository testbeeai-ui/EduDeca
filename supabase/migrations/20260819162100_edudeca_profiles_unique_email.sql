-- One EduDeca profile per Gmail. Students may overwrite their own details.
CREATE UNIQUE INDEX IF NOT EXISTS edudeca_profiles_email_lower_uidx
  ON public.edudeca_profiles (lower(email))
  WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE OR REPLACE FUNCTION public.edudeca_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(btrim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.edudeca_auth_user_id_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.edudeca_auth_user_id_by_email(text) FROM anon;
REVOKE ALL ON FUNCTION public.edudeca_auth_user_id_by_email(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.edudeca_auth_user_id_by_email(text) TO service_role;
