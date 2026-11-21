-- 021: nhiệm vụ riêng của từng khảo sát + lịch theo ngày (chỉ thêm, chạy tay trong Supabase SQL Editor, sau 013).
-- Nhiệm vụ có survey_id null = nhiệm vụ chung do admin quản lý (hành vi cũ, không đổi).
-- Khi khảo sát có ít nhất một nhiệm vụ riêng đang bật, học sinh của khảo sát đó CHỈ thấy các nhiệm vụ riêng.
-- start_day/end_day: ngày thứ N tính từ ngày (giờ Việt Nam) của lần đánh giá xác định nhóm; null = áp dụng mọi ngày.

alter table public.reward_tasks
  add column if not exists survey_id uuid references public.surveys(id) on delete cascade,
  add column if not exists start_day smallint check (start_day between 1 and 365),
  add column if not exists end_day smallint check (end_day between 1 and 365);

alter table public.reward_tasks drop constraint if exists reward_tasks_day_order_check;
alter table public.reward_tasks add constraint reward_tasks_day_order_check
  check (start_day is null or end_day is null or end_day >= start_day);

create index if not exists reward_tasks_survey_idx on public.reward_tasks (survey_id, sort_order);

-- Xóa khảo sát đã xóa luôn phiên theo dõi của nó (tracking_sessions on delete cascade); nhiệm vụ riêng và lịch sử hoàn thành
-- của khảo sát đó đi cùng. Trước đây task_id là "restrict" nên một khảo sát có nhiệm vụ riêng đã được làm sẽ không xóa được.
alter table public.reward_completions drop constraint if exists reward_completions_task_id_fkey;
alter table public.reward_completions
  add constraint reward_completions_task_id_fkey foreign key (task_id) references public.reward_tasks(id) on delete cascade;

-- RLS đã bật cho reward_tasks ở migration 009 (không có policy, đã revoke anon/authenticated).
