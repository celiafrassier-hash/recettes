// Fonction « veille » : appelée chaque jour par cron-job.org (§4).
// 1. Lit la base, ce qui empêche Supabase gratuit de s'endormir (il dort après 7 jours sans activité).
// 2. Le dimanche (heure de Paris), écrit une sauvegarde JSON des recettes dans le dépôt GitHub PRIVÉ des sauvegardes.
// Secrets Supabase à régler (Edge Functions > Secrets) : VEILLE_CLE (mot de passe de l'appel), GITHUB_TOKEN, GITHUB_DEPOT (ex. celiafrassier-hash/popote-sauvegardes).
import { createClient } from 'npm:@supabase/supabase-js@2.117.3';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const reponse = (texte: string, status = 200) => new Response(texte, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });

Deno.serve(async (req) => {
  const cle = Deno.env.get('VEILLE_CLE');
  if (!cle || new URL(req.url).searchParams.get('cle') !== cle) return reponse('refusé', 401);

  const [r, s, m] = await Promise.all([
    db.from('recette').select('*').order('creee_le'),
    db.from('statut').select('*'),
    db.from('membre').select('id, prenom, initiale'),
  ]);
  if (r.error || s.error || m.error) return reponse('base inaccessible : ' + (r.error ?? s.error ?? m.error)!.message, 500);

  const paris = new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' }); // AAAA-MM-JJ
  const dimanche = new Date(paris + 'T12:00:00Z').getUTCDay() === 0;
  const forcer = new URL(req.url).searchParams.has('sauvegarder'); // pour tester un autre jour
  if (!dimanche && !forcer) return reponse(`éveillée ✓ ${r.data.length} recettes`);

  const depot = Deno.env.get('GITHUB_DEPOT');
  const jeton = Deno.env.get('GITHUB_TOKEN');
  if (!depot || !jeton) return reponse('éveillée ✓ mais sauvegarde impossible : GITHUB_DEPOT ou GITHUB_TOKEN manquant', 500);

  const contenu = JSON.stringify({ date: paris, membres: m.data, recettes: r.data, statuts: s.data }, null, 2);
  const octets = new TextEncoder().encode(contenu);
  let bin = '';
  for (const o of octets) bin += String.fromCharCode(o);
  const api = `https://api.github.com/repos/${depot}/contents/sauvegardes/${paris}.json`;
  const entetes = { authorization: `Bearer ${jeton}`, accept: 'application/vnd.github+json', 'user-agent': 'popote-veille' };
  const existant = await fetch(api, { headers: entetes }); // même jour relancé : on remplace le fichier
  const sha = existant.ok ? (await existant.json()).sha : undefined;
  const envoi = await fetch(api, { method: 'PUT', headers: entetes, body: JSON.stringify({ message: `Sauvegarde du ${paris}`, content: btoa(bin), sha }) });
  if (!envoi.ok) return reponse(`éveillée ✓ mais sauvegarde refusée par GitHub (${envoi.status}) : jeton expiré ? Voir docs/depannage.md`, 502);
  return reponse(`éveillée ✓ sauvegarde ${paris} (${r.data.length} recettes)`);
});
