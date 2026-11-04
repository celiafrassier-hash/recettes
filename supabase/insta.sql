-- Remplissage des recettes Insta (légende → ingrédients et étapes, couverture → photo).
-- À coller une fois dans Supabase : SQL Editor > New query > Run.
-- La fonction « ajout » (clé serveur, rôle service_role) doit pouvoir vérifier le membre et compléter la recette.
grant select on membre to service_role;
grant update on recette to service_role;
