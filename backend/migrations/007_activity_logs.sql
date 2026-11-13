-- 007: Nhật ký hoạt động toàn hệ thống (chỉ admin xem). Additive: không sửa bảng cũ.
-- Không lưu mật khẩu, token, mã khôi phục. IP chỉ lưu dạng băm.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  actor_name text,
  action text not null check (char_length(action) between 3 and 60),
  target_type text,
  target_id text,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_actor_idx on public.activity_logs (actor_id, created_at desc);
create index if not exists activity_logs_action_idx on public.activity_logs (action, created_at desc);

alter table public.activity_logs enable row level security;
revoke all on public.activity_logs from anon, authenticated;
