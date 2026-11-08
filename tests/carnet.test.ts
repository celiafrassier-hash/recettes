import { describe, expect, it } from 'vitest';
import { chercher, couleurDe, deplacer, resume, toutesCategories, versTexte, type Recette } from '../src/lib/carnet';
import { parseIngredients } from '../src/lib/ingredients';

const r = (o: Partial<Recette>): Recette => ({
  id: 'x', type: 'main', nom: '', mots_cles: '', lien: null, cle_lien: null, portions: 1,
  ingredients: [], etapes: '', couleur: null, photo: null, categories: [], ajoutee_par: null, creee_le: '', ...o,
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

describe('photo', () => {
  it('réduite à 1000 px en gardant les proportions, jamais agrandie', async () => {
    const { taille } = await import('../src/lib/photo');
    expect(taille(4000, 3000)).toEqual({ l: 1000, h: 750 });
    expect(taille(3000, 4000)).toEqual({ l: 750, h: 1000 });
    expect(taille(800, 600)).toEqual({ l: 800, h: 600 });
  });
});

describe('ordre et catégories', () => {
  it('monter, descendre, rien au bord', () => {
    expect(deplacer(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(deplacer(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(deplacer(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(deplacer(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });
  it('catégories ajoutées à la main, après celles de base, sans doublon', () => {
    const l = toutesCategories([r({ categories: ['Apéro', 'Poulet'] }), r({ id: 'x', categories: ['Apéro', 'Batch'] })]);
    expect(l.slice(-2)).toEqual(['Apéro', 'Batch']);
    expect(l.filter((c) => c === 'Poulet')).toHaveLength(1);
    expect(toutesCategories([], ['Apéro', 'Poulet']).filter((c) => c === 'Apéro' || c === 'Poulet')).toEqual(['Poulet', 'Apéro']);
  });
});
