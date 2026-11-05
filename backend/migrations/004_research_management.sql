create table if not exists public.research_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists research_projects_owner_idx
  on public.research_projects (owner_id, updated_at desc);

create table if not exists public.research_project_members (
  project_id uuid not null references public.research_projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('researcher', 'reviewer')),
  added_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists research_project_members_user_idx
  on public.research_project_members (user_id, project_id);

create table if not exists public.research_project_surveys (
  project_id uuid not null references public.research_projects(id) on delete cascade,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  linked_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, survey_id)
);

create index if not exists research_project_surveys_survey_idx
  on public.research_project_surveys (survey_id, project_id);

create table if not exists public.research_project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  author_id uuid references public.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists research_project_notes_idx
  on public.research_project_notes (project_id, created_at desc);

create table if not exists public.research_project_activity (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.research_projects(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists research_project_activity_idx
  on public.research_project_activity (project_id, created_at desc);

create table if not exists public.research_project_participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.research_projects(id) on delete cascade,
  participant_code text not null,
  status text not null default 'registered'
    check (status in ('registered', 'active', 'completed', 'withdrawn')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, participant_code)
);

create index if not exists research_project_participants_idx
  on public.research_project_participants (project_id, created_at desc);

drop trigger if exists research_projects_touch on public.research_projects;
create trigger research_projects_touch
  before update on public.research_projects
  for each row execute function public.touch_updated_at();

drop trigger if exists research_project_participants_touch on public.research_project_participants;
create trigger research_project_participants_touch
  before update on public.research_project_participants
  for each row execute function public.touch_updated_at();

alter table public.research_projects enable row level security;
alter table public.research_project_members enable row level security;
alter table public.research_project_surveys enable row level security;
alter table public.research_project_notes enable row level security;
alter table public.research_project_activity enable row level security;
alter table public.research_project_participants enable row level security;
