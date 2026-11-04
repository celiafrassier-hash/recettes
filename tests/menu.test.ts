import { describe, expect, it } from 'vitest';
import { toucher, type CaseLigne } from '../src/lib/menu';

const c = (o: Partial<CaseLigne>): CaseLigne => ({ semaine: '2026-11-02', jour: 0, moment: 'midi', recette: 'r1', plaisir: false, personnes: 1, ...o });

describe('toucher une case', () => {
  it('case vide + recette choisie : remplir', () => expect(toucher(undefined, { recette: 'r1', personnes: 1 })).toBe('remplir'));
  it('retoucher avec le même choix : vider', () => expect(toucher(c({}), { recette: 'r1', personnes: 1 })).toBe('vider'));
  it('autre recette : remplacer', () => expect(toucher(c({}), { recette: 'r2', personnes: 1 })).toBe('remplir'));
  it('même recette pour 4 : remplacer', () => expect(toucher(c({}), { recette: 'r1', personnes: 4 })).toBe('remplir'));
  it('rien de choisi : vider une case pleine, rien sur une vide', () => {
    expect(toucher(c({}), null)).toBe('vider');
    expect(toucher(undefined, null)).toBe('rien');
  });
  it('plaisir', () => expect(toucher(c({ recette: null, plaisir: true }), { recette: 'plaisir', personnes: 1 })).toBe('vider'));
});
