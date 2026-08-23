-- Align location matching with TS normalizeLocationPart (collapse internal whitespace).

CREATE OR REPLACE FUNCTION public.edudeca_sync_student_college_roster(
  p_institution_key text,
  p_display_name text,
  p_student_code text,
  p_class_level integer,
  p_campaign_level integer,
  p_is_proctored_paid boolean,
  p_last_challenge_date text,
  p_state text,
  p_city text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_key text := nullif(btrim(p_institution_key), '');
  v_state text := nullif(regexp_replace(lower(btrim(coalesce(p_state, ''))), '\s+', ' ', 'g'), '');
  v_city text := nullif(regexp_replace(lower(btrim(coalesce(p_city, ''))), '\s+', ' ', 'g'), '');
  v_matched boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF v_key IS NULL OR v_state IS NULL OR v_city IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'institution_key', null);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.edudeca_college_applications a
    WHERE a.status = 'approved'
      AND a.institution_key = v_key
      AND regexp_replace(lower(btrim(a.state)), '\s+', ' ', 'g') = v_state
      AND regexp_replace(lower(btrim(a.city)), '\s+', ' ', 'g') = v_city
  ) INTO v_matched;

  IF NOT v_matched THEN
    DELETE FROM public.edudeca_college_roster
    WHERE student_user_id = v_uid
      AND institution_key = v_key;
    RETURN jsonb_build_object('matched', false, 'institution_key', null);
  END IF;

  INSERT INTO public.edudeca_college_roster (
    institution_key,
    student_user_id,
    display_name,
    student_code,
    class_level,
    campaign_level,
    is_proctored_paid,
    last_challenge_date,
    synced_at
  )
  VALUES (
    v_key,
    v_uid,
    coalesce(nullif(btrim(p_display_name), ''), 'Student'),
    nullif(btrim(p_student_code), ''),
    CASE WHEN p_class_level IN (11, 12) THEN p_class_level ELSE NULL END,
    coalesce(p_campaign_level, 1),
    coalesce(p_is_proctored_paid, false),
    nullif(btrim(p_last_challenge_date), ''),
    now()
  )
  ON CONFLICT (institution_key, student_user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    student_code = EXCLUDED.student_code,
    class_level = EXCLUDED.class_level,
    campaign_level = EXCLUDED.campaign_level,
    is_proctored_paid = EXCLUDED.is_proctored_paid,
    last_challenge_date = EXCLUDED.last_challenge_date,
    synced_at = now();

  RETURN jsonb_build_object('matched', true, 'institution_key', v_key);
END;
$$;
