-- Freundessystem: Profile (Benutzername + Live-Status) und Freundschaften.
-- Im Supabase SQL-Editor ausführen.

-- 1) Profile -----------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  training_since timestamptz,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Angemeldete Nutzer dürfen Profile lesen (um Freunde zu finden/anzuzeigen).
drop policy if exists "Read profiles" on profiles;
create policy "Read profiles"
on profiles for select
using (auth.uid() is not null);

-- Jeder verwaltet nur sein eigenes Profil.
drop policy if exists "Manage own profile" on profiles;
create policy "Manage own profile"
on profiles for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- 2) Freundschaften ----------------------------------------------------------
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted'
  created_at timestamptz not null default now(),
  unique (requester, addressee)
);

create index if not exists friendships_addressee_idx on friendships (addressee);
create index if not exists friendships_requester_idx on friendships (requester);

alter table friendships enable row level security;

-- Man sieht nur Freundschaften, an denen man beteiligt ist.
drop policy if exists "See own friendships" on friendships;
create policy "See own friendships"
on friendships for select
using (auth.uid() = requester or auth.uid() = addressee);

-- Anfrage senden (nur als requester).
drop policy if exists "Create friend request" on friendships;
create policy "Create friend request"
on friendships for insert
with check (auth.uid() = requester);

-- Annehmen/ändern (beide Beteiligten).
drop policy if exists "Update own friendship" on friendships;
create policy "Update own friendship"
on friendships for update
using (auth.uid() = requester or auth.uid() = addressee)
with check (auth.uid() = requester or auth.uid() = addressee);

-- Löschen/ablehnen/entfreunden (beide Beteiligten).
drop policy if exists "Delete own friendship" on friendships;
create policy "Delete own friendship"
on friendships for delete
using (auth.uid() = requester or auth.uid() = addressee);

-- 3) Freunde dürfen die Trainings-Sessions des anderen lesen -----------------
drop policy if exists "Friends can read sessions" on workout_sessions;
create policy "Friends can read sessions"
on workout_sessions for select
using (
  exists (
    select 1 from friendships f
    where f.status = 'accepted'
      and (
        (f.requester = auth.uid() and f.addressee = workout_sessions."user")
        or (f.addressee = auth.uid() and f.requester = workout_sessions."user")
      )
  )
);
