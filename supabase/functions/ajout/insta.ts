// Remplit une recette Insta à partir du post : ingrédients et étapes tirés de la légende, couverture comme photo.
// Insta donne la légende et la couverture au robot de partage de Facebook (testé le 2026-11-04 depuis Supabase).
// Si Insta bloque un jour, rien ne casse : la recette garde son lien et ses mots-clés.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.117.3';
import { decouper, decoderHtml, legendeDe } from './legende.ts';

const ROBOT = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const meta = (html: string, re: RegExp) => html.match(re)?.[1] ?? null;

export async function lireInsta(lien: string): Promise<{ legende: string; image: string | null } | null> {
  try {
    const r = await fetch(lien, { headers: { 'user-agent': ROBOT }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    const html = await r.text();
    const desc = meta(html, /<meta name="description" content="([^"]*)"/);
    const image = meta(html, /<meta property="og:image" content="([^"]*)"/);
    if (!desc && !image) return null;
    return { legende: desc ? legendeDe(desc) : '', image: image && decoderHtml(image) };
  } catch {
    return null;
  }
}

// Recopie la couverture dans le stockage « photos » (les adresses Insta expirent au bout de quelques jours).
async function copierPhoto(db: SupabaseClient, id: string, image: string): Promise<string | null> {
  try {
    const r = await fetch(image, { headers: { 'user-agent': ROBOT }, signal: AbortSignal.timeout(8000) });
    const blob = await r.blob();
    if (!r.ok || blob.size > 500 * 1024) return null;
    const chemin = `${id}/${Date.now()}.jpg`;
    const { error } = await db.storage.from('photos').upload(chemin, blob, { contentType: 'image/jpeg' });
    return error ? null : db.storage.from('photos').getPublicUrl(chemin).data.publicUrl;
  } catch {
    return null;
  }
}

// Ne remplit que les cases encore vides : on n'écrase jamais ce que quelqu'un a déjà saisi.
export async function remplir(db: SupabaseClient, id: string) {
  const { data: r } = await db.from('recette').select('lien, ingredients, etapes, photo').eq('id', id).maybeSingle();
  if (!r?.lien) return null;
  const post = await lireInsta(r.lien);
  if (!post) return null;
  const d = decouper(post.legende);
  const patch: Record<string, unknown> = {};
  if (!r.ingredients?.length && d.ingredients.length) Object.assign(patch, { ingredients: d.ingredients, portions: d.portions });
  if (!r.etapes && d.etapes) patch.etapes = d.etapes;
  if (!r.photo && post.image) {
    const photo = await copierPhoto(db, id, post.image);
    if (photo) patch.photo = photo;
  }
  if (!Object.keys(patch).length) return null;
  const { data } = await db.from('recette').update(patch).eq('id', id).select().single();
  return data;
}
