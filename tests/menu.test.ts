import { describe, expect, it } from 'vitest';
import { toucher, type CaseLigne } from '../src/lib/menu';

const c = (o: Partial<CaseLigne>): CaseLigne => ({ semaine: '2026-11-02', jour: 0, moment: 'midi', plat: 0, recette: 'r1', plaisir: false, personnes: 1, ...o });

describe('toucher un repas', () => {
  it('repas vide + recette choisie : premier plat', () => expect(toucher([], { recette: 'r1', personnes: 1 })).toEqual({ action: 'poser', plat: 0 }));
  it('retoucher avec le même choix : retirer ce plat', () => expect(toucher([c({ plat: 1 })], { recette: 'r1', personnes: 1 })).toEqual({ action: 'retirer', plat: 1 }));
  it('autre recette : plat en plus (poulet + purée)', () => expect(toucher([c({})], { recette: 'r2', personnes: 1 })).toEqual({ action: 'poser', plat: 1 }));
  it('après un plat retiré, le numéro suivant ne réutilise pas un plat pris', () =>
    expect(toucher([c({ plat: 2 })], { recette: 'r2', personnes: 1 })).toEqual({ action: 'poser', plat: 3 }));
  it('même recette pour 4 : remplacer ce plat', () => expect(toucher([c({})], { recette: 'r1', personnes: 4 })).toEqual({ action: 'poser', plat: 0 }));
  it('rien de choisi : vider un repas plein, rien sur un vide', () => {
    expect(toucher([c({}), c({ plat: 1, recette: 'r2' })], null)).toEqual({ action: 'vider' });
    expect(toucher([], null)).toEqual({ action: 'rien' });
  });
  it('plaisir', () => expect(toucher([c({ recette: null, plaisir: true })], { recette: 'plaisir', personnes: 1 })).toEqual({ action: 'retirer', plat: 0 }));
});
