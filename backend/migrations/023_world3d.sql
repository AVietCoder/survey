-- 023: thế giới 3D (chỉ thêm, chạy tay trong Supabase SQL Editor, sau 009 và 019). Mặc định TẮT.
-- world3d_enabled: admin bật tại #/admin/rewards. reward_world_items: kho báu và kỷ vật đã nhặt, chỉ lưu MÃ vật phẩm
-- (không lưu vị trí, đường đi hay thao tác). Không liên quan đến Sao. Xóa hồ sơ theo dõi thì xóa theo.

alter table public.reward_settings
  add column if not exists world3d_enabled boolean not null default false;

create table if not exists public.reward_world_items (
  profile_id uuid not null references public.tracking_profiles(id) on delete cascade,
  item_key text not null check (item_key ~ '^[a-z0-9_]{2,40}$'),
  found_at timestamptz not null default now(),
  primary key (profile_id, item_key)
);

alter table public.reward_world_items enable row level security;
revoke all on public.reward_world_items from anon, authenticated;
