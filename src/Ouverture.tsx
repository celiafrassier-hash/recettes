import { useState } from 'react';

// Écran d'ouverture : le couvercle saute avec de petits nuages, et la vapeur monte en volutes petites et grandes. Passé si on touche l'écran,
// et jamais montré si le téléphone demande moins d'animations.
const VAPEUR = [
  { x: 38, h: 16, d: 0.3 }, { x: 48, h: 30, d: 0.5 }, { x: 60, h: 24, d: 0.35 },
  { x: 72, h: 34, d: 0.65 }, { x: 82, h: 14, d: 0.45 }, { x: 54, h: 12, d: 0.9 }, { x: 66, h: 18, d: 1.05 },
];

export default function Ouverture() {
  const [la, setLa] = useState(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (!la) return null;
  return (
    <div className="ouverture" onAnimationEnd={(e) => e.target === e.currentTarget && setLa(false)} onClick={() => setLa(false)} aria-hidden="true">
      <svg width="140" height="150" viewBox="0 0 120 130">
        <g fill="none" stroke="#9FAE97" strokeWidth="3.5" strokeLinecap="round">
          {VAPEUR.map((v, i) => (
            <path key={i} className="vapeur" style={{ animationDelay: `${v.d}s` }} d={`M${v.x} 52c-6 -${v.h / 3} 6 -${v.h / 1.6} 0 -${v.h}`} />
          ))}
        </g>
        <g className="nuage" fill="#C9D3C3">
          <circle cx="28" cy="54" r="7" /><circle cx="94" cy="52" r="8" /><circle cx="60" cy="38" r="6" />
        </g>
        <rect x="20" y="66" width="80" height="50" rx="12" fill="#8E1B1E" />
        <rect x="6" y="78" width="14" height="8" rx="4" fill="#6E1417" />
        <rect x="100" y="78" width="14" height="8" rx="4" fill="#6E1417" />
        <g className="couvercle">
          <rect x="12" y="56" width="96" height="10" rx="5" fill="#6E1417" />
          <rect x="52" y="48" width="16" height="9" rx="4" fill="#6E1417" />
        </g>
      </svg>
      <strong>Popote</strong>
    </div>
  );
}
