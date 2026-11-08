import { describe, expect, it } from 'vitest';
import { reunir, toucher, type CaseLigne } from '../src/lib/menu';

const c = (o: Partial<CaseLigne>): CaseLigne => ({ semaine: '2026-11-02', jour: 0, moment: 'midi', plat: 0, recette: 'r1', plaisir: false, personnes: 1, ...o });

describe('toucher un repas', () => {
  it('repas vide : premier plat', () => expect(toucher([], { recette: 'r1', personnes: 1 })).toEqual({ action: 'poser', plat: 0 }));
  it('retoucher avec le même choix : rien ne part', () => expect(toucher([c({ plat: 1 })], { recette: 'r1', personnes: 1 })).toEqual({ action: 'deja' }));
  it('autre recette : plat en plus (poulet + purée)', () => expect(toucher([c({})], { recette: 'r2', personnes: 1 })).toEqual({ action: 'poser', plat: 1 }));
  it('le numéro suivant ne réutilise pas un plat pris', () => expect(toucher([c({ plat: 2 })], { recette: 'r2', personnes: 1 })).toEqual({ action: 'poser', plat: 3 }));
  it('même recette pour 4 : remplacer ce plat', () => expect(toucher([c({})], { recette: 'r1', personnes: 4 })).toEqual({ action: 'poser', plat: 0 }));
  it('plaisir déjà là', () => expect(toucher([c({ recette: null, plaisir: true })], { recette: 'plaisir', personnes: 1 })).toEqual({ action: 'deja' }));
});

describe('réunir deux repas', () => {
  it('vers un repas vide : les plats changent juste de place', () =>
    expect(reunir([c({ note: 'sans riz' })], [], 3, 'soir')).toEqual([c({ jour: 3, moment: 'soir', note: 'sans riz' })]));
  it('crêpe glissée sur gyoza : les deux dans le même repas, notes bout à bout', () => {
    const r = reunir([c({ recette: 'crepe', note: '+ sucre' })], [c({ jour: 3, recette: 'gyoza', note: '+ sauce' })], 3, 'midi');
    expect(r.map((x) => [x.recette, x.plat, x.jour, x.note])).toEqual([['gyoza', 0, 3, '+ sauce, + sucre'], ['crepe', 1, 3, '+ sauce, + sucre']]);
  });
  it('la même recette des deux côtés ne se double pas', () => expect(reunir([c({})], [c({ jour: 3 })], 3, 'midi')).toHaveLength(1));
});
