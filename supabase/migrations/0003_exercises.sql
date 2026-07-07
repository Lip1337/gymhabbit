-- Geteilter Übungskatalog, den Admins pflegen. Im Supabase SQL-Editor ausführen.
-- (Setzt die admins-Tabelle aus 0002_admins.sql voraus.)

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table exercises enable row level security;

-- Lesen dürfen alle (angemeldeten) Nutzer – die Übungen erscheinen im Picker.
drop policy if exists "Anyone can read exercises" on exercises;
create policy "Anyone can read exercises"
on exercises for select
using (true);

-- Anlegen/Ändern/Löschen nur für Admins.
drop policy if exists "Admins manage exercises" on exercises;
create policy "Admins manage exercises"
on exercises for all
using (exists (select 1 from admins a where a.user_id = auth.uid()))
with check (exists (select 1 from admins a where a.user_id = auth.uid()));
