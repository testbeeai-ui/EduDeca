-- Campaign level catalog. Questions lock to a row here, same pattern as disciplines.

CREATE TABLE public.edudeca_levels (
  id smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 10),
  name text NOT NULL,
  title text NOT NULL,
  subtitle text,
  tier text NOT NULL CHECK (tier IN ('free', 'proctored', 'finals')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.edudeca_levels IS
  'EduDeca campaign levels 1–10. Questions.level must match a row here.';

COMMENT ON COLUMN public.edudeca_levels.id IS
  'Level number. Same value as edudeca_discipline_questions.level.';

INSERT INTO public.edudeca_levels (id, name, title, subtitle, tier) VALUES
  (1, 'Level 1', 'You are here', 'Start your first daily challenge', 'free'),
  (2, 'Level 2', 'Building up', 'Unlock after Level 1', 'free'),
  (3, 'Level 3', 'Free zone complete', 'Rank, streaks & leaderboard', 'free'),
  (4, 'Level 4', 'Proctored round', 'Identity verification required', 'proctored'),
  (5, 'Level 5', 'Proctored round', 'College-verified scores', 'proctored'),
  (6, 'Level 6', 'Proctored round', 'National shortlist gate', 'proctored'),
  (7, 'Level 7', 'Metro finals', 'Physical test centers, Dec 2026', 'finals'),
  (8, 'Level 8', 'Metro finals', 'Sponsor-backed travel & lodging', 'finals'),
  (9, 'Level 9', 'National semis', 'National visibility', 'finals'),
  (10, 'Level 10', 'National Final', '₹10L winner · college prestige', 'finals')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.edudeca_discipline_questions
  ADD CONSTRAINT edudeca_discipline_questions_level_fkey
  FOREIGN KEY (level) REFERENCES public.edudeca_levels (id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

ALTER TABLE public.edudeca_question_seen
  ADD CONSTRAINT edudeca_question_seen_level_fkey
  FOREIGN KEY (level) REFERENCES public.edudeca_levels (id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;

ALTER TABLE public.edudeca_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_levels_select_active"
  ON public.edudeca_levels
  FOR SELECT
  TO authenticated
  USING (active = true);

GRANT SELECT ON public.edudeca_levels TO anon, authenticated, service_role;
