-- Cover the discipline_id foreign key (not leftmost on the slot unique index).

CREATE INDEX edudeca_mock_questions_discipline_id_idx
  ON public.edudeca_mock_questions (discipline_id);
