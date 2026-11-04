/// <reference types="vite/client" />
import { expect, it } from 'vitest';

// La fonction « ajout » (raccourci iPhone + remplissage Insta) garde ses propres copies de fichiers de src/lib
// (elle est déployée à part) : elles doivent rester identiques.
const copies = import.meta.glob('../supabase/functions/ajout/{liens,legende,ingredients,aliments,texte}.ts', { query: '?raw', import: 'default', eager: true });
const originaux = import.meta.glob('../src/lib/{liens,legende,ingredients,aliments,texte}.ts', { query: '?raw', import: 'default', eager: true });
const lf = (s: unknown) => String(s).replace(/\r\n/g, '\n');

it('5 copies dans supabase/functions/ajout', () => expect(Object.keys(copies)).toHaveLength(5));
for (const [chemin, copie] of Object.entries(copies)) {
  const nom = chemin.split('/').pop()!;
  it(`supabase/functions/ajout/${nom} = src/lib/${nom}`, () => {
    expect(lf(copie)).toBe(lf(originaux[`../src/lib/${nom}`]));
  });
}
