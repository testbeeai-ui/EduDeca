-- Discipline catalog. Questions will reference these ids (not mixed sets).

CREATE TABLE public.edudeca_disciplines (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  sort_order smallint NOT NULL UNIQUE CHECK (sort_order >= 1),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.edudeca_disciplines IS
  'EduDeca discipline catalog. id is the stable code used on questions (phy, log, …).';

COMMENT ON COLUMN public.edudeca_disciplines.id IS
  'Stable discipline code. Future question rows must use this value.';

COMMENT ON COLUMN public.edudeca_disciplines.sort_order IS
  'Display order in the catalog. Not a question-set number.';

INSERT INTO public.edudeca_disciplines (id, name, short_name, sort_order) VALUES
  ('phy', 'Physics', 'Physics', 1),
  ('che', 'Chemistry', 'Chemistry', 2),
  ('mat', 'Mathematics', 'Maths', 3),
  ('bio', 'Biology', 'Biology', 4),
  ('amat', 'Applied Mathematics', 'Applied Maths', 5),
  ('biotech', 'Biotechnology', 'Biotech', 6),
  ('cs', 'AI & Computer Science', 'AI & CS', 7),
  ('ent', 'Entrepreneurship', 'Entrep', 8),
  ('eng', 'Verbal Ability', 'Verbal', 9),
  ('eco', 'Quantitative Ability', 'Quant', 10),
  ('log', 'Analytical Ability', 'Analytical', 11),
  ('gk', 'General Knowledge', 'GK', 12),
  ('fin', 'Financial Literacy', 'FinLit', 13);

ALTER TABLE public.edudeca_disciplines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edudeca_disciplines_select_active"
  ON public.edudeca_disciplines
  FOR SELECT
  TO authenticated
  USING (active = true);

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.edudeca_disciplines
  TO anon, authenticated, service_role;

ALTER TABLE public.edudeca_questions
  ADD CONSTRAINT edudeca_questions_subject_id_fkey
  FOREIGN KEY (subject_id)
  REFERENCES public.edudeca_disciplines (id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
