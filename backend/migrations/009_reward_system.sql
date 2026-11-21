-- 009: Reward system giai đoạn 2 — danh mục nhiệm vụ (data-driven), sổ điểm chỉ-ghi-thêm, trần điểm.
-- Additive: không sửa/xóa dữ liệu cũ. Phụ thuộc migration 006 (và 008 để nhóm học sinh có mức điểm).
-- Mặc định TẮT: survey_tracking_configs.rewards_enabled = false cho mọi khảo sát.
-- Đơn vị điểm: mã nội bộ TVT, tên hiển thị đổi được (reward_settings.unit_name) mà không ảnh hưởng lịch sử.

create table if not exists public.reward_settings (
  id text primary key default 'global' check (id = 'global'),
  unit_name text not null default 'Sao' check (char_length(unit_name) between 1 and 20),
  unit_icon text not null default '⭐' check (char_length(unit_icon) between 1 and 8),
  daily_cap integer not null default 50 check (daily_cap between 1 and 1000),
  weekly_cap integer not null default 250 check (weekly_cap between 1 and 5000),
  cycle_days integer not null default 14 check (cycle_days between 1 and 365),
  timezone text not null default 'Asia/Ho_Chi_Minh',
  group_labels jsonb not null default '{"green":"Gói Duy trì","yellow":"Gói Cân bằng","red":"Gói Đồng hành"}'::jsonb,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.reward_settings (id) values ('global') on conflict (id) do nothing;

alter table public.survey_tracking_configs
  add column if not exists rewards_enabled boolean not null default false;

create table if not exists public.reward_tasks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Za-z0-9][A-Za-z0-9_-]{1,23}$'),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 400),
  instructions text not null default '' check (char_length(instructions) <= 800),
  points integer not null default 10 check (points between 0 and 50),
  audience text[] not null check (audience <@ array['green','yellow','red']::text[] and cardinality(audience) > 0),
  completion_type text not null default 'self_report' check (completion_type in ('self_report', 'timer', 'count_chars', 'choice')),
  min_seconds integer check (min_seconds between 1 and 7200),
  min_count integer check (min_count between 1 and 2000),
  choices text[],
  window_start text check (window_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  window_end text check (window_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  times_per_day integer not null default 1 check (times_per_day between 1 and 5),
  duration_minutes integer check (duration_minutes between 1 and 240),
  verification text not null default '' check (char_length(verification) <= 200),
  is_active boolean not null default true,
  is_placeholder boolean not null default true,        -- dữ liệu tạm; không tự biến thành nội dung can thiệp chính thức
  sort_order integer not null default 0,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bản ghi bắt đầu cho nhiệm vụ có đếm giờ (máy chủ kiểm tra thời gian tối thiểu)
create table if not exists public.reward_task_starts (
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  task_id uuid not null references public.reward_tasks(id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (profile_id, task_id)
);

-- Sổ điểm CHỈ GHI THÊM. Khóa duy nhất bảo đảm "mỗi nhiệm vụ một lần/ngày" ở tầng DB (chống cộng trùng khi tải lại/gửi lặp).
create table if not exists public.reward_completions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  task_id uuid not null references public.reward_tasks(id) on delete restrict,
  task_code text not null,
  local_date date not null,
  slot smallint not null default 1,
  points integer not null check (points >= 0),          -- điểm thực nhận sau trần
  base_points integer not null check (base_points >= 0),
  group_tier text check (group_tier in ('green', 'yellow', 'red')),
  meta jsonb not null default '{}'::jsonb,              -- chỉ lưu loại lựa chọn hoặc số lượng, KHÔNG lưu nội dung nhập
  completed_at timestamptz not null default now(),
  unique (profile_id, task_id, local_date, slot)
);
create index if not exists reward_completions_profile_date_idx on public.reward_completions (profile_id, local_date);

alter table public.reward_settings enable row level security;
alter table public.reward_tasks enable row level security;
alter table public.reward_task_starts enable row level security;
alter table public.reward_completions enable row level security;
revoke all on public.reward_settings, public.reward_tasks, public.reward_task_starts, public.reward_completions from anon, authenticated;
