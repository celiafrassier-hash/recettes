-- Menu de la semaine et ajustements de courses (étape 4). Propres à chacune : personne ne voit ceux de l'autre.
-- À coller une fois dans Supabase : SQL Editor > New query > Run.

create table case_menu (
  proprietaire uuid not null references membre on delete cascade default moi(),
  semaine date not null, -- lundi de la semaine
  jour int not null check (jour between 0 and 6), -- 0 = lundi
  moment text not null check (moment in ('midi', 'soir')),
  recette uuid references recette on delete cascade, -- recette supprimée : la case se vide
  plaisir boolean not null default false,
  personnes int not null default 1 check (personnes between 1 and 20),
  primary key (proprietaire, semaine, jour, moment),
  check (plaisir or recette is not null)
);

create table ajustement (
  proprietaire uuid not null references membre on delete cascade default moi(),
  semaine date not null,
  cle text not null, -- nom mis au propre + unité (cleLigne)
  coche boolean not null default false,
  retire boolean not null default false,
  qty numeric,
  ajoute boolean not null default false,
  nom text,
  unite text,
  primary key (proprietaire, semaine, cle)
);

alter table case_menu enable row level security;
alter table ajustement enable row level security;
grant select, insert, update, delete on case_menu, ajustement to authenticated;

create policy "mon menu" on case_menu for all to authenticated using (proprietaire = moi()) with check (proprietaire = moi());
create policy "mes courses" on ajustement for all to authenticated using (proprietaire = moi()) with check (proprietaire = moi());
