import { useLayoutEffect, useRef, useState } from 'react';
import { RAYONS, type Rayon } from './lib/aliments';
import { couleurDe, type Recette } from './lib/carnet';
import { afficherQty, BASIQUES, cleLigne, listeCourses, portions, type Ajustement, type Ligne } from './lib/courses';
import { parseLine } from './lib/ingredients';
import type { AjLigne, CaseLigne } from './lib/menu';
import { libelleSemaine } from './lib/semaines';
import { nomSemaine } from './Menu';

type Props = {
  semaine: Date; changerSemaine: (d: number) => void;
  cases: CaseLigne[]; recettes: Recette[]; ajustements: AjLigne[];
  ajuster: (cle: string, patch: Partial<AjLigne>) => void;
  ajouterIngredients: (id: string) => void;
};

// Petite fête quand tout est coché : des confettis tombent une fois (coupés si le téléphone demande moins d'animations).
function Confettis() {
  const couleurs = ['#8E1B1E', '#E8B04B', '#2F6B4F', '#3A5BA0'];
  return (
    <div className="confettis" aria-hidden="true">
      {Array.from({ length: 30 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: couleurs[i % 4], animationDelay: `${(i % 7) * 70}ms`, ['--x' as string]: `${((i * 53) % 80) - 40}px` }} />
      ))}
    </div>
  );
}

// Article coché : il glisse doucement en bas de son rayon (on mesure les places avant et après, puis on anime l'écart).
function useGlisse(cles: string) {
  const ref = useRef<HTMLDivElement>(null);
  const avant = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const els = [...(ref.current?.querySelectorAll<HTMLElement>('[data-cle]') ?? [])];
    const apres = new Map(els.map((el) => [el.dataset.cle!, el.getBoundingClientRect().top]));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (const el of els) {
        const dy = (avant.current.get(el.dataset.cle!) ?? apres.get(el.dataset.cle!)!) - apres.get(el.dataset.cle!)!;
        if (!dy) continue;
        el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      }
    }
    avant.current = apres;
  }, [cles]);
  return ref;
}

const COULEURS_RAYON: Partial<Record<Rayon, string>> = { fl: '#2F6B4F', cr: '#3A5BA0', po: '#B83C0B', ep: '#7A5A00' };

export default function Courses({ semaine, changerSemaine, cases, recettes, ajustements, ajuster, ajouterIngredients }: Props) {
  const [seul, setSeul] = useState<string | null>(null);
  const [ajout, setAjout] = useState('');
  const [corrige, setCorrige] = useState<{ cle: string; texte: string } | null>(null);
  const parId = new Map(recettes.map((r) => [r.id, { id: r.id, name: r.nom, ing: r.ingredients }]));
  const aj: Record<string, Ajustement> = Object.fromEntries(ajustements.map((a) => [a.cle, a]));
  const menu = cases.map((c) => ({ recette: c.plaisir ? 'plaisir' : c.recette!, personnes: c.personnes }));
  const { lignes, sansIngredients } = listeCourses(menu, parId, aj, seul ?? undefined);
  const plats = [...portions(menu)].map(([id, n]) => ({ r: recettes.find((x) => x.id === id), n })).filter((p) => p.r);
  const retires = ajustements.filter((a) => a.retire);
  const parRayon = (Object.keys(RAYONS) as Rayon[]).map((ry) => ({ ry, lignes: lignes.filter((l) => l.rayon === ry).sort((a, b) => Number(a.coche) - Number(b.coche) || a.name.localeCompare(b.name, 'fr')) })).filter((g) => g.lignes.length);

  const glisse = useGlisse(parRayon.map((g) => g.lignes.map((l) => l.cle + l.coche).join()).join());
  const toutPris = lignes.length > 0 && lignes.every((l) => l.coche);

  function ajouterArticle(e: React.FormEvent) {
    e.preventDefault();
    const i = parseLine(ajout);
    if (!i) return;
    const cle = cleLigne(i.name, i.unit);
    ajuster(cle, { ajoute: true, nom: i.name, unite: i.unit, qty: i.qty || null, retire: false });
    setAjout('');
  }

  function corriger(l: Ligne, texte: string) {
    setCorrige(null);
    const i = parseLine(`${texte} ${l.name}`);
    // shortcut: une correction dans une autre unité (« 2 paquets » pour des grammes) est ignorée ; ajouter l'article à la main dans ce cas.
    if (i && i.unit === l.unit) ajuster(l.cle, { qty: i.qty });
  }

  return (
    <div className="courses" ref={glisse}>
      {toutPris && <Confettis />}
      <div className="semaine">
        <button aria-label="Semaine précédente" onClick={() => changerSemaine(-1)}>‹</button>
        <span><strong>{nomSemaine(semaine)}</strong><span className="petit">{libelleSemaine(semaine)} · par rayon</span></span>
        <button aria-label="Semaine suivante" onClick={() => changerSemaine(1)}>›</button>
      </div>

      {plats.length > 0 ? (
        <div className="plats">
          {plats.map(({ r, n }) => (
            <button key={r!.id} aria-pressed={seul === r!.id} className={seul && seul !== r!.id ? 'plat pale' : 'plat'} onClick={() => setSeul(seul === r!.id ? null : r!.id)}>
              <span style={{ background: couleurDe(r!) }} />
              <strong>{r!.nom}</strong>
              <span className="petit">{n} portion{n > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="petit">Rien au menu cette semaine : pose des recettes dans l'onglet Menu, la liste se fera toute seule.</p>
      )}

      {sansIngredients.map((id) => (
        <div key={id} className="alerte">
          <strong>{parId.get(id)?.name}</strong> : ingrédients non renseignés.{' '}
          <button className="souligne" onClick={() => ajouterIngredients(id)}>Les ajouter</button>
        </div>
      ))}

      {parRayon.map(({ ry, lignes }) => (
        <section key={ry} className="rayon">
          <span className="etiquette" style={{ color: COULEURS_RAYON[ry] }}>{RAYONS[ry]}</span>
          <div className="articles">
            {lignes.map((l) => (
              <div key={l.cle} data-cle={l.cle} className={l.coche ? 'article coche' : 'article'}>
                <button className="cocher" aria-pressed={l.coche} onClick={() => ajuster(l.cle, { coche: !l.coche })}>
                  <span className="case-a-cocher">{l.coche && <svg className="pop" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>}</span>
                  <span className="nom">{l.name}</span>
                </button>
                {corrige?.cle === l.cle ? (
                  <form onSubmit={(e) => { e.preventDefault(); corriger(l, corrige.texte); }}>
                    <input className="qty" autoFocus value={corrige.texte} onChange={(e) => setCorrige({ ...corrige, texte: e.target.value })} onBlur={() => corriger(l, corrige.texte)} aria-label={`Quantité de ${l.name}`} />
                  </form>
                ) : (
                  <button className="qty" aria-label={`Corriger la quantité de ${l.name}`} onClick={() => setCorrige({ cle: l.cle, texte: afficherQty(l.qty, l.unit, l.name) })}>
                    {afficherQty(l.qty, l.unit, l.name) || '–'}
                  </button>
                )}
                <button className="retirer" aria-label={`Retirer ${l.name} de la liste`} onClick={() => ajuster(l.cle, { retire: true })}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9AA596" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <form className="ajout-article" onSubmit={ajouterArticle}>
        <label className="cache" htmlFor="ajout-article">Ajouter un article</label>
        <input id="ajout-article" value={ajout} onChange={(e) => setAjout(e.target.value)} placeholder="Ajouter un article (ex. 2 baguettes)" />
        <button className="principal" aria-label="Ajouter l'article">+</button>
      </form>

      {retires.length > 0 && (
        <div className="petit">
          {retires.length} article{retires.length > 1 ? 's' : ''} retiré{retires.length > 1 ? 's' : ''} ·{' '}
          <button className="souligne" onClick={() => retires.forEach((a) => ajuster(a.cle, { retire: false }))}>Tout remettre</button>
        </div>
      )}
      <p className="petit">Pas mis dans la liste, car on en a presque toujours : {BASIQUES.join(', ')}. Jette un œil au placard avant de partir.</p>
    </div>
  );
}
