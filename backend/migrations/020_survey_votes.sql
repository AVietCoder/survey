-- 020: Bình chọn khảo sát mặc định. Mỗi tài khoản admin có tối đa MỘT phiếu (đổi được);
-- khảo sát đã xuất bản có nhiều phiếu nhất sẽ là khảo sát mặc định ở trang chủ.
-- Chỉ thêm mới, chạy tay trong Supabase SQL Editor (đúng project của backend). Chạy lại an toàn.
-- (014–017 dành cho lộ trình giai đoạn 5–8.)

create table if not exists public.survey_votes (
  admin_id uuid primary key references public.users(id) on delete cascade,
  survey_id uuid not null references public.surveys(id) on delete cascade,
  voted_at timestamptz not null default now()
);

create index if not exists survey_votes_survey_idx on public.survey_votes (survey_id);

alter table public.survey_votes enable row level security;
revoke all on table public.survey_votes from anon, authenticated;

notify pgrst, 'reload schema';
