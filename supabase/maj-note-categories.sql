-- Mise à jour du 2026-11-08. À coller une fois dans Supabase : SQL Editor > New query > Run.

-- Note libre sur un repas du menu (« + 200 g haricots verts » part aussi dans les courses).
alter table case_menu add column note text check (char_length(note) <= 200);

-- Catégories ajoutées à la main depuis le carnet (communes, comme le carnet).
create table categorie (
  nom text primary key check (char_length(trim(nom)) between 1 and 40),
  creee_le timestamptz not null default now()
);
alter table categorie enable row level security;
grant select, insert on categorie to authenticated;
create policy "membres lisent les catégories" on categorie for select to authenticated using (moi() is not null);
create policy "membres ajoutent des catégories" on categorie for insert to authenticated with check (moi() is not null);
