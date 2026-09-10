-- One question can carry zero, one, or several source-doc types.
-- Rename type (text) → types (text[]). Empty docs stay null.

ALTER TABLE public.edudeca_discipline_questions
  ALTER COLUMN type TYPE text[]
  USING CASE
    WHEN type IS NULL OR btrim(type) = '' THEN NULL
    ELSE ARRAY[btrim(type)]
  END;

ALTER TABLE public.edudeca_discipline_questions
  RENAME COLUMN type TO types;

COMMENT ON COLUMN public.edudeca_discipline_questions.types IS
  'Optional source-doc taxonomies. Null if the document has no type. One type is a single-element array; several types are all stored. Distinct from difficulty_rating.';
