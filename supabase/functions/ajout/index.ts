// Fonction « ajout » : appelée par le raccourci iPhone (Partager > Ajouter à Popote), sans ouvrir l'appli.
// Reçoit { jeton, lien, mots } en JSON et répond une phrase en clair, que le raccourci affiche.
// À déployer dans Supabase : Edge Functions > Deploy a new function > Via Editor, nom « ajout », avec ce fichier ET liens.ts.
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { cleLien, extraireLien } from './liens.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const reponse = (texte: string, status = 200) => new Response(texte, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reponse('Popote : cette adresse sert seulement au raccourci iPhone.', 405);
  let corps: { jeton?: unknown; lien?: unknown; mots?: unknown };
  try {
    corps = await req.json();
  } catch {
    return reponse('Popote : le raccourci est mal réglé (le corps de la requête doit être en JSON).', 400);
  }
  const jeton = String(corps.jeton ?? '').trim();
  const mots = String(corps.mots ?? '').trim().slice(0, 120);

  const { data: j, error: e } = await db.from('jeton').select('membre').eq('valeur', jeton || '-').maybeSingle();
  if (e) return reponse('Popote : la fonction n’a pas accès à la base (clé serveur). Voir docs/raccourci-iphone.md.', 500);
  if (!j) return reponse('Popote : jeton faux ou effacé. Ouvre Popote, puis « Raccourci iPhone », et recopie le jeton dans le raccourci.', 401);

  const lien = extraireLien(String(corps.lien ?? ''));
  const cle = lien && cleLien(lien);
  if (!lien || !cle) return reponse('Popote : aucun lien trouvé dans ce partage.', 400);
  if (!mots) return reponse('Popote : écris 2-3 mots pour la retrouver.', 400);

  const { data: deja } = await db.from('recette').select('nom').eq('cle_lien', cle).maybeSingle();
  if (deja) return reponse(`Déjà dans le carnet : « ${deja.nom} »`);

  const insta = cle.startsWith('instagram:');
  const { error } = await db.from('recette').insert({ type: insta ? 'insta' : 'web', nom: mots, mots_cles: insta ? mots : '', lien, cle_lien: cle, portions: 4, ajoutee_par: j.membre });
  if (error?.code === '23505') return reponse('Déjà dans le carnet');
  if (error) return reponse('Popote : pas enregistrée, réessaie dans un moment.', 500);
  return reponse(`Ajoutée au carnet ✓ « ${mots} »`);
});
