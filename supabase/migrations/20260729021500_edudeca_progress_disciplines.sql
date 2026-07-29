-- Add Decathlon discipline lineup to EduDeca progress
ALTER TABLE public.edudeca_user_progress
  ADD COLUMN IF NOT EXISTS disciplines jsonb;

COMMENT ON COLUMN public.edudeca_user_progress.disciplines IS
  'Ordered 10-slot EduDeca Decathlon lineup (discipline ids).';
