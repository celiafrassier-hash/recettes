import { describe, expect, it } from 'vitest';
import { lireFicheWeb } from '../src/lib/web';

const page = (json: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head><body>…</body></html>`;

describe('lireFicheWeb', () => {
  it('fiche Recipe dans un @graph (WordPress), étapes HowToStep, portions « 4 personnes »', () => {
    const r = lireFicheWeb(page({ '@context': 'https://schema.org', '@graph': [
      { '@type': 'WebPage', name: 'x' },
      { '@type': ['Recipe'], name: 'Crêpes', recipeYield: ['4', '4 personnes'], image: { '@type': 'ImageObject', url: 'https://site.fr/crepes.jpg' },
        recipeIngredient: ['250 g de farine, tamisée', '4 œufs', '50 cl de lait'],
        recipeInstructions: [{ '@type': 'HowToStep', text: 'Mélanger la farine et les œufs.' }, { '@type': 'HowToStep', text: '<p>Ajouter le lait.</p>' }] },
    ] }));
    expect(r).toEqual({
      portions: 4,
      image: 'https://site.fr/crepes.jpg',
      ingredients: [
        { name: 'farine, tamisée', qty: 62.5, unit: 'g' },
        { name: 'œufs', qty: 1, unit: 'pièce' },
        { name: 'lait', qty: 12.5, unit: 'cl' },
      ],
      etapes: 'Mélanger la farine et les œufs.\nAjouter le lait.',
    });
  });

  it('sections HowToSection et étapes en un seul texte', () => {
    const r = lireFicheWeb(page({ '@type': 'Recipe', recipeYield: 2, recipeIngredient: ['1 oignon'],
      recipeInstructions: [{ '@type': 'HowToSection', name: 'La sauce', itemListElement: [{ '@type': 'HowToStep', text: 'Émincer.' }] }] }));
    expect(r?.portions).toBe(2);
    expect(r?.etapes).toBe('La sauce :\nÉmincer.');
  });

  it('page sans fiche ou JSON cassé : rien', () => {
    expect(lireFicheWeb('<html><script type="application/ld+json">{oups</script></html>')).toBeNull();
    expect(lireFicheWeb(page({ '@type': 'Article', name: 'x' }))).toBeNull();
  });
});

it('accents en entités (&eacute;) et « 2 cuillères à soupe », « 1 c à c »', () => {
  const r = lireFicheWeb(page({ '@type': 'Recipe', recipeYield: '1', recipeIngredient: ["2 cuillères à soupe d'huile", '1 c à c de curcuma'], recipeInstructions: 'Pr&eacute;chauffer &agrave; 180&deg;C.' }));
  expect(r?.ingredients).toEqual([{ name: 'huile', qty: 2, unit: 'càs' }, { name: 'curcuma', qty: 1, unit: 'càc' }]);
  expect(r?.etapes).toBe('Préchauffer à 180°C.');
});
