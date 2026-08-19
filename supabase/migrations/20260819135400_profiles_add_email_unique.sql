-- Add email column to public.profiles, backfill from auth.users, and enforce
-- case-insensitive uniqueness to prevent duplicate email rows.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- Backfill from auth.users using the shared id relationship
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE au.id = p.id
  AND p.email IS NULL;

-- Create case-insensitive unique index (partial: only non-empty emails)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_unique_idx
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL AND btrim(email) <> '';

COMMENT ON COLUMN public.profiles.email IS
  'User email, backfilled from auth.users.email. Unique (case-insensitive).';
