-- Photos des plats (§2.3). À coller une fois dans Supabase : SQL Editor > New query > Run.
-- Dossier « photos » lisible par lien (nom de fichier imprévisible), 500 Ko max par photo (l'appli les réduit à ~300 Ko).
-- Seuls les membres connectés peuvent envoyer ou effacer une photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 512000, array['image/jpeg']);

create policy "membres envoient des photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.moi() is not null);
create policy "membres effacent des photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.moi() is not null);
