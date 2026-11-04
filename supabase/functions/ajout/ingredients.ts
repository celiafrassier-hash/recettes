import { infoAliment } from './aliments.ts';

// Quantité ramenée à 1 personne, dans une unité de base (g, cl, càs, càc, pièce…). qty 0 = « sel » sans quantité.
export type Ingredient = { name: string; qty: number; unit: string };

const UNITS: Record<string, [string, number]> = {
  kg: ['g', 1000], g: ['g', 1], gr: ['g', 1], gramme: ['g', 1],
  l: ['cl', 100], litre: ['cl', 100], dl: ['cl', 10], cl: ['cl', 1], ml: ['cl', 0.1],
  'c. à soupe': ['càs', 1], 'c à soupe': ['càs', 1], 'cuillère à soupe': ['càs', 1], 'cuillere a soupe': ['càs', 1], càs: ['càs', 1], cas: ['càs', 1], cs: ['càs', 1],
  'c. à café': ['càc', 1], 'c à café': ['càc', 1], 'cuillère à café': ['càc', 1], 'cuillere a cafe': ['càc', 1], càc: ['càc', 1], cac: ['càc', 1], cc: ['càc', 1],
  pincée: ['pincée', 1], pincee: ['pincée', 1], paquet: ['paquet', 1], sachet: ['sachet', 1], boîte: ['boîte', 1], boite: ['boîte', 1],
  gousse: ['gousse', 1], tranche: ['tranche', 1], botte: ['botte', 1], pot: ['pot', 1], verre: ['verre', 1], brin: ['brin', 1],
};
const esc = (u: string) => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UNIT_RE = new RegExp(
  '^(' + Object.keys(UNITS).sort((a, b) => b.length - a.length).map(esc).join('|') + ')(s|x)?(?![\\p{L}])\\.?\\s*',
  'iu',
);
const NUM_RE = /^(\d+\/\d+|\d+(?:[.,]\d+)?|½|¼|¾)(?:\s*(?:-|à)\s*(\d+(?:[.,]\d+)?))?\s*/;
const FRAC: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75 };

function toNum(s: string): number {
  if (FRAC[s] !== undefined) return FRAC[s];
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    return b ? a / b : 0;
  }
  return parseFloat(s.replace(',', '.'));
}

export function parseLine(raw: string, pour = 1): Ingredient | null {
  let line = raw.trim().replace(/^[-•*·–—]+\s*/, '');
  if (!line) return null;
  let qty = 0;
  let unit = '';
  const m = line.match(NUM_RE);
  if (m) {
    qty = toNum(m[1]);
    if (m[2]) qty = (qty + toNum(m[2])) / 2; // « 2-3 » → 2,5
    line = line.slice(m[0].length);
    const u = line.match(UNIT_RE);
    if (u) {
      const [base, factor] = UNITS[u[1].toLowerCase()];
      unit = base;
      qty *= factor;
      line = line.slice(u[0].length);
    } else {
      unit = 'pièce';
    }
  }
  const name = line.replace(/^(de |d’|d'|des )/i, '').trim();
  if (!name) return null;
  return { name, qty: qty / (pour || 1), unit };
}

// Sépare sur retour à la ligne ou virgule, SAUF virgule décimale (« 1,5 kg »).
export function parseIngredients(text: string, pour = 1): Ingredient[] {
  return text
    .split(/\n|,(?!\d)/)
    .map((s) => parseLine(s, pour))
    .filter((x): x is Ingredient => x !== null);
}

// « 1,5 patates » : nombre sans unité sur un aliment qui ne se compte pas → à vérifier (orange).
export function aVerifier(ing: Ingredient, pour = 1): boolean {
  if (ing.unit !== 'pièce') return false;
  const info = infoAliment(ing.name);
  if (info) return !info.compte;
  return !Number.isInteger(Math.round(ing.qty * pour * 1000) / 1000);
}
