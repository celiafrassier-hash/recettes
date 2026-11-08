import { useState } from 'react';
import { norm } from './lib/texte';
import { chercher, couleurDe, resume, toutesCategories, type Membre, type Recette, type Statut } from './lib/carnet';

export function LogoType({ type }: { type: Recette['type'] }) {
  const label = { insta: 'Vidéo Instagram', web: "Recette d'un site web", main: 'Recette écrite à la main' }[type];
  return (
    <span className="logo-type" role="img" aria-label={label}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {type === 'insta' && <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" /></>}
        {type === 'web' && <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></>}
        {type === 'main' && <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></>}
      </svg>
    </span>
  );
}

export function Pastille({ membre }: { membre?: Membre }) {
  if (!membre) return null;
  return <span className="pastille" role="img" aria-label={`Ajoutée par ${membre.prenom}`}>{membre.initiale}</span>;
}

type Props = { recettes: Recette[]; categories: string[]; creerCategorie: (nom: string) => void; membres: Membre[]; statuts: Statut[]; moi: string; ouvrir: (id: string) => void; nouvelle?: string | null; lecture?: string | null };

export default function Carnet({ recettes, categories, creerCategorie, membres, statuts, moi, ouvrir, nouvelle, lecture }: Props) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [toutes, setToutes] = useState(false);
  const [nouvCat, setNouvCat] = useState<string | null>(null);
  const listeCats = toutesCategories(recettes, categories);
  // Fermé : les 5 plus utilisées (plus celle choisie), pour tenir sur 2 lignes. Ouvert : toutes.
  const compte = (c: string) => recettes.filter((r) => r.categories.includes(c)).length;
  const top = [...listeCats].sort((a, b) => compte(b) - compte(a)).slice(0, 5);
  const visibles = toutes ? listeCats : cat && !top.includes(cat) ? [cat, ...top.slice(0, 4)] : top;
  const creer = (e: React.FormEvent) => {
    e.preventDefault();
    const nom = nouvCat?.trim();
    if (nom && !listeCats.some((c) => norm(c) === norm(nom))) creerCategorie(nom);
    setNouvCat(null);
  };
  const liste = chercher(recettes, q, cat);
  const fait = (r: string, m: string) => statuts.some((s) => s.recette === r && s.membre === m && s.valeur === 'deja_faite');

  return (
    <div className="carnet">
      <label className="recherche">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span className="cache">Rechercher une recette</span>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="crevettes, ravioles, gratin…" />
      </label>
      <div className="categories enveloppe">
        {visibles.map((c) => (
          <button key={c} aria-pressed={cat === c} onClick={() => setCat(cat === c ? '' : c)}>{c}</button>
        ))}
        <button className="toutes" aria-expanded={toutes} onClick={() => { setToutes(!toutes); setNouvCat(null); }}>
          {toutes ? 'Moins ▴' : `Toutes (${listeCats.length}) ▾`}
        </button>
        {toutes && (nouvCat === null ? (
          <button className="nouvelle" onClick={() => setNouvCat('')}>+ Nouvelle</button>
        ) : (
          <form className="nouvelle-cat" onSubmit={creer}>
            <input value={nouvCat} onChange={(e) => setNouvCat(e.target.value)} placeholder="Apéro, batch…" aria-label="Nom de la nouvelle catégorie" maxLength={40} autoFocus />
            <button type="button" className="secondaire" onClick={() => setNouvCat(null)}>Annuler</button>
            <button className="principal">Créer</button>
          </form>
        ))}
      </div>
      <div className="petit">
        {recettes.length === 0 ? 'Le carnet est vide : touche + pour ajouter une recette, ou partage une vidéo depuis Instagram.'
          : `${liste.length} recette${liste.length > 1 ? 's' : ''}${q || cat ? ' trouvée' + (liste.length > 1 ? 's' : '') : ''}`}
      </div>
      <div className="grille">
        {liste.map((r) => {
          const moiFait = fait(r.id, moi);
          const autres = membres.filter((m) => m.id !== moi && fait(r.id, m.id)).map((m) => m.prenom);
          return (
            <button key={r.id} className={r.id === nouvelle ? 'recette nouvelle' : 'recette'} onClick={() => ouvrir(r.id)} aria-label={`Voir la recette ${r.nom}`}>
              <span className="visuel" style={{ background: couleurDe(r) }}>
                {r.photo && <img src={r.photo} alt="" loading="lazy" />}
                <span className={moiFait ? 'statut fait' : 'statut'}>{moiFait ? 'Déjà faite' : 'À tester'}</span>
                <span className="badges"><Pastille membre={membres.find((m) => m.id === r.ajoutee_par)} /><LogoType type={r.type} /></span>
                {!r.photo && <span className="initiale" aria-hidden="true">{r.nom.trim()[0]?.toUpperCase()}</span>}
              </span>
              <span className="texte">
                <strong>{r.nom}</strong>
                {r.id === lecture ? <span className="lecture"><span className="petit">Lecture {r.type === 'insta' ? 'de la vidéo' : 'du site'}…</span><i /><i /></span> : <span className="petit">{resume(r)}</span>}
                {!moiFait && autres.length > 0 && <span className="note">{autres.join(' et ')} l’{autres.length > 1 ? 'ont' : 'a'} déjà faite</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
