-- brainst0rm · Progress Tracking (additive, không sửa bảng/migration cũ)
-- Mặc định TẮT: khảo sát chỉ dùng tính năng khi có dòng cấu hình với enabled = true.
-- Chạy trong Supabase → SQL Editor sau 005_dataset_versions.sql.
--
-- Nguyên tắc dữ liệu:
--  * Không lưu tên/email/số điện thoại. Hồ sơ theo dõi chỉ là một id ngẫu nhiên.
--  * Credential (cookie / mã khôi phục / liên kết khôi phục) chỉ lưu HMAC-SHA-256 của token.
--  * Session chỉ THAM CHIẾU response hiện có (response_id), không sao chép câu trả lời.
--  * Mọi bảng bật RLS không policy và thu hồi quyền anon/authenticated; chỉ backend (service_role) truy cập.

-- 1. Cấu hình theo dõi cho từng khảo sát -------------------------------------------------
create table if not exists public.survey_tracking_configs (
  survey_id uuid primary key references public.surveys(id) on delete cascade,
  enabled boolean not null default false,
  assessment_key text not null check (assessment_key ~ '^[a-z0-9][a-z0-9-]{0,46}[a-z0-9]$'),
  assessment_name text not null check (char_length(assessment_name) between 1 and 120),
  -- { method: 'sum'|'mean', version: '1', items: [{ question_id, reverse }] }
  scoring jsonb not null default '{}',
  scoring_fingerprint text check (scoring_fingerprint is null or scoring_fingerprint ~ '^[0-9a-f]{64}$'),
  score_meaning text not null default '' check (char_length(score_meaning) <= 300),
  -- { intervalDays, upcomingDays, graceDays, maxSessions }
  schedule jsonb not null default '{}',
  consent_text text not null default '' check (char_length(consent_text) <= 4000),
  consent_version integer not null default 1 check (consent_version >= 1),
  adult_attestation boolean not null default true,
  updated_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists survey_tracking_configs_key_idx
  on public.survey_tracking_configs (assessment_key) where enabled;

-- 2. Hồ sơ theo dõi (ẩn danh, không bắt buộc tài khoản brainst0rm) -----------------------
create table if not exists public.tracking_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

-- 3. Credential: chỉ lưu hash --------------------------------------------------------------
create table if not exists public.tracking_credentials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  kind text not null check (kind in ('cookie', 'recovery_code', 'recovery_link')),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text not null default '' check (char_length(label) <= 80),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists tracking_credentials_profile_idx
  on public.tracking_credentials (profile_id, created_at desc);

-- 4. Đồng ý tham gia theo dõi (có phiên bản + hash nội dung đã hiển thị) --------------------
create table if not exists public.tracking_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  assessment_key text not null,
  survey_id uuid references public.surveys(id) on delete set null,
  consent_version integer not null check (consent_version >= 1),
  consent_text_sha256 text not null check (consent_text_sha256 ~ '^[0-9a-f]{64}$'),
  adult_confirmed boolean not null default false,
  accepted_at timestamptz not null default now()
);

create index if not exists tracking_consents_lookup_idx
  on public.tracking_consents (profile_id, owner_id, assessment_key, accepted_at desc);

-- 5. Session: mỗi response hoàn tất tối đa MỘT session (idempotent) -------------------------
create table if not exists public.tracking_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  response_id uuid not null unique references public.responses(id) on delete cascade,
  assessment_key text not null,
  scoring_fingerprint text,
  scoring_snapshot jsonb not null default '{}',
  score numeric(10, 2),
  score_min numeric(10, 2),
  score_max numeric(10, 2),
  item_count integer,
  score_status text not null default 'scored' check (score_status in ('scored', 'incomplete', 'unscored')),
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists tracking_sessions_profile_idx
  on public.tracking_sessions (profile_id, owner_id, assessment_key, completed_at desc);
create index if not exists tracking_sessions_survey_idx
  on public.tracking_sessions (survey_id, completed_at desc);
create index if not exists tracking_sessions_owner_key_idx
  on public.tracking_sessions (owner_id, assessment_key);

drop trigger if exists survey_tracking_configs_touch on public.survey_tracking_configs;
create trigger survey_tracking_configs_touch
  before update on public.survey_tracking_configs
  for each row execute function public.touch_updated_at();

-- 6. Khóa truy cập trực tiếp (backend dùng service_role nên bỏ qua RLS) ---------------------
alter table public.survey_tracking_configs enable row level security;
alter table public.tracking_profiles enable row level security;
alter table public.tracking_credentials enable row level security;
alter table public.tracking_consents enable row level security;
alter table public.tracking_sessions enable row level security;

revoke all on table public.survey_tracking_configs from anon, authenticated;
revoke all on table public.tracking_profiles from anon, authenticated;
revoke all on table public.tracking_credentials from anon, authenticated;
revoke all on table public.tracking_consents from anon, authenticated;
revoke all on table public.tracking_sessions from anon, authenticated;
