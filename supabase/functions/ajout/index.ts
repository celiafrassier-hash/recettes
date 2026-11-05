// Fonction « ajout » : appelée par le raccourci iPhone (Partager > Ajouter à Popote), sans ouvrir l'appli.
// Reçoit { jeton, lien, mots } en JSON et répond une phrase en clair, que le raccourci affiche.
// Sert aussi à l'appli après un partage Android : { remplir: id } avec la connexion de la personne.
// Dans les deux cas, la recette est remplie depuis la légende du post Insta ou la fiche du site web (insta.ts).
// À déployer dans Supabase : Edge Functions > ajout > Code, avec les 8 fichiers .ts de ce dossier, « Verify JWT » désactivé
// (le raccourci n'a pas de connexion ; l'appli, elle, est vérifiée dans remplirPourMembre). Avant : lancer supabase/insta.sql.
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';
import { remplir } from './insta.ts';
import { cleLien, extraireLien } from './liens.ts';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
// L'appli (autre adresse) appelle aussi cette fonction : le navigateur demande d'abord l'autorisation (CORS).
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type' };
const reponse = (texte: string, status = 200) => new Response(texte, { status, headers: { ...CORS, 'content-type': 'text/plain; charset=utf-8' } });

// Partage Android : la recette est déjà enregistrée par l'appli, on la remplit pour un membre connecté.
async function remplirPourMembre(req: Request, id: string) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const { data: u } = await db.auth.getUser(token);
  const email = u.user?.email?.toLowerCase();
  const { data: m } = email ? await db.from('membre').select('id').eq('email', email).maybeSingle() : { data: null };
  if (!m) return reponse('Popote : connexion refusée.', 401);
  const r = await remplir(db, id);
  return new Response(JSON.stringify(r), { headers: { ...CORS, 'content-type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return reponse('Popote : cette adresse sert seulement au raccourci iPhone.', 405);
  let corps: { jeton?: unknown; lien?: unknown; mots?: unknown; remplir?: unknown };
  try {
    corps = await req.json();
  } catch {
    return reponse('Popote : le raccourci est mal réglé (le corps de la requête doit être en JSON).', 400);
  }
  if (typeof corps.remplir === 'string') return remplirPourMembre(req, corps.remplir);
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
  const { data: n, error } = await db.from('recette').insert({ type: insta ? 'insta' : 'web', nom: mots, mots_cles: insta ? mots : '', lien, cle_lien: cle, portions: 4, ajoutee_par: j.membre }).select('id').single();
  if (error?.code === '23505') return reponse('Déjà dans le carnet');
  if (error) return reponse('Popote : pas enregistrée, réessaie dans un moment.', 500);
  const rempli = await remplir(db, n.id);
  return reponse(`Ajoutée au carnet ✓ « ${mots} »${rempli ? ` (recette reprise ${insta ? 'de la légende' : 'du site'}, à relire)` : ''}`);
});
