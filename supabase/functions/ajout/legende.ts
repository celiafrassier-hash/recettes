import { infoAliment } from './aliments.ts';
import { parseIngredients, type Ingredient } from './ingredients.ts';

// Légende d'un post Insta → ingrédients et étapes, avec de simples règles (pas d'IA) : rien n'est inventé,
// chaque ligne de la légende est recopiée telle quelle, au pire dans la mauvaise case.

const ENTITES: Record<string, string> = {
  amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', deg: '°', rsquo: '’', lsquo: '‘', hellip: '…', laquo: '«', raquo: '»',
  eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â', ccedil: 'ç', icirc: 'î', iuml: 'ï',
  ocirc: 'ô', ucirc: 'û', ugrave: 'ù', oelig: 'œ', Eacute: 'É', Agrave: 'À', OElig: 'Œ',
};

export function decoderHtml(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (tout, c: string) => {
    if (c[0] === '#') return String.fromCodePoint(c[1].toLowerCase() === 'x' ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10));
    return ENTITES[c] ?? ENTITES[c.toLowerCase()] ?? tout;
  });
}

// Balise « description » d'Insta : « 1,835 likes, 10 comments - compte on March 3, 2026: "LA LÉGENDE" ».
export function legendeDe(description: string): string {
  const s = decoderHtml(description).trim();
  const debut = s.match(/^[^"\n]{0,200}?:\s*"/);
  return debut ? s.slice(debut[0].length).replace(/"\s*\.?\s*$/, '').trim() : s;
}

const TITRE_ING = /^ingr[ée]dients?\b/i;
const TITRE_ETAPES = /^(recette|pr[ée]paration|[ée]tapes?|instructions?|m[ée]thode|cuisson|r[ée]alisation)\b/i;
const sansPuce = (l: string) => l.replace(/^[^\p{L}\p{N}½¼¾]+/u, '').trim();
// Ce qui suit « Titre (pour 2) : », s'il y a quelque chose sur la même ligne.
const apresTitre = (l: string) => l.replace(/^[^:]*:?/, '').trim();
// Une vraie phrase (≥ 6 mots, finit par . ! ?) n'est pas un ingrédient : on passe aux étapes.
const phrase = (l: string) => /[.!?]$/.test(l) && l.split(/\s+/).length >= 6;
// Ligne faite seulement de #mots-clés ou de @comptes.
const tags = (l: string) => /^([#@]\S+\s*)+$/.test(l);

// Sans titre « Ingrédients » : une ligne qui commence par une quantité (« 200 g de farine », « ½ citron »),
// mais pas une étape numérotée (« 1. Couper ») ni une durée (« 10 min au four »).
const quantite = (l: string) =>
  /^(\d|½|¼|¾)/.test(l) && !/^\d+\s*[.)/-]\s*\p{L}/u.test(l) && !/^\d+\s*(min|minutes?|h|heures?|secondes?|°)(?![\p{L}])/iu.test(l) && !phrase(l);
// Une fois dans la liste : aussi « Ciboulette », « Sel, poivre » (aliment connu, ligne courte).
const ingredientSeul = (l: string) => quantite(l) || (!phrase(l) && l.split(/\s+/).length <= 5 && !!infoAliment(l.split(',')[0]));
const POUR = /^pour\s+(\d+)\s*(pers|part|portion)/i;

export type Decoupe = { ingredients: Ingredient[]; etapes: string; portions: number };

export function decouper(legende: string, portionsParDefaut = 4): Decoupe {
  const lignes = legende.split(/\r?\n/).filter((l) => !tags(l.trim())).map(sansPuce).filter(Boolean);
  const aDesTitres = lignes.some((l) => TITRE_ING.test(l) || TITRE_ETAPES.test(l));
  // Avant « Ingrédients », un « Recette … » est souvent le titre du post, pas le début des étapes.
  const aDesIng = lignes.some((l) => TITRE_ING.test(l));
  // Pas de titre « Ingrédients » mais au moins 2 lignes avec une quantité : on repère la liste toute seule.
  // La 1re ligne est le titre du post (« 3 idées de bowls »), jamais un ingrédient.
  const devine = !aDesIng && lignes.slice(1).filter(quantite).length >= 2;
  let etat: 'avant' | 'ing' | 'etapes' = aDesTitres || devine ? 'avant' : 'etapes';
  const ing: string[] = [];
  const etapes: string[] = [];
  let portions = portionsParDefaut;

  for (const [i, l] of lignes.entries()) {
    if (etat !== 'etapes' && POUR.test(l)) {
      portions = Number(l.match(POUR)![1]) || portions;
    } else if (etat === 'ing' && /:$/.test(l) && !TITRE_ETAPES.test(l)) {
      // sous-titre seul (« Pour la sauce : ») : ce n'est pas un ingrédient
    } else if (devine && etat === 'avant' && i > 0 && quantite(l)) {
      etat = 'ing';
      ing.push(l);
    } else if (devine && etat === 'ing' && !TITRE_ETAPES.test(l)) {
      if (ingredientSeul(l)) ing.push(l);
      else {
        etat = 'etapes';
        etapes.push(l);
      }
    } else if (devine && etat === 'avant' && !aDesTitres) {
      etapes.push(l); // intro du post : gardée, comme avant
    } else if (TITRE_ING.test(l) && etat !== 'ing') {
      etat = 'ing';
      const pour = l.match(/pour\s+(\d+)/i);
      if (pour && Number(pour[1]) > 0) portions = Number(pour[1]);
      const reste = l.includes(':') ? apresTitre(l) : '';
      if (reste) ing.push(reste);
    } else if (TITRE_ETAPES.test(l) && (etat !== 'avant' || !aDesIng)) {
      etat = 'etapes';
      const reste = l.includes(':') ? apresTitre(l) : '';
      if (reste) etapes.push(reste);
    } else if (etat === 'ing' && phrase(l)) {
      etat = 'etapes';
      etapes.push(l);
    } else if (etat === 'ing') {
      ing.push(l);
    } else if (etat === 'etapes') {
      etapes.push(l);
    }
  }

  // « Tartinade : framboises, 1 càs chia » → on garde ce qui suit le sous-titre ; les @comptes sont retirés.
  const texteIng = ing
    .map((l) => (/^[^:\d]{1,40}:\s*\S/.test(l) ? apresTitre(l) : l).replace(/@[\w.]+/g, '').replace(/\s+([,;])/g, '$1').trim())
    .join('\n');
  return { ingredients: parseIngredients(texteIng, portions), etapes: etapes.join('\n'), portions };
}
