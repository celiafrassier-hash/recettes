import { parseLine, type Ingredient } from './ingredients.ts';
import { decoderHtml } from './legende.ts';

// Page d'un site de recettes → ingrédients, étapes, portions, photo.
// Presque tous les sites (Marmiton, 750g, Jow, blogs WordPress…) cachent dans la page une fiche « Recipe »
// (schema.org, en JSON) pour Google : on lit cette fiche, sans deviner dans le texte de la page.
export type FicheWeb = { ingredients: Ingredient[]; etapes: string; portions: number; image: string | null };

type Objet = Record<string, unknown>;
const estObjet = (x: unknown): x is Objet => !!x && typeof x === 'object' && !Array.isArray(x);
const texte = (x: unknown) => (typeof x === 'string' ? decoderHtml(x.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '');

// Cherche l'objet de type Recipe, même rangé dans un tableau ou un « @graph ».
function trouverRecette(x: unknown): Objet | null {
  if (Array.isArray(x)) {
    for (const y of x) {
      const r = trouverRecette(y);
      if (r) return r;
    }
    return null;
  }
  if (!estObjet(x)) return null;
  const type = x['@type'];
  if (type === 'Recipe' || (Array.isArray(type) && type.includes('Recipe'))) return x;
  return trouverRecette(x['@graph']);
}

// Étapes : un texte, une liste de textes, des HowToStep { text } ou des HowToSection { name, itemListElement }.
function etapesDe(x: unknown): string[] {
  if (typeof x === 'string') return texte(x) ? [texte(x)] : [];
  if (Array.isArray(x)) return x.flatMap(etapesDe);
  if (!estObjet(x)) return [];
  if (x.itemListElement) return [...(texte(x.name) ? [texte(x.name) + ' :'] : []), ...etapesDe(x.itemListElement)];
  return etapesDe(x.text ?? x.name);
}

const imageDe = (x: unknown): string | null =>
  typeof x === 'string' ? x : Array.isArray(x) ? imageDe(x[0]) : estObjet(x) ? imageDe(x.url) : null;

export function lireFicheWeb(html: string, portionsParDefaut = 4): FicheWeb | null {
  const blocs = html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, json] of blocs) {
    let r: Objet | null;
    try {
      r = trouverRecette(JSON.parse(json));
    } catch {
      continue;
    }
    if (!r) continue;
    const yieldBrut = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield;
    const portions = Number(String(yieldBrut ?? '').match(/\d+/)?.[0]) || portionsParDefaut;
    // Une case = un ingrédient : pas de découpe sur les virgules (« 200 g de farine, tamisée »).
    const lignes = Array.isArray(r.recipeIngredient) ? r.recipeIngredient : [];
    const ingredients = lignes.map((l) => parseLine(texte(l), portions)).filter((x): x is Ingredient => x !== null);
    const etapes = etapesDe(r.recipeInstructions).join('\n');
    if (!ingredients.length && !etapes) continue;
    return { ingredients, etapes, portions, image: imageDe(r.image) };
  }
  return null;
}
