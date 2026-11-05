create table if not exists public.research_project_dataset_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  created_by uuid references public.users(id) on delete set null,
  checksum text not null check (checksum ~ '^[0-9a-f]{64}$'),
  checksum_algorithm text not null check (checksum_algorithm = 'hmac-sha256-v1'),
  dataset_definition text not null check (dataset_definition = 'completed-not-excluded-v1'),
  response_count integer not null check (response_count >= 0),
  survey_count integer not null check (survey_count >= 0),
  survey_ids uuid[] not null default '{}',
  captured_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists research_project_dataset_versions_idx
  on public.research_project_dataset_versions (project_id, captured_at desc, id desc);

alter table public.research_project_dataset_versions enable row level security;
