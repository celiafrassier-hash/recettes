import { afficherQty } from './courses';
import type { Ingredient } from './ingredients';
import { norm } from './texte';

// Formes des lignes Supabase (voir supabase/schema.sql).
export type Membre = { id: string; prenom: string; initiale: string };
export type Recette = {
  id: string;
  type: 'insta' | 'web' | 'main';
  nom: string;
  mots_cles: string;
  lien: string | null;
  cle_lien: string | null;
  portions: number;
  ingredients: Ingredient[];
  etapes: string;
  couleur: string | null;
  categories: string[];
  ajoutee_par: string | null;
  creee_le: string;
};
export type Statut = { recette: string; membre: string; valeur: 'a_tester' | 'deja_faite' };

export const CATEGORIES = ['Poulet', 'Viande', 'Poisson', 'Légumes', 'Pâtes & riz', 'Végé', 'Salade', 'Soupe', 'Dessert', 'Petit-déj'];
const COULEURS = ['#CFE3D4', '#BFDCEB', '#F6E7C8', '#F4E1A6', '#F2C6D6', '#F6C9B8', '#FFF1E6'];

// Couleur de la carte : choisie une fois pour toutes à partir de l'identifiant.
export function couleurDe(r: Pick<Recette, 'id' | 'couleur'>): string {
  if (r.couleur) return r.couleur;
  let h = 0;
  for (const c of r.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS[h % COULEURS.length];
}

// Recherche dans nom, mots-clés et ingrédients ; ignore accents, majuscules, pluriel simple. Tous les mots doivent être trouvés.
export function chercher(recettes: Recette[], q: string, categorie = ''): Recette[] {
  const mots = norm(q).split(' ').filter(Boolean);
  return recettes.filter((r) => {
    if (categorie && !r.categories.includes(categorie)) return false;
    const texte = norm([r.nom, r.mots_cles, ...r.ingredients.map((i) => i.name)].join(' '));
    return mots.every((m) => texte.includes(m));
  });
}

export function resume(r: Recette): string {
  const n = r.ingredients.length;
  if (!n) return r.type === 'insta' ? 'Vidéo Insta · ingrédients à ajouter' : r.type === 'web' ? 'Site web · ingrédients à ajouter' : 'Ingrédients à ajouter';
  return `${r.type === 'insta' ? 'Vidéo Insta · ' : r.type === 'web' ? 'Site web · ' : ''}${n} ingrédient${n > 1 ? 's' : ''}`;
}

// Ingrédients (ramenés à 1 personne) → texte modifiable pour `pour` personnes, une ligne chacun.
export function versTexte(ing: Ingredient[], pour: number): string {
  return ing.map((i) => [afficherQty(i.qty * pour, i.unit, i.name), i.name].filter(Boolean).join(' ')).join('\n');
}
