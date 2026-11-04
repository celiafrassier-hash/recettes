import { describe, expect, it } from 'vitest';
import { decouper, legendeDe } from '../src/lib/legende';

// Légendes inventées, au même format que de vrais posts Insta.
const AVEC_PUCES = `TARTINES AU SAUMON
Ingrédients :
\t•\t1 pavé de saumon (environ 150 g)
\t•\t1/2 avocat
\t•\tCiboulette
\t•\tPain de campagne

👉 Avec ces quantités, tu fais environ 4 tartines.

Cuisson : au four 10 minutes à 180°.

Servir avec un filet de citron.
#recette #facile`;

const SANS_PUCES = `PORRIDGE pomme cannelle 🍎
Publicité - avec @marque

INGRÉDIENTS (pour 2 portions) :
Base : 80 g Flocons d’avoine @marque , 2càs Graines de chia, 300ml Lait

Compotée : 1 pomme, 1càc cannelle

RECETTE :
Mélanger les flocons avec le lait et la chia.
Laisser reposer une nuit au frigo.
#porridge #mealprep`;

describe('legendeDe', () => {
  it('retire « likes, comments - compte on date: " » et décode le HTML', () => {
    const d = '1,835 likes, 10 comments - quelquun on March 3, 2026: &quot;BRICK AU THON\nIngr&#xe9;dients :\n\t&#x2022;\t1 bo&#xee;te de thon&quot;.';
    expect(legendeDe(d)).toBe('BRICK AU THON\nIngrédients :\n\t•\t1 boîte de thon');
  });
  it('laisse un texte sans en-tête tel quel', () => {
    expect(legendeDe('Juste une légende')).toBe('Juste une légende');
  });
});

describe('decouper', () => {
  it('liste à puces + « Cuisson : » sans titre « Étapes »', () => {
    const r = decouper(AVEC_PUCES);
    expect(r.portions).toBe(4);
    expect(r.ingredients.map((i) => i.name)).toEqual(['pavé de saumon (environ 150 g)', 'avocat', 'Ciboulette', 'Pain de campagne']);
    expect(r.ingredients[1]).toEqual({ name: 'avocat', qty: 0.5 / 4, unit: 'pièce' });
    // La phrase « Avec ces quantités… » n'est pas un ingrédient : elle part dans les étapes, comme le reste. Les #tags sont retirés.
    expect(r.etapes).toBe('Avec ces quantités, tu fais environ 4 tartines.\nau four 10 minutes à 180°.\nServir avec un filet de citron.');
  });

  it('titres en majuscules, sous-titres « Base : », portions, @comptes retirés, intro ignorée', () => {
    const r = decouper(SANS_PUCES);
    expect(r.portions).toBe(2);
    expect(r.ingredients).toEqual([
      { name: 'Flocons d’avoine', qty: 40, unit: 'g' },
      { name: 'Graines de chia', qty: 1, unit: 'càs' },
      { name: 'Lait', qty: 15, unit: 'cl' },
      { name: 'pomme', qty: 0.5, unit: 'pièce' },
      { name: 'cannelle', qty: 0.5, unit: 'càc' },
    ]);
    expect(r.etapes).toBe('Mélanger les flocons avec le lait et la chia.\nLaisser reposer une nuit au frigo.');
  });

  it('sans aucun titre : toute la légende va dans les étapes', () => {
    const r = decouper('Mon plat préféré\nFaire revenir les oignons');
    expect(r.ingredients).toEqual([]);
    expect(r.etapes).toBe('Mon plat préféré\nFaire revenir les oignons');
  });

  it('« Recette … » avant « Ingrédients » est un titre, pas des étapes', () => {
    const r = decouper('Recette rapide du soir\nIngrédients :\n- 2 oeufs\nPréparation :\nBattre les oeufs');
    expect(r.ingredients).toEqual([{ name: 'oeufs', qty: 0.5, unit: 'pièce' }]);
    expect(r.etapes).toBe('Battre les oeufs');
  });
});
