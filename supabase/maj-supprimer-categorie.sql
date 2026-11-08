-- Mise à jour du 2026-11-08 (3). À coller une fois dans Supabase : SQL Editor > New query > Run.
-- Permet de supprimer une catégorie ajoutée à la main (depuis « Toutes » > « Supprimer… » du carnet).
grant delete on categorie to authenticated;
create policy "membres suppriment des catégories" on categorie for delete to authenticated using (moi() is not null);
