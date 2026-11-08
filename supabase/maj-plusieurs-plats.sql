-- Mise à jour du 2026-11-08. À coller une fois dans Supabase : SQL Editor > New query > Run.

-- Plusieurs plats dans un même repas (poulet moutarde + purée le mercredi midi).
-- Les repas déjà posés deviennent le plat n° 0 : rien n'est perdu.
alter table case_menu add column plat int not null default 0 check (plat between 0 and 9);
alter table case_menu drop constraint case_menu_pkey;
alter table case_menu add primary key (proprietaire, semaine, jour, moment, plat);
