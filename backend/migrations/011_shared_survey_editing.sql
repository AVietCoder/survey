-- 011: Cài đặt quyền chỉnh sửa khảo sát giữa các tài khoản.
-- Mặc định bật theo yêu cầu tạm thời; admin có thể tắt trong giao diện quản trị.
create table if not exists public.app_settings (
  id text primary key default 'global' check (id = 'global'),
  shared_survey_editing boolean not null default true,
  updated_by uuid references public.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values ('global') on conflict (id) do nothing;

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon, authenticated;
