import { describe, expect, it } from 'vitest';
import { chercher, couleurDe, resume, versTexte, type Recette } from '../src/lib/carnet';
import { parseIngredients } from '../src/lib/ingredients';

const r = (o: Partial<Recette>): Recette => ({
  id: 'x', type: 'main', nom: '', mots_cles: '', lien: null, cle_lien: null, portions: 1,
  ingredients: [], etapes: '', couleur: null, categories: [], ajoutee_par: null, creee_le: '', ...o,
});

describe('chercher', () => {
  const carnet = [
    r({ id: '1', type: 'insta', nom: 'Ravioles ricotta', mots_cles: 'ravioles ricotta' }),
    r({ id: '2', nom: 'Gratin', ingredients: parseIngredients('1 kg pommes de terre, 20 cl crème'), categories: ['Légumes'] }),
    r({ id: '3', nom: 'Crêpes', categories: ['Dessert'] }),
  ];
  const ids = (l: Recette[]) => l.map((x) => x.id);

  it('pluriel, accents, majuscules', () => {
    expect(ids(chercher(carnet, 'raviole'))).toEqual(['1']);
    expect(ids(chercher(carnet, 'CREPE'))).toEqual(['3']);
  });
  it('cherche aussi dans les ingrédients', () => expect(ids(chercher(carnet, 'creme'))).toEqual(['2']));
  it('tous les mots doivent être trouvés', () => expect(ids(chercher(carnet, 'gratin crepe'))).toEqual([]));
  it('champ vide : tout', () => expect(chercher(carnet, '  ')).toHaveLength(3));
  it('filtre par catégorie', () => expect(ids(chercher(carnet, '', 'Dessert'))).toEqual(['3']));
});

describe('carte', () => {
  it('couleur stable, ou celle choisie', () => {
    expect(couleurDe({ id: 'abc', couleur: null })).toBe(couleurDe({ id: 'abc', couleur: null }));
    expect(couleurDe({ id: 'abc', couleur: '#000000' })).toBe('#000000');
  });
  it('résumé', () => {
    expect(resume(r({ type: 'insta' }))).toBe('Vidéo Insta · ingrédients à ajouter');
    expect(resume(r({ type: 'web', ingredients: parseIngredients('sel') }))).toBe('Site web · 1 ingrédient');
  });
});

describe('versTexte', () => {
  it('aller-retour pour 4 personnes', () => {
    const ing = parseIngredients('500 g ricotta, 2 œufs, sel', 4);
    const texte = versTexte(ing, 4);
    expect(texte).toBe('500 g ricotta\n2 œufs\nsel');
    expect(parseIngredients(texte, 4)).toEqual(ing);
  });
});
