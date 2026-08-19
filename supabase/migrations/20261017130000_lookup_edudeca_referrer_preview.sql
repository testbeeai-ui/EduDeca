-- Public-safe lookup: referral code → referrer display name only (no id/email).
CREATE OR REPLACE FUNCTION public.lookup_edudeca_referrer_preview(p_ref_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  normalized text;
  referrer_name text;
BEGIN
  normalized := upper(btrim(coalesce(p_ref_code, '')));
  IF normalized !~ '^ED-[0-9]{2}([0-9][A-Z]){4}$' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  SELECT COALESCE(NULLIF(btrim(p.name), ''), 'a friend')
  INTO referrer_name
  FROM public.profiles p
  WHERE p.edudeca_referral_code = normalized
  LIMIT 1;

  IF referrer_name IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unknown_code');
  END IF;

  RETURN jsonb_build_object('ok', true, 'name', referrer_name);
END;
$$;

COMMENT ON FUNCTION public.lookup_edudeca_referrer_preview(text) IS
  'Anon-safe EduDeca invite preview: returns { ok, name } for a valid ED- referral code.';

REVOKE ALL ON FUNCTION public.lookup_edudeca_referrer_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_edudeca_referrer_preview(text) TO anon, authenticated, service_role;
