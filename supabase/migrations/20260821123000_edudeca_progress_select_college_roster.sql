-- Let approved colleges read Decathlon disciplines for students on their roster
-- (needed for college dashboard Track: PCM vs PCB).

DROP POLICY IF EXISTS edudeca_progress_select_college_roster ON public.edudeca_user_progress;
CREATE POLICY edudeca_progress_select_college_roster
  ON public.edudeca_user_progress
  FOR SELECT
  TO authenticated
  USING (
    public.edudeca_is_college_admin()
    OR EXISTS (
      SELECT 1
      FROM public.edudeca_college_roster r
      JOIN public.edudeca_college_applications a
        ON a.institution_key = r.institution_key
       AND a.status = 'approved'
       AND a.user_id = (SELECT auth.uid())
      WHERE r.student_user_id = edudeca_user_progress.user_id
    )
  );

COMMENT ON POLICY edudeca_progress_select_college_roster ON public.edudeca_user_progress IS
  'Approved college accounts may read progress (disciplines) for students on their roster.';
