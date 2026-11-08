import { describe, expect, it } from 'vitest';
import { afficherQty, cleLigne, ingredientsNote, listeCourses, type RecetteCourses } from '../src/lib/courses';
import { parseIngredients } from '../src/lib/ingredients';

const recettes = new Map<string, RecetteCourses>([
  ['curry', { id: 'curry', name: 'Curry', ing: parseIngredients('600 g crevettes, 40 cl lait de coco, 2 citrons verts', 4) }],
  ['gratin', { id: 'gratin', name: 'Gratin', ing: parseIngredients('250 g pommes de terre, 2 oignons', 1) }],
  ['soupe', { id: 'soupe', name: 'Soupe', ing: parseIngredients('1 oignon', 1) }],
  ['insta', { id: 'insta', name: 'Ravioles', ing: [] }],
]);

describe('liste de courses', () => {
  it('quantités ajustées aux portions (recette pour 4, mangée 3 fois)', () => {
    const { lignes } = listeCourses([{ recette: 'curry', personnes: 3 }], recettes);
    const crevettes = lignes.find((l) => l.name === 'crevettes')!;
    expect(crevettes.qty).toBe(450);
    expect(afficherQty(crevettes.qty, crevettes.unit, crevettes.name)).toBe('450 g');
  });
  it('regroupe oignon / oignons', () => {
    const { lignes } = listeCourses([{ recette: 'gratin', personnes: 1 }, { recette: 'soupe', personnes: 1 }], recettes);
    const oignons = lignes.filter((l) => l.rayon === 'fl' && l.name.startsWith('oignon'));
    expect(oignons).toHaveLength(1);
    expect(oignons[0].qty).toBe(3);
  });
  it('case Plaisir exclue, recette sans ingrédients signalée', () => {
    const r = listeCourses([{ recette: 'plaisir', personnes: 1 }, { recette: 'insta', personnes: 1 }], recettes);
    expect(r.lignes).toHaveLength(0);
    expect(r.sansIngredients).toEqual(['insta']);
  });
  it('coches et articles retirés gardés quand le menu change', () => {
    const aj = { [cleLigne('crevettes', 'g')]: { coche: true }, [cleLigne('lait de coco', 'cl')]: { retire: true } };
    const avant = listeCourses([{ recette: 'curry', personnes: 2 }], recettes, aj);
    const apres = listeCourses([{ recette: 'curry', personnes: 4 }, { recette: 'gratin', personnes: 1 }], recettes, aj);
    for (const r of [avant, apres]) {
      expect(r.lignes.find((l) => l.name === 'crevettes')!.coche).toBe(true);
      expect(r.lignes.find((l) => l.name === 'lait de coco')).toBeUndefined();
    }
  });
  it('filtre sur un plat', () => {
    const { lignes } = listeCourses([{ recette: 'curry', personnes: 1 }, { recette: 'gratin', personnes: 1 }], recettes, {}, 'gratin');
    expect(lignes.map((l) => l.name).sort()).toEqual(['oignons', 'pommes de terre']);
  });
  it('sel, poivre et huile jamais dans la liste', () => {
    const m = new Map([['p', { id: 'p', name: 'Pâtes', ing: parseIngredients('200 g pâtes, sel, poivre, 2 c. à soupe huile d’olive, 1 c. à soupe vinaigre', 1) }]]);
    expect(listeCourses([{ recette: 'p', personnes: 1 }], m).lignes.map((l) => l.name)).toEqual(['pâtes', 'vinaigre']);
  });
  it('article ajouté à la main : gardé, corrigeable, retirable', () => {
    const aj = { [cleLigne('pain', 'pièce')]: { ajoute: true, nom: 'pain', unite: 'pièce', qty: 2 } };
    const { lignes } = listeCourses([], recettes, aj);
    expect(lignes).toEqual([{ cle: cleLigne('pain', 'pièce'), name: 'pain', qty: 2, unit: 'pièce', rayon: 'ep', coche: false }]);
    expect(listeCourses([], recettes, { [cleLigne('pain', 'pièce')]: { ...aj[cleLigne('pain', 'pièce')], retire: true } }).lignes).toHaveLength(0);
  });
  it('affichage : kg, l, arrondi des pièces', () => {
    expect(afficherQty(1500, 'g')).toBe('1,5 kg');
    expect(afficherQty(150, 'cl')).toBe('1,5 l');
    expect(afficherQty(1.5, 'pièce', 'œufs')).toBe('2');
    expect(afficherQty(0.5, 'gousse')).toBe('1 gousse');
    expect(afficherQty(0, '')).toBe('');
  });
});

describe('note du repas', () => {
  it('« + » ajouté aux courses, « sans » ignoré', () => {
    expect(ingredientsNote('+ 200 g haricots verts, sans riz').map((i) => [i.name, i.qty, i.unit])).toEqual([['haricots verts', 200, 'g']]);
  });
  it('quantité de la note ajoutée telle quelle, même filtrée par plat', () => {
    const cases = [{ recette: 'gratin', personnes: 2, note: '+ 1 oignon' }];
    const oignons = (s?: string) => listeCourses(cases, recettes, {}, s).lignes.find((l) => l.name.startsWith('oignon'))!.qty;
    expect(oignons()).toBe(5);
    expect(oignons('gratin')).toBe(5);
  });
});
