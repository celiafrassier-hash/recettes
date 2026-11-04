import { describe, expect, it } from 'vitest';
import { cleSemaine, libelleSemaine, lundiDe, semaineParDefaut } from '../src/lib/semaines';
import { norm } from '../src/lib/texte';

describe('semaines', () => {
  it('un mardi ouvre la semaine en cours', () => {
    expect(cleSemaine(semaineParDefaut(new Date(2026, 10, 3)))).toBe('2026-11-02');
  });
  it('le dimanche ouvre la semaine suivante', () => {
    expect(cleSemaine(semaineParDefaut(new Date(2026, 10, 8)))).toBe('2026-11-09');
  });
  it('libellé, y compris à cheval sur 2 mois', () => {
    expect(libelleSemaine(lundiDe(new Date(2026, 10, 3)))).toBe('2 – 8 nov.');
    expect(libelleSemaine(lundiDe(new Date(2026, 10, 30)))).toBe('30 nov. – 6 déc.');
  });
});

describe('recherche', () => {
  it('ignore accents, majuscules, pluriel', () => {
    expect(norm('Ravioles Épinards')).toBe(norm('raviole epinard'));
    expect(norm('Œufs')).toBe('oeuf');
  });
});
