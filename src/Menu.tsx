import { useEffect, useRef, useState } from 'react';
import { Categories } from './Carnet';
import { chercher, couleurDe, type Recette } from './lib/carnet';
import { JOURS, JOURS_LONGS, type CaseLigne, type Choix, type Moment } from './lib/menu';
import { libelleSemaine, lundiDe } from './lib/semaines';
import { useDescendre } from './Poignee';

type Place = { jour: number; moment: Moment };
type Props = {
  semaine: Date; changerSemaine: (d: number) => void;
  cases: CaseLigne[]; recettes: Recette[]; categories: string[]; faites: Set<string>;
  choix: Choix | null; setChoix: (c: Choix | null) => void;
  toucherCase: (jour: number, moment: Moment, c?: Choix) => void;
  noter: (jour: number, moment: Moment, note: string) => Promise<void>;
  enlever: (jour: number, moment: Moment, plat?: number) => Promise<void>;
  deplacer: (de: Place, vers: Place) => Promise<void>;
  demande: Recette | null; ajouterIngredients: () => void; plusTard: () => void;
};
// Repas tenu du doigt : `leve` après l'appui long, puis il suit le doigt jusqu'à la case `cible`.
type Tenu = Place & { x0: number; y0: number; dx: number; dy: number; leve: boolean; cible: Place | null };

const BEIGE = '#F6E7C8';
const APPUI_LONG = 450; // ms
const memePlace = (a: Place | null, b: Place) => !!a && a.jour === b.jour && a.moment === b.moment;

export function nomSemaine(lundi: Date): string {
  const ecart = Math.round((lundi.getTime() - lundiDe(new Date()).getTime()) / (7 * 864e5));
  return ecart === 0 ? 'Cette semaine' : ecart === 1 ? 'Semaine prochaine' : ecart === -1 ? 'Semaine dernière' : ecart > 0 ? `Dans ${ecart} semaines` : `Il y a ${-ecart} semaines`;
}

export default function Menu({ semaine, changerSemaine, cases, recettes, categories, faites, choix, setChoix, toucherCase, noter, enlever, deplacer, demande, ajouterIngredients, plusTard }: Props) {
  const passee = semaine < lundiDe(new Date());
  const nom = (id: string | null) => recettes.find((r) => r.id === id);
  // Recettes déjà au menu cette semaine d'abord, puis le reste du carnet par ordre alphabétique.
  const auMenu = new Set(cases.map((c) => c.recette));
  // Feuille de choix : pour la rangée du haut, ou pour ajouter un plat à un repas précis.
  const [feuille, setFeuille] = useState<'rangee' | Place | null>(null);
  const choisie = choix && choix.recette !== 'plaisir' ? nom(choix.recette) : undefined;
  // Repas ouvert (appui long, ou toucher sans recette choisie) : ses plats, sa note, le supprimer.
  const [ouvert, setOuvert] = useState<Place | null>(null);
  // Un repas = un ou plusieurs plats (poulet moutarde + purée), dans l'ordre où on les a posés.
  const repasDe = (p: Place) => cases.filter((x) => x.jour === p.jour && x.moment === p.moment).sort((a, b) => a.plat - b.plat);
  const nomPlat = (c: CaseLigne) => (c.plaisir ? 'Plaisir' : nom(c.recette)?.nom ?? '') + (c.personnes > 1 ? ` · ${c.personnes} pers.` : '');
  const plats = ouvert ? repasDe(ouvert) : [];

  // Appui long : ouvre le repas. Appui long puis glisser : le déplace (il rejoint le repas où on le lâche).
  const [tenu, setTenu] = useState<Tenu | null>(null);
  const minuteur = useRef(0);
  const sansClic = useRef(false); // le clic qui suit un appui long ne doit pas ajouter de plat
  const leve = useRef(false);
  const grille = useRef<HTMLDivElement>(null);
  // Repas soulevé : la page ne défile plus sous le doigt (il faut un écouteur « non passif », que React ne sait pas poser).
  useEffect(() => {
    const el = grille.current;
    const bloquer = (e: TouchEvent) => { if (leve.current) e.preventDefault(); };
    el?.addEventListener('touchmove', bloquer, { passive: false });
    return () => el?.removeEventListener('touchmove', bloquer);
  }, []);
  const lacher = () => { clearTimeout(minuteur.current); leve.current = false; setTenu(null); };
  // La case tenue suit le doigt : on la saute, sinon elle se trouverait elle-même (vers le bas, elle passe avant les autres).
  const placeSous = (x: number, y: number, tenue: Place): Place | null => {
    const el = [...grille.current!.querySelectorAll<HTMLElement>('[data-jour]')].find((c) => {
      if (Number(c.dataset.jour) === tenue.jour && c.dataset.moment === tenue.moment) return false;
      const b = c.getBoundingClientRect();
      return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    });
    return el ? { jour: Number(el.dataset.jour), moment: el.dataset.moment as Moment } : null;
  };
  const gestes = (p: Place) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      sansClic.current = false;
      if (e.button) return;
      const el = e.currentTarget, id = e.pointerId;
      setTenu({ ...p, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, leve: false, cible: null });
      minuteur.current = window.setTimeout(() => {
        leve.current = sansClic.current = true;
        try { el.setPointerCapture(id); } catch { /* doigt déjà levé */ }
        navigator.vibrate?.(15);
        setTenu((t) => t && { ...t, leve: true });
      }, APPUI_LONG);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!tenu) return;
      const dx = e.clientX - tenu.x0, dy = e.clientY - tenu.y0;
      // Le doigt bouge avant l'appui long : c'est la page qu'on fait défiler.
      if (!tenu.leve) { if (Math.hypot(dx, dy) > 10) lacher(); return; }
      setTenu({ ...tenu, dx, dy, cible: placeSous(e.clientX, e.clientY, tenu) });
    },
    onPointerUp: () => {
      if (tenu?.leve) {
        if (Math.hypot(tenu.dx, tenu.dy) < 12) setOuvert(p);
        else if (tenu.cible && !memePlace(tenu.cible, p)) deplacer(p, tenu.cible);
      }
      lacher();
    },
    onPointerCancel: lacher,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="menu">
      <div className="semaine">
        <button aria-label="Semaine précédente" onClick={() => changerSemaine(-1)}>‹</button>
        <span><strong>{nomSemaine(semaine)}</strong><span className="petit">{libelleSemaine(semaine)}</span></span>
        <button aria-label="Semaine suivante" onClick={() => changerSemaine(1)}>›</button>
      </div>

      {demande && (
        <div role="status" className="alerte demande">
          <span><strong>{demande.nom}</strong> n'a pas encore d'ingrédients : ils ne seront pas dans tes courses.</span>
          <div className="boutons">
            <button className="principal" onClick={ajouterIngredients}>Les ajouter</button>
            <button className="secondaire" onClick={plusTard}>Plus tard</button>
          </div>
        </div>
      )}

      {passee ? (
        <p className="petit">Semaine passée : pour t'en inspirer.</p>
      ) : (
        <div className="choix-recette">
          {choix ? (
            <div className="choisie" style={{ background: choisie ? couleurDe(choisie) : BEIGE }}>
              <strong>{choisie?.nom ?? 'Plaisir'}{choix.personnes > 1 ? ` · ${choix.personnes} pers.` : ''}</strong>
              <button className="lien-bouton" onClick={() => setFeuille('rangee')}>Changer</button>
              <button className="croix" aria-label="Ne plus poser cette recette" onClick={() => setChoix(null)}>×</button>
            </div>
          ) : (
            <button className="principal plein choisir" onClick={() => setFeuille('rangee')}>+ Choisir une recette</button>
          )}
          <span className="petit centre">{choix ? 'Touche les repas où tu la manges' : 'Reste appuyée sur un repas pour le modifier ou le glisser ailleurs'}</span>
        </div>
      )}

      <div className="grille-menu" ref={grille}>
        <span />
        <span className="petit centre">Midi</span>
        <span className="petit centre">Soir</span>
        {JOURS.map((j, jour) => (
          <div key={j} className="jour">
            <span className="nom-jour">{j}</span>
            {(['midi', 'soir'] as Moment[]).map((moment) => {
              const p = { jour, moment };
              const repas = repasDe(p);
              const c = repas[0];
              const r = c && nom(c.recette);
              const texte = repas.map(nomPlat).join(' + ');
              const souleve = !!tenu?.leve && memePlace(tenu, p);
              const vise = !!tenu?.leve && !souleve && memePlace(tenu.cible, p);
              return (
                <button key={moment} className={['case', c && 'pleine', souleve && 'souleve', vise && 'visee'].filter(Boolean).join(' ')}
                  disabled={passee} data-jour={jour} data-moment={moment}
                  style={{ background: c?.plaisir ? BEIGE : r ? couleurDe(r) : undefined, translate: souleve ? `${tenu!.dx}px ${tenu!.dy}px` : undefined }}
                  aria-label={`${j} ${moment} : ${texte || 'vide'}${c?.note ? ', ' + c.note : ''}`}
                  {...(c && !passee ? gestes(p) : {})}
                  onClick={() => {
                    if (sansClic.current) { sansClic.current = false; return; }
                    if (choix) toucherCase(jour, moment);
                    else if (c) setOuvert(p);
                    else setFeuille(p);
                  }}>
                  {texte}
                  {c?.note && <span className="note-case">{c.note}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {ouvert && plats.length > 0 && (
        <FeuilleRepas key={`${ouvert.jour}${ouvert.moment}`} titre={`${JOURS_LONGS[ouvert.jour]} ${ouvert.moment}`} plats={plats} nomPlat={nomPlat}
          ajouter={() => setFeuille(ouvert)}
          retirer={(plat) => enlever(ouvert.jour, ouvert.moment, plat)}
          supprimer={() => { enlever(ouvert.jour, ouvert.moment); setOuvert(null); }}
          fermer={(note) => { if (note !== (plats[0].note ?? '')) noter(ouvert.jour, ouvert.moment, note); setOuvert(null); }} />
      )}

      {feuille && (
        <FeuilleChoix recettes={recettes} categories={categories} auMenu={auMenu} faites={faites}
          choisir={(recette) => {
            if (feuille === 'rangee') setChoix({ recette, personnes: 1 });
            else toucherCase(feuille.jour, feuille.moment, { recette, personnes: 1 });
            setFeuille(null);
          }} fermer={() => setFeuille(null)} />
      )}
    </div>
  );
}

// Feuille d'un repas : ses plats, en ajouter un, sa note (enregistrée en fermant), le supprimer.
function FeuilleRepas({ titre, plats, nomPlat, ajouter, retirer, supprimer, fermer }: {
  titre: string; plats: CaseLigne[]; nomPlat: (c: CaseLigne) => string;
  ajouter: () => void; retirer: (plat: number) => void; supprimer: () => void; fermer: (note: string) => void;
}) {
  const [note, setNote] = useState(plats[0].note ?? '');
  const { part, partir, tirer, style } = useDescendre(() => fermer(note.trim()));
  return (
    <div className={part ? 'voile part' : 'voile'} onClick={partir}>
      <div role="dialog" aria-label={`Repas du ${titre}`} className="feuille repas" onClick={(e) => e.stopPropagation()} style={style}>
        <div className="haut-choix" {...tirer}>
          <span className="poignee-feuille" aria-hidden="true" />
          <button className="fermer" aria-label="Fermer" onClick={partir}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <h2 className="titre-repas">{titre}</h2>
        {plats.map((p) => (
          <div key={p.plat} className="plat-repas">
            <span>{nomPlat(p)}</span>
            {plats.length > 1 && <button className="lien-bouton rouge" onClick={() => retirer(p.plat)}>Retirer</button>}
          </div>
        ))}
        <button className="secondaire ajout-plat" onClick={ajouter}>+ Ajouter un plat</button>
        <form onSubmit={(e) => { e.preventDefault(); partir(); }}>
          <label className="champ"><span>Une note</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="+ 200 g haricots verts (va dans les courses)" maxLength={200} /></label>
        </form>
        <p className="petit">Pour le changer de jour : reste appuyée sur le repas et glisse-le. Sur un repas déjà posé, les deux se réunissent.</p>
        <button className="lien-bouton rouge" onClick={supprimer}>Supprimer le repas</button>
      </div>
    </div>
  );
}

// Feuille qui monte du bas : chercher une recette (nom, mots-clés, ingrédients) ou filtrer par catégorie.
function FeuilleChoix({ recettes, categories, auMenu, faites, choisir, fermer }: {
  recettes: Recette[]; categories: string[]; auMenu: Set<string | null>; faites: Set<string>;
  choisir: (recette: Choix['recette']) => void; fermer: () => void;
}) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const liste = chercher(recettes, q, cat).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const ligne = (r: Recette) => (
    <button key={r.id} className="ligne-recette" onClick={() => choisir(r.id)}>
      <span className="carre" style={{ background: couleurDe(r) }}>{r.photo ? <img src={r.photo} alt="" loading="lazy" /> : r.nom.trim()[0]?.toUpperCase()}</span>
      <span><strong>{r.nom}</strong><span className="petit">{faites.has(r.id) ? 'Déjà faite' : 'À tester'}</span></span>
    </button>
  );
  const { part, partir, tirer, style } = useDescendre(fermer);
  const deja = liste.filter((r) => auMenu.has(r.id));
  const reste = liste.filter((r) => !auMenu.has(r.id));
  return (
    <div className={part ? 'voile part' : 'voile'} onClick={partir}>
      <div role="dialog" aria-label="Choisir une recette" className="feuille choix" onClick={(e) => e.stopPropagation()} style={style}>
        <div className="haut-choix" {...tirer}>
          <span className="poignee-feuille" aria-hidden="true" />
          <button className="fermer" aria-label="Fermer" onClick={partir}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <label className="recherche">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <span className="cache">Chercher une recette</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher…" />
        </label>
        <Categories recettes={recettes} categories={categories} cat={cat} setCat={setCat} />
        {!q && !cat && (
          <button className="ligne-recette" onClick={() => choisir('plaisir')}>
            <span className="carre" style={{ background: BEIGE }}>P</span>
            <span><strong>Plaisir</strong><span className="petit">On improvise</span></span>
          </button>
        )}
        {deja.length > 0 && <><span className="etiquette">Déjà au menu</span>{deja.map(ligne)}</>}
        {reste.length > 0 && <><span className="etiquette">Le carnet</span>{reste.map(ligne)}</>}
        {liste.length === 0 && <p className="petit">Aucune recette trouvée.</p>}
      </div>
    </div>
  );
}
