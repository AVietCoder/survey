-- Add a researcher-controlled review workflow without deleting or rewriting responses.
alter table public.responses
  add column if not exists review_status text not null default 'needs_review'
    check (review_status in ('needs_review', 'accepted', 'excluded')),
  add column if not exists review_note text not null default '',
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id) on delete set null;

create index if not exists responses_review_idx
  on public.responses (survey_id, review_status, submitted_at desc);
