-- Admin-Rolle. Im Supabase SQL-Editor ausführen.
-- Wer in dieser Tabelle steht, darf die Admin-Seite (/admin) sehen.

create table if not exists admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Nutzer dürfen nur ihren EIGENEN Admin-Eintrag lesen (zum Prüfen des Zugriffs).
-- Einfügen/Ändern passiert nur hier im SQL-Editor bzw. über den Service-Role-Key.
drop policy if exists "Users can read own admin flag" on admins;

create policy "Users can read own admin flag"
on admins for select
using (auth.uid() = user_id);

-- Dich selbst als Admin eintragen (E-Mail bei Bedarf anpassen):
insert into admins (user_id)
select id from auth.users
where email = 'philipp.franken07@gmail.com'
on conflict (user_id) do nothing;
