-- 022: thêm dạng câu hỏi "time" (giờ trong ngày) cho bảng questions.
-- Chạy tay trong Supabase SQL Editor, sau 001. Chỉ thêm/sửa ràng buộc, không đổi dữ liệu hiện có.
-- Postgres không sửa CHECK tại chỗ, nên tìm và bỏ mọi ràng buộc CHECK đang nhắc tới question_type
-- (kể cả tên ràng buộc do Postgres tự sinh) rồi tạo lại đúng danh sách dạng câu hỏi hiện hành.

do $$
declare constraint_name text;
begin
  for constraint_name in
    select conname
    from pg_constraint
    where conrelid = 'public.questions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%question_type%'
  loop
    execute format('alter table public.questions drop constraint %I', constraint_name);
  end loop;
end $$;

alter table public.questions
  add constraint questions_question_type_check check (question_type in
    ('single','mc','text','longtext','likert','rating','rank','slider','matrix','image','sd','time'));

-- RLS đã bật cho questions ở migration 001 (không policy, đã revoke anon/authenticated).
