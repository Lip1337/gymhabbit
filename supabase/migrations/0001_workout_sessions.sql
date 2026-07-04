-- Run this in the Supabase SQL editor (Project > SQL Editor).
-- Stores a snapshot of each completed workout so progress/history survives reloads.

create table if not exists workout_sessions (
  id uuid primary key default gen_random_uuid(),
  "user" uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references plans (id) on delete set null,
  plan_name text not null,
  exercises jsonb not null,
  completed_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_completed_at_idx
  on workout_sessions ("user", completed_at desc);

alter table workout_sessions enable row level security;

drop policy if exists "Users can manage their own workout sessions" on workout_sessions;

create policy "Users can manage their own workout sessions"
on workout_sessions for all
using (auth.uid() = "user")
with check (auth.uid() = "user");

-- Also make sure RLS is enabled on the existing plans table:
alter table plans enable row level security;

drop policy if exists "Users can manage their own plans" on plans;

create policy "Users can manage their own plans"
on plans for all
using (auth.uid() = "user")
with check (auth.uid() = "user");
