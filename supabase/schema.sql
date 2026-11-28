-- ============================================================================
-- La Bàn Lựa Chọn – Supabase schema (chạy 1 lần trong SQL Editor)
-- Máy chủ dùng SUPABASE_SERVICE_ROLE_KEY nên RLS bật nhưng không cần policy:
-- service_role bỏ qua RLS, còn anon/auth key bị chặn hoàn toàn.
-- ============================================================================

create table if not exists public.auth_accounts (
  id text primary key,
  full_name text not null default '',
  role text not null,
  username text not null,
  username_key text not null,
  password_hash text not null,
  salt text not null,
  created_at text not null,
  class_name text,
  parent_pin text,
  linked_children jsonb not null default '[]'::jsonb,
  homeroom_teacher_username text
);

create unique index if not exists auth_accounts_username_key_idx
  on public.auth_accounts (username_key);

create table if not exists public.auth_sessions (
  token text primary key,
  user_id text not null,
  created_at double precision not null,
  expires_at double precision not null
);

create index if not exists auth_sessions_user_id_idx
  on public.auth_sessions (user_id);

create table if not exists public.student_records (
  student_id text primary key,
  account_id text not null,
  full_name text not null,
  class_name text not null,
  teacher_username text not null,
  updated_at text not null,
  student jsonb not null
);

create index if not exists student_records_teacher_idx
  on public.student_records (teacher_username);

create table if not exists public.ai_messages (
  id text primary key,
  student_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists ai_messages_student_idx
  on public.ai_messages (student_id);

create table if not exists public.ai_moderation_logs (
  id text primary key,
  student_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists ai_moderation_logs_student_idx
  on public.ai_moderation_logs (student_id);

create table if not exists public.meetings (
  id text primary key,
  student_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists meetings_student_idx
  on public.meetings (student_id);

create table if not exists public.class_settings (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.auth_accounts enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.student_records enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_moderation_logs enable row level security;
alter table public.meetings enable row level security;
alter table public.class_settings enable row level security;