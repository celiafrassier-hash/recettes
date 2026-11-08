-- Mise à jour du 2026-11-08 (2). À coller une fois dans Supabase : SQL Editor > New query > Run.
-- Rayon choisi à la main pour un aliment, en le glissant dans les courses (commun à toutes).
create table rayon_aliment (
  cle text primary key, -- nom de l'aliment mis au propre (norm)
  rayon text not null check (rayon in ('fl', 'cr', 'po', 'ep', 'su', 'autre'))
);
alter table rayon_aliment enable row level security;
grant select, insert, update on rayon_aliment to authenticated;
create policy "membres lisent les rayons" on rayon_aliment for select to authenticated using (moi() is not null);
create policy "membres ajoutent des rayons" on rayon_aliment for insert to authenticated with check (moi() is not null);
create policy "membres changent les rayons" on rayon_aliment for update to authenticated using (moi() is not null) with check (moi() is not null);
