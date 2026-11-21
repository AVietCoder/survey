-- 010: Reward system giai đoạn 3A — chuỗi ngày khích lệ và Thẻ nghỉ.
-- Additive; thẻ nghỉ không tạo điểm và bảng ghi nhận được xóa theo hồ sơ.

alter table public.reward_settings
  add column if not exists rest_cards_per_week smallint not null default 2
    check (rest_cards_per_week between 0 and 7),
  add column if not exists streak_enabled boolean not null default true;

create table if not exists public.reward_rest_cards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  local_date date not null,
  created_at timestamptz not null default now(),
  unique (profile_id, local_date)
);
create index if not exists reward_rest_cards_profile_date_idx
  on public.reward_rest_cards (profile_id, local_date);

alter table public.reward_rest_cards enable row level security;
revoke all on public.reward_rest_cards from anon, authenticated;
