-- Allow EduDeca college invite sends in shared transactional_email_logs.kind
-- (same IST daily cap as EduBlast welcome/login/approval mail).
ALTER TABLE public.transactional_email_logs
  DROP CONSTRAINT IF EXISTS transactional_email_logs_kind_check;

ALTER TABLE public.transactional_email_logs
  ADD CONSTRAINT transactional_email_logs_kind_check
  CHECK (kind = ANY (ARRAY[
    'welcome'::text,
    'login'::text,
    'approval'::text,
    'edudeca_invite'::text,
    'other'::text
  ]));
