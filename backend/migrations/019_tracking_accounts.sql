-- 019: Tài khoản học sinh (tên đăng nhập + mật khẩu) gắn với hồ sơ theo dõi ẩn danh.
-- Không thu thập email/số điện thoại. Mỗi hồ sơ tối đa một tài khoản; xóa hồ sơ sẽ xóa tài khoản.
-- Chạy tay trong Supabase SQL Editor sau 006 (và 018 nếu có). Chạy lại an toàn.
-- (014–017 dành cho lộ trình giai đoạn 5–8.)

create table if not exists public.tracking_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.tracking_profiles(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.tracking_accounts enable row level security;
revoke all on table public.tracking_accounts from anon, authenticated;

-- Làm mới bộ nhớ đệm schema của PostgREST để API thấy bảng mới ngay.
notify pgrst, 'reload schema';
