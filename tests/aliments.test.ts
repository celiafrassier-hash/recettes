import { describe, expect, it } from 'vitest';
import { rayonDe } from '../src/lib/aliments';

describe('rayons', () => {
  it('jambon cru, lardons : rayon viande, pas crèmerie', () => {
    expect(rayonDe('jambon cru')).toBe('po');
    expect(rayonDe('lardons fumés')).toBe('po');
    expect(rayonDe('crème fraîche')).toBe('cr');
  });
});
