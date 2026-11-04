import { describe, expect, it } from 'vitest';
import { aVerifier, parseIngredients, parseLine } from '../src/lib/ingredients';

describe('découpage des ingrédients', () => {
  it('virgule décimale et kg', () => {
    expect(parseLine('1,5 kg patates')).toEqual({ name: 'patates', qty: 1500, unit: 'g' });
  });
  it('sépare sur virgule mais pas dans « 1,5 »', () => {
    expect(parseIngredients('1,5 kg patates, 20 cl crème, gruyère').map((i) => i.name)).toEqual(['patates', 'crème', 'gruyère']);
  });
  it('fractions et fourchettes', () => {
    expect(parseLine('½ citron')?.qty).toBe(0.5);
    expect(parseLine('1/2 citron')?.qty).toBe(0.5);
    expect(parseLine('2-3 tomates')?.qty).toBe(2.5);
  });
  it('cuillères, pincée, gousse', () => {
    expect(parseLine("2 c. à soupe d'huile")).toEqual({ name: 'huile', qty: 2, unit: 'càs' });
    expect(parseLine('1 c. à café de curry')).toEqual({ name: 'curry', qty: 1, unit: 'càc' });
    expect(parseLine('1 pincée de sel')).toEqual({ name: 'sel', qty: 1, unit: 'pincée' });
    expect(parseLine("2 gousses d'ail")).toEqual({ name: 'ail', qty: 2, unit: 'gousse' });
  });
  it('sans quantité', () => {
    expect(parseLine('sel')).toEqual({ name: 'sel', qty: 0, unit: '' });
  });
  it('marque gardée dans le nom', () => {
    expect(parseLine('10 cl lait de coco Aroy-D')).toEqual({ name: 'lait de coco Aroy-D', qty: 10, unit: 'cl' });
  });
  it('copié-collé : « de », sans espace, puces', () => {
    expect(parseLine('20 cl de crème')).toEqual({ name: 'crème', qty: 20, unit: 'cl' });
    expect(parseLine('200g farine')).toEqual({ name: 'farine', qty: 200, unit: 'g' });
    expect(parseLine('- 2 œufs')).toEqual({ name: 'œufs', qty: 2, unit: 'pièce' });
    expect(parseLine('• sel')).toEqual({ name: 'sel', qty: 0, unit: '' });
  });
  it("une unité n'avale pas le début d'un mot (« 2 grosses tomates »)", () => {
    expect(parseLine('2 grosses tomates')).toEqual({ name: 'grosses tomates', qty: 2, unit: 'pièce' });
  });
  it('ramène à 1 personne', () => {
    expect(parseIngredients('400 g crevettes', 4)[0].qty).toBe(100);
  });
  it('alerte orange : nombre sans unité sur un aliment qui ne se compte pas', () => {
    expect(aVerifier(parseLine('1,5 patates')!)).toBe(true);
    expect(aVerifier(parseLine('2 œufs')!)).toBe(false);
    expect(aVerifier(parseLine('1,5 kg patates')!)).toBe(false);
  });
});
