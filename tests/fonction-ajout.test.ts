/// <reference types="vite/client" />
import { expect, it } from 'vitest';
import copie from '../supabase/functions/ajout/liens.ts?raw';
import original from '../src/lib/liens.ts?raw';

// La fonction du raccourci iPhone garde sa propre copie de liens.ts (déployée à part) : elle doit rester identique.
it('supabase/functions/ajout/liens.ts = src/lib/liens.ts', () => {
  expect(copie.replace(/\r\n/g, '\n')).toBe(original.replace(/\r\n/g, '\n'));
});
