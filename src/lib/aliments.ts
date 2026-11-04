import { norm } from './texte.ts';

export type Rayon = 'fl' | 'cr' | 'po' | 'ep' | 'su' | 'autre';

export const RAYONS: Record<Rayon, string> = {
  fl: 'Fruits & légumes',
  cr: 'Crèmerie',
  po: 'Poisson & viande',
  ep: 'Épicerie',
  su: 'Surgelés',
  autre: 'Autre',
};

export type InfoAliment = { rayon: Rayon; compte: boolean };

// [noms séparés par |, rayon, se compte à la pièce ?]
// shortcut: ~110 aliments courants ; en ajouter quand un aliment fréquent tombe dans « Autre ».
const TABLE: [string, Rayon, boolean][] = [
  ['tomate|tomate cerise|oignon|oignon rouge|echalote|ail|gousse d ail|citron|citron vert|orange|pomme|poire|banane|avocat|concombre|courgette|aubergine|poivron|carotte|poireau|navet|radis|betterave|patate douce|butternut|potiron|potimarron|chou|chou fleur|brocoli|fenouil|artichaut|mangue|ananas|kiwi|clementine|pamplemousse|piment', 'fl', true],
  ['pomme de terre|patate|epinard|salade|laitue|roquette|mache|champignon|haricot vert|petit poi|persil|coriandre|basilic|menthe|ciboulette|aneth|thym|romarin|gingembre|fraise|framboise|myrtille|raisin|cerise|pousse d epinard|chou rouge|celeri', 'fl', false],
  ['oeuf', 'cr', true],
  ['lait|creme|creme fraiche|creme liquide|beurre|yaourt|yaourt grec|fromage|fromage rape|gruyere|emmental|comte|parmesan|mozzarella|burrata|ricotta|feta|chevre|mascarpone|cheddar|fromage blanc|skyr|lardon|jambon|bacon|lait de coco', 'cr', false],
  ['steak|steak hache|escalope', 'po', true],
  ['poulet|blanc de poulet|cuisse de poulet|dinde|boeuf|viande hachee|porc|veau|agneau|saucisse|chorizo|merguez|saumon|thon|cabillaud|colin|crevette|moule|calamar|poisson|sardine|truite', 'po', false],
  ['pate|spaghetti|tagliatelle|penne|riz|riz basmati|semoule|quinoa|boulgour|lentille|pois chiche|haricot rouge|farine|sucre|sucre roux|sel|poivre|huile|huile d olive|vinaigre|vinaigre balsamique|moutarde|ketchup|mayonnaise|sauce soja|sauce tomate|concentre de tomate|coulis de tomate|tomate concassee|bouillon|cube de bouillon|curry|pate de curry|paprika|cumin|curcuma|cannelle|levure|chocolat|chocolat noir|cacao|miel|confiture|amande|noix|noisette|cacahuete|graine de sesame|chapelure|pain|baguette|pain de mie|tortilla|wrap|galette|pate feuilletee|pate brisee|ravioli|raviole|gnocchi|nouille|vermicelle|sirop d erable|vanille|maizena|levure chimique|lait d amande|olive|capre|cornichon', 'ep', false],
  ['petits poi surgele|epinard surgele|frite', 'su', false],
];

const INDEX = new Map<string, InfoAliment>();
for (const [noms, rayon, compte] of TABLE) {
  for (const n of noms.split('|')) INDEX.set(norm(n), { rayon, compte });
}

// Cherche l'aliment exact, puis le plus long nom connu contenu dans le texte (« 2 blancs de poulet fermier » → poulet).
export function infoAliment(nom: string): InfoAliment | undefined {
  const n = norm(nom);
  const exact = INDEX.get(n);
  if (exact) return exact;
  let best: string | undefined;
  for (const key of INDEX.keys()) {
    if ((' ' + n + ' ').includes(' ' + key + ' ') && (!best || key.length > best.length)) best = key;
  }
  return best ? INDEX.get(best) : undefined;
}

export function rayonDe(nom: string): Rayon {
  return infoAliment(nom)?.rayon ?? 'autre';
}
