// Lignes Supabase du menu et des courses (voir supabase/menu.sql). `semaine` = lundi au format AAAA-MM-JJ.
export type Moment = 'midi' | 'soir';
export type CaseLigne = { semaine: string; jour: number; moment: Moment; plat: number; recette: string | null; plaisir: boolean; personnes: number; note?: string | null };
export type AjLigne = { semaine: string; cle: string; coche: boolean; retire: boolean; qty: number | null; ajoute: boolean; nom: string | null; unite: string | null };
export type Choix = { recette: string | 'plaisir'; personnes: number };

export const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Toucher un repas avec le choix : ajoute ce plat au repas, ou le retire s'il y est déjà (même nombre de personnes).
// Rien de choisi : vide tout le repas. `plat` = numéro du plat dans le repas (0, 1, 2…).
export type Geste = { action: 'rien' } | { action: 'vider' } | { action: 'retirer'; plat: number } | { action: 'poser'; plat: number };
export function toucher(repas: CaseLigne[], choix: Choix | null): Geste {
  if (!choix) return repas.length ? { action: 'vider' } : { action: 'rien' };
  const meme = repas.find((c) => (choix.recette === 'plaisir' ? c.plaisir : c.recette === choix.recette));
  if (meme) return meme.plaisir || meme.personnes === choix.personnes ? { action: 'retirer', plat: meme.plat } : { action: 'poser', plat: meme.plat };
  return { action: 'poser', plat: Math.max(-1, ...repas.map((c) => c.plat)) + 1 };
}
