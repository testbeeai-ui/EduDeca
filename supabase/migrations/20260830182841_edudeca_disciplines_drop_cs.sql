-- Remove AI & Computer Science from the discipline catalog.

DELETE FROM public.edudeca_disciplines WHERE id = 'cs';
