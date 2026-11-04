import { infoAliment, rayonDe, type Rayon } from './aliments';
import type { Ingredient } from './ingredients';
import { norm } from './texte';

export type RecetteCourses = { id: string; name: string; ing: Ingredient[] };
// Une case de menu : une recette (ou « plaisir ») pour n personnes.
export type CaseMenu = { recette: string | 'plaisir'; personnes: number };
// Ce que l'utilisatrice a fait sur une ligne ; jamais écrasé quand le menu change.
export type Ajustement = { coche?: boolean; retire?: boolean; qty?: number };

export type Ligne = { cle: string; name: string; qty: number; unit: string; rayon: Rayon; coche: boolean };

export const cleLigne = (name: string, unit: string) => norm(name) + '|' + unit;

export function portions(cases: CaseMenu[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const c of cases) {
    if (c.recette === 'plaisir') continue;
    out.set(c.recette, (out.get(c.recette) ?? 0) + c.personnes);
  }
  return out;
}

export function listeCourses(
  cases: CaseMenu[],
  recettes: Map<string, RecetteCourses>,
  ajustements: Record<string, Ajustement> = {},
  seulement?: string, // filtre « toucher un plat »
): { lignes: Ligne[]; sansIngredients: string[] } {
  const par = portions(cases);
  const lignes = new Map<string, Ligne>();
  const sansIngredients: string[] = [];
  for (const [id, n] of par) {
    if (seulement && id !== seulement) continue;
    const r = recettes.get(id);
    if (!r) continue;
    if (!r.ing.length) sansIngredients.push(id);
    for (const i of r.ing) {
      const cle = cleLigne(i.name, i.unit);
      const l = lignes.get(cle) ?? { cle, name: i.name, qty: 0, unit: i.unit, rayon: rayonDe(i.name), coche: false };
      l.qty += i.qty * n;
      lignes.set(cle, l);
    }
  }
  const out: Ligne[] = [];
  for (const l of lignes.values()) {
    const a = ajustements[l.cle];
    if (a?.retire) continue;
    out.push({ ...l, qty: a?.qty ?? l.qty, coche: !!a?.coche });
  }
  return { lignes: out, sansIngredients };
}

function nombre(n: number): string {
  const frac: Record<string, string> = { '0.25': '1/4', '0.5': '1/2', '0.75': '3/4' };
  if (frac[String(n)]) return frac[String(n)];
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

// Affichage : g → kg, cl → l, ce qui se compte arrondi au-dessus (pas de « 1,5 œuf »).
export function afficherQty(q: number, unit: string, name = ''): string {
  if (!q) return '';
  if (unit === 'g' && q >= 1000) return nombre(q / 1000) + ' kg';
  if (unit === 'cl' && q >= 100) return nombre(q / 100) + ' l';
  if (unit === 'pièce') return infoAliment(name)?.compte === false ? nombre(q) : String(Math.ceil(q - 1e-9));
  if (unit === 'gousse' || unit === 'tranche') {
    const g = Math.ceil(q - 1e-9);
    return `${g} ${unit}${g > 1 ? 's' : ''}`;
  }
  return nombre(q) + ' ' + unit;
}
