-- Jetons du raccourci iPhone (§2.1). À coller une fois dans Supabase : SQL Editor > New query > Run.
-- Aucune règle d'accès : personne ne lit cette table par l'appli. Seule la fonction « ajout » (clé serveur) s'en sert.

create table jeton (
  membre uuid primary key references membre on delete cascade,
  valeur text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
);
alter table jeton enable row level security;

-- Le membre connecté obtient SON jeton (créé la première fois), pour le coller dans le raccourci.
create function mon_jeton() returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if moi() is null then raise exception 'pas membre'; end if;
  insert into jeton (membre) values (moi()) on conflict (membre) do nothing;
  select valeur into v from jeton where membre = moi();
  return v;
end $$;
revoke execute on function mon_jeton() from anon, public;
grant execute on function mon_jeton() to authenticated;

-- Jeton perdu ou montré à quelqu'un : « delete from jeton where membre = (select id from membre where prenom = 'Alice'); »
-- puis rouvrir Popote > Raccourci iPhone pour en avoir un nouveau.
