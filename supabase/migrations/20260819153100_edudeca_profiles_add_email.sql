-- Add email to EduDeca-specific profiles so the table shows both the shared
-- auth user id and the user's email address in separate columns.
ALTER TABLE public.edudeca_profiles
  ADD COLUMN IF NOT EXISTS email text;

UPDATE public.edudeca_profiles ep
SET email = au.email
FROM auth.users au
WHERE au.id = ep.id
  AND (ep.email IS NULL OR btrim(ep.email) = '');

COMMENT ON COLUMN public.edudeca_profiles.email IS
  'Auth email mirrored from auth.users for easy viewing in EduDeca profiles.';
