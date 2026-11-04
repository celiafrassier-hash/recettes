import { describe, expect, it } from 'vitest';
import { cleLien, extraireLien } from '../src/lib/liens';

describe('liens', () => {
  it('même vidéo Insta partagée par deux personnes = même clé', () => {
    const a = cleLien('https://www.instagram.com/reel/C8abc_12/?igsh=MWQ1ZGUxMzBkMA==');
    const b = cleLien('https://instagram.com/p/C8abc_12?igsh=autre');
    expect(a).toBe('instagram:C8abc_12');
    expect(b).toBe(a);
  });
  it('lien web : traceurs et / final retirés, https ajouté', () => {
    expect(cleLien('marmiton.org/recettes/crepes/?utm_source=x')).toBe('marmiton.org/recettes/crepes');
    expect(cleLien('https://www.marmiton.org/recettes/crepes')).toBe('marmiton.org/recettes/crepes');
  });
  it('garde les paramètres utiles', () => {
    expect(cleLien('https://site.fr/r?id=42&utm_medium=a')).toBe('site.fr/r?id=42');
  });
  it('lien invalide', () => {
    expect(cleLien('pas un lien')).toBe(null);
  });
  it('extrait le lien du texte partagé (champ text ou url)', () => {
    expect(extraireLien('Regarde ça ! https://www.instagram.com/reel/XYZ/?igsh=1', null)).toBe('https://www.instagram.com/reel/XYZ/?igsh=1');
    expect(extraireLien(null, 'https://www.instagram.com/p/ABC/')).toBe('https://www.instagram.com/p/ABC/');
    expect(extraireLien('rien ici')).toBe(null);
  });
});
