-- brainst0rm · schema khởi tạo (chạy trong Supabase → SQL Editor)
create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  password_hash text not null,
  created_at timestamptz not null default now()
);
create unique index users_username_key on users (lower(username));

create table surveys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null default 'Khảo sát chưa đặt tên',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  public_slug text not null unique,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index surveys_user_idx on surveys (user_id, updated_at desc);

create table questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in
    ('single','mc','text','longtext','likert','rating','rank','slider','matrix','image','sd')),
  position int not null,
  is_required boolean not null default true,
  settings jsonb not null default '{}'
);
create index questions_survey_idx on questions (survey_id, position);

create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null,
  value text not null,
  position int not null
);
create index options_question_idx on question_options (question_id, position);

create table responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  duration_seconds int,
  quality_status text not null default 'normal' check (quality_status in ('normal','suspicious','spam')),
  quality_score int not null default 100 check (quality_score between 0 and 100),
  -- bổ sung so với đặc tả: phục vụ phát hiện phản hồi đáng ngờ
  signals jsonb not null default '[]',
  ip_hash text,
  answer_hash text,
  created_at timestamptz not null default now()
);
create index responses_survey_idx on responses (survey_id, submitted_at desc);
create index responses_ip_idx on responses (survey_id, ip_hash, started_at);
create index responses_hash_idx on responses (survey_id, answer_hash);

create table answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_value jsonb not null,
  unique (response_id, question_id)
);
create index answers_question_idx on answers (question_id);

create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger surveys_touch before update on surveys for each row execute function touch_updated_at();

-- Backend dùng service_role (bỏ qua RLS). Bật RLS không policy để khóa truy cập trực tiếp bằng anon key.
alter table users enable row level security;
alter table surveys enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table responses enable row level security;
alter table answers enable row level security;
