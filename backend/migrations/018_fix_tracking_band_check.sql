-- 018: Đưa tracking_sessions.band về smallint 0–5 đúng như migration 008.
-- Lý do: một số DB đã áp bản 008 cũ, trong đó cột `band` là text với ràng buộc khác, nên lưu mức 2 bị từ chối (23514)
-- và người tham gia không tạo được hồ sơ theo dõi. `add column if not exists` ở 008 không đổi kiểu cột đã có.
-- Chạy tay trong Supabase SQL Editor; chạy lại an toàn. Giá trị cũ không phải số 0–5 sẽ thành null (mức chỉ là gợi ý).

alter table public.tracking_sessions
  drop constraint if exists tracking_sessions_band_check;

drop index if exists public.tracking_sessions_band_idx;

alter table public.tracking_sessions
  alter column band type smallint
  using (case when band::text ~ '^[0-5]$' then band::text::smallint else null end);

alter table public.tracking_sessions
  add constraint tracking_sessions_band_check
  check (band is null or band between 0 and 5);

create index if not exists tracking_sessions_band_idx
  on public.tracking_sessions (owner_id, assessment_key, band)
  where band is not null;
