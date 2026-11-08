// Lignes Supabase du menu et des courses (voir supabase/menu.sql). `semaine` = lundi au format AAAA-MM-JJ.
export type Moment = 'midi' | 'soir';
export type CaseLigne = { semaine: string; jour: number; moment: Moment; plat: number; recette: string | null; plaisir: boolean; personnes: number; note?: string | null };
export type AjLigne = { semaine: string; cle: string; coche: boolean; retire: boolean; qty: number | null; ajoute: boolean; nom: string | null; unite: string | null };
export type Choix = { recette: string | 'plaisir'; personnes: number };

export const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Toucher un repas avec le choix l'ajoute, jamais ne l'enlève (on enlève par l'appui long).
// Déjà là : « deja », sauf pour un autre nombre de personnes (on remplace ce plat). `plat` = numéro du plat dans le repas.
export type Geste = { action: 'deja' } | { action: 'poser'; plat: number };
export function toucher(repas: CaseLigne[], choix: Choix): Geste {
  const meme = repas.find((c) => (choix.recette === 'plaisir' ? c.plaisir : c.recette === choix.recette));
  if (meme) return meme.plaisir || meme.personnes === choix.personnes ? { action: 'deja' } : { action: 'poser', plat: meme.plat };
  return { action: 'poser', plat: Math.max(-1, ...repas.map((c) => c.plat)) + 1 };
}

// Repas glissé sur un autre : ses plats rejoignent ceux d'arrivée, à la suite ; les deux notes se mettent bout à bout.
// Renvoie toutes les lignes du repas d'arrivée (à enregistrer), puis on efface celles de départ.
export function reunir(de: CaseLigne[], vers: CaseLigne[], jour: number, moment: Moment): CaseLigne[] {
  const note = [vers[0]?.note, de[0]?.note].filter(Boolean).join(', ').slice(0, 200) || null;
  const base = Math.max(-1, ...vers.map((c) => c.plat)) + 1;
  const deja = (c: CaseLigne) => vers.some((v) => (c.plaisir ? v.plaisir : v.recette === c.recette));
  return [...vers, ...de.filter((c) => !deja(c)).map((c, i) => ({ ...c, jour, moment, plat: base + i }))].map((c) => ({ ...c, note }));
}
