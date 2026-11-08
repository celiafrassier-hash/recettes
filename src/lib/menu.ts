// Lignes Supabase du menu et des courses (voir supabase/menu.sql). `semaine` = lundi au format AAAA-MM-JJ.
export type Moment = 'midi' | 'soir';
export type CaseLigne = { semaine: string; jour: number; moment: Moment; recette: string | null; plaisir: boolean; personnes: number; note?: string | null };
export type AjLigne = { semaine: string; cle: string; coche: boolean; retire: boolean; qty: number | null; ajoute: boolean; nom: string | null; unite: string | null };
export type Choix = { recette: string | 'plaisir'; personnes: number };

export const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
export const JOURS_LONGS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Toucher une case : la remplit avec le choix, ou la vide si elle contient déjà ce choix (ou si rien n'est choisi).
export function toucher(actuelle: CaseLigne | undefined, choix: Choix | null): 'vider' | 'remplir' | 'rien' {
  const meme = actuelle && choix && (choix.recette === 'plaisir' ? actuelle.plaisir : actuelle.recette === choix.recette && actuelle.personnes === choix.personnes);
  if (actuelle && (!choix || meme)) return 'vider';
  return choix ? 'remplir' : 'rien';
}
