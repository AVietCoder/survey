-- 012: Reward system giai đoạn 3B — danh mục vật phẩm và kho đồ.
-- Vật phẩm là dữ liệu do admin quản lý; Sao tích lũy mở khóa tự động, không bị tiêu.

create table if not exists public.reward_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9][a-z0-9_-]{1,31}$'),
  kind text not null check (kind in ('title','badge','sticker','theme','pet_item')),
  name text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 300),
  unlock_stars integer not null default 0 check (unlock_stars between 0 and 1000000),
  asset_key text not null check (asset_key in ('star','leaf','moon','heart','sun')),
  is_active boolean not null default true,
  is_placeholder boolean not null default true,
  sort_order integer not null default 0 check (sort_order between -1000 and 1000),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reward_items_active_sort_idx on public.reward_items (is_active, sort_order, code);

create table if not exists public.reward_unlocks (
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  item_id uuid not null references public.reward_items(id) on delete restrict,
  unlocked_at timestamptz not null default now(),
  primary key (profile_id, item_id)
);
create index if not exists reward_unlocks_item_idx on public.reward_unlocks (item_id);

create table if not exists public.reward_profile_prefs (
  profile_id uuid primary key references public.tracking_profiles(id) on delete cascade,
  equipped jsonb not null default '{}'::jsonb check (jsonb_typeof(equipped) = 'object'),
  reminders_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.reward_items enable row level security;
alter table public.reward_unlocks enable row level security;
alter table public.reward_profile_prefs enable row level security;
revoke all on public.reward_items, public.reward_unlocks, public.reward_profile_prefs from anon, authenticated;
