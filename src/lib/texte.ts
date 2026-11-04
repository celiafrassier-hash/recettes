// Mise au propre d'un texte pour comparer : minuscules, sans accents, œ → oe, pluriel simple retiré.
// Sert à la recherche ET au regroupement des courses (« oignons » = « Oignon »).
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 ? w.replace(/(s|x)$/, '') : w))
    .join(' ');
}
