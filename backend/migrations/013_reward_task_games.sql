-- 013: Gắn mini-game cho một số nhiệm vụ thưởng đã được duyệt.
-- Mini-game chỉ thay đổi cách hiển thị; điểm và xác minh vẫn theo completion_type hiện có.

alter table public.reward_tasks
  add column if not exists game text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reward_tasks_game_check'
      and conrelid = 'public.reward_tasks'::regclass
  ) then
    alter table public.reward_tasks
      add constraint reward_tasks_game_check
      check (
        game is null
        or (game in ('breathing', 'rest_timer') and completion_type = 'timer')
        or (game = 'three_plans' and completion_type = 'count_chars')
      );
  end if;
end $$;

-- Attach only the known temporary seed tasks; leave any admin-approved task untouched.
update public.reward_tasks set game = 'breathing'
where code = 'R-03' and is_placeholder = true and game is null;

update public.reward_tasks set game = 'rest_timer'
where code = 'Y-01' and is_placeholder = true and game is null;

update public.reward_tasks set game = 'three_plans'
where code = 'R-05' and is_placeholder = true and game is null;
