-- Carnet partagé (étape 2). À coller une fois dans Supabase : SQL Editor > New query > Run.
-- Aucun mail ici : le dépôt est public. Les membres s'ajoutent à part (voir docs/comptes.md).

create table membre (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  initiale text not null check (char_length(initiale) between 1 and 2),
  email text not null unique check (email = lower(email))
);

-- Membre connecté (null si l'adresse n'est pas dans la liste).
create function moi() returns uuid
language sql stable security definer set search_path = public as $$
  select id from membre where email = lower(auth.jwt() ->> 'email')
$$;

create table recette (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('insta', 'web', 'main')),
  nom text not null check (char_length(trim(nom)) > 0),
  mots_cles text not null default '',
  lien text,
  cle_lien text unique, -- lien nettoyé (cleLien) : bloque les doublons
  portions int not null default 4 check (portions > 0),
  ingredients jsonb not null default '[]', -- Ingredient[] ramenés à 1 personne
  etapes text not null default '',
  photo text,
  couleur text,
  categories text[] not null default '{}',
  ajoutee_par uuid references membre on delete set null default moi(),
  creee_le timestamptz not null default now()
);

create table statut (
  recette uuid not null references recette on delete cascade,
  membre uuid not null references membre on delete cascade default moi(),
  valeur text not null check (valeur in ('a_tester', 'deja_faite')),
  primary key (recette, membre)
);

alter table membre enable row level security;
alter table recette enable row level security;
alter table statut enable row level security;

grant select on membre to authenticated;
grant select, insert, update, delete on recette, statut to authenticated;
grant execute on function moi() to authenticated;
revoke execute on function moi() from anon, public;

-- Seuls les membres voient quelque chose. Le carnet est commun ; chacune ne change que SON statut.
create policy "membres lisent les membres" on membre for select to authenticated using (moi() is not null);
create policy "membres lisent le carnet" on recette for select to authenticated using (moi() is not null);
create policy "membres ajoutent" on recette for insert to authenticated with check (moi() is not null and ajoutee_par = moi());
create policy "membres modifient" on recette for update to authenticated using (moi() is not null) with check (moi() is not null);
create policy "membres suppriment" on recette for delete to authenticated using (moi() is not null);
create policy "membres lisent les statuts" on statut for select to authenticated using (moi() is not null);
create policy "chacune son statut" on statut for all to authenticated using (membre = moi()) with check (membre = moi());
