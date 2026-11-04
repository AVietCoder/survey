-- Run after 001_init.sql. New accounts are not admins by default.
alter table public.users
  add column if not exists is_admin boolean not null default false;

-- Promote an existing account manually, replacing the username below:
-- update public.users set is_admin = true where lower(username) = lower('your_username');
