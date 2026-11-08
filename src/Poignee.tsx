import { useState } from 'react';

type Geste = { de: number; vers: number; y0: number; dy: number; centres: number[]; h: number };

// Glisser une ligne par sa poignée ⠿. Chaque ligne porte data-ligne, leur conteneur data-liste.
// `lacher(de, vers, x, y)` est appelé au lâcher ; `vers` = nouvelle place dans la liste, x/y = où est le doigt.
// shortcut: pas de défilement automatique au bord de l'écran ; à ajouter si les listes deviennent très longues.
export function usePoignee(lacher: (de: number, vers: number, x: number, y: number) => void) {
  const [g, setG] = useState<Geste | null>(null);
  const prendre = (k: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      const ligne = e.currentTarget.closest<HTMLElement>('[data-ligne]')!;
      const lignes = [...ligne.closest('[data-liste]')!.querySelectorAll<HTMLElement>('[data-ligne]')];
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
      const centres = lignes.map((l) => {
        const b = l.getBoundingClientRect();
        return b.top + b.height / 2;
      });
      setG({ de: k, vers: k, y0: e.clientY, dy: 0, h: ligne.offsetHeight, centres });
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!g) return;
      const dy = e.clientY - g.y0;
      const centre = g.centres[g.de] + dy;
      setG({ ...g, dy, vers: g.centres.filter((c, i) => i !== g.de && c < centre).length });
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (g) lacher(g.de, g.vers, e.clientX, e.clientY);
      setG(null);
    },
    onPointerCancel: () => setG(null),
  });
  // Pendant le geste : la ligne tenue suit le doigt, les autres lui font de la place (si `decaler`).
  // `translate` plutôt que `transform` : l'animation d'apparition des lignes garde la main sur transform.
  const style = (i: number, decaler = true): React.CSSProperties | undefined => {
    if (!g) return undefined;
    if (i === g.de) return { translate: `0 ${g.dy}px`, position: 'relative', zIndex: 2, background: '#fff', boxShadow: '0 6px 20px rgba(31, 42, 36, 0.18)', borderRadius: 12 };
    if (!decaler) return undefined;
    if (g.de < g.vers && i > g.de && i <= g.vers) return { translate: `0 ${-g.h}px` };
    if (g.vers < g.de && i >= g.vers && i < g.de) return { translate: `0 ${g.h}px` };
    return undefined;
  };
  return { prendre, style, tenue: g?.de ?? null };
}

// Feuille (fiche, choix de recette) qu'on ferme en la tirant vers le bas depuis son haut.
export function useDescendre(fermer: () => void) {
  // Tirer la feuille vers le bas (depuis le haut, photo ou poignée) pour la fermer, au lieu de la croix.
  const [tire, setTire] = useState<{ y0: number; dy: number; t: number; v: number } | null>(null);
  const [part, setPart] = useState(false);
  // Fermeture : la feuille finit de descendre en douceur (0,4 s), puis disparaît.
  const partir = () => {
    setPart(true);
    setTimeout(fermer, 400);
  };
  const tirer = {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setTire({ y0: e.clientY, dy: 0, t: e.timeStamp, v: 0 });
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!tire) return;
      const dy = Math.max(0, e.clientY - tire.y0);
      setTire({ ...tire, dy, t: e.timeStamp, v: (dy - tire.dy) / Math.max(1, e.timeStamp - tire.t) });
    },
    // Lâchée assez bas, ou lancée d'un petit coup vers le bas : elle part. Sinon elle remonte.
    onPointerUp: () => {
      if (tire && (tire.dy > 90 || (tire.dy > 20 && tire.v > 0.5))) partir();
      setTire(null);
    },
    onPointerCancel: () => setTire(null),
  };
  const style: React.CSSProperties | undefined = part
    ? { transform: 'translateY(100%)', transition: 'transform 0.4s cubic-bezier(0.3, 0, 0.2, 1)' }
    : tire ? { transform: `translateY(${tire.dy}px)`, transition: 'none' } : undefined;
  return { part, partir, tirer, style };
}

// Les 6 points ⠿ à gauche de la ligne.
export function Poignee({ nom, ...gestes }: { nom: string } & ReturnType<ReturnType<typeof usePoignee>['prendre']>) {
  return (
    <span className="attrape" role="button" aria-label={`Déplacer ${nom}`} {...gestes}>
      <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor" aria-hidden="true">
        {[3, 10, 17].flatMap((y) => [<circle key={`a${y}`} cx="4" cy={y} r="1.8" />, <circle key={`b${y}`} cx="10" cy={y} r="1.8" />])}
      </svg>
    </span>
  );
}
