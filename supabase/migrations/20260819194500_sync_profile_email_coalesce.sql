-- Do not wipe an existing email if auth.users has no matching row.
CREATE OR REPLACE FUNCTION public.sync_row_email_from_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
  NEW.email := COALESCE(
    (
      SELECT u.email
      FROM auth.users u
      WHERE u.id = NEW.id
    ),
    NEW.email
  );
  RETURN NEW;
END;
$$;
