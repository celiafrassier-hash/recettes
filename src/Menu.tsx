import { useState } from 'react';
import { Categories } from './Carnet';
import { chercher, couleurDe, type Recette } from './lib/carnet';
import { JOURS, type CaseLigne, type Choix, type Moment } from './lib/menu';
import { libelleSemaine, lundiDe } from './lib/semaines';

type Props = {
  semaine: Date; changerSemaine: (d: number) => void;
  cases: CaseLigne[]; recettes: Recette[]; categories: string[]; faites: Set<string>;
  choix: Choix | null; setChoix: (c: Choix | null) => void;
  toucherCase: (jour: number, moment: Moment) => void;
  noter: (jour: number, moment: Moment, note: string) => Promise<void>;
  demande: Recette | null; ajouterIngredients: () => void; plusTard: () => void;
};

const BEIGE = '#F6E7C8';

export function nomSemaine(lundi: Date): string {
  const ecart = Math.round((lundi.getTime() - lundiDe(new Date()).getTime()) / (7 * 864e5));
  return ecart === 0 ? 'Cette semaine' : ecart === 1 ? 'Semaine prochaine' : ecart === -1 ? 'Semaine dernière' : ecart > 0 ? `Dans ${ecart} semaines` : `Il y a ${-ecart} semaines`;
}

export default function Menu({ semaine, changerSemaine, cases, recettes, categories, faites, choix, setChoix, toucherCase, noter, demande, ajouterIngredients, plusTard }: Props) {
  const passee = semaine < lundiDe(new Date());
  const nom = (id: string | null) => recettes.find((r) => r.id === id);
  // Recettes déjà au menu cette semaine d'abord, puis le reste du carnet par ordre alphabétique.
  const auMenu = new Set(cases.map((c) => c.recette));
  const [feuille, setFeuille] = useState(false);
  const choisie = choix && choix.recette !== 'plaisir' ? nom(choix.recette) : undefined;
  // Case pleine touchée sans recette choisie : on ouvre sa note (« + légumes ») au lieu de la vider.
  const [ouverte, setOuverte] = useState<{ jour: number; moment: Moment; note: string } | null>(null);
  const caseDe = (jour: number, moment: Moment) => cases.find((x) => x.jour === jour && x.moment === moment);

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
              <button className="lien-bouton" onClick={() => setFeuille(true)}>Changer</button>
              <button className="croix" aria-label="Ne plus poser cette recette" onClick={() => setChoix(null)}>×</button>
            </div>
          ) : (
            <button className="principal plein choisir" onClick={() => { setOuverte(null); setFeuille(true); }}>+ Choisir une recette</button>
          )}
          <span className="petit centre">{choix ? 'Touche les cases où tu la manges' : 'Touche un repas déjà posé pour y ajouter une note'}</span>
        </div>
      )}

      <div className="grille-menu">
        <span />
        <span className="petit centre">Midi</span>
        <span className="petit centre">Soir</span>
        {JOURS.map((j, jour) => (
          <div key={j} className="jour">
            <span className="nom-jour">{j}</span>
            {(['midi', 'soir'] as Moment[]).map((moment) => {
              const c = caseDe(jour, moment);
              const r = c && nom(c.recette);
              const texte = c?.plaisir ? 'Plaisir' : r ? r.nom + (c!.personnes > 1 ? ` · ${c!.personnes} pers.` : '') : '';
              return (
                <button key={moment} className={c ? 'case pleine' : 'case'} disabled={passee}
                  style={{ background: c?.plaisir ? BEIGE : r ? couleurDe(r) : undefined }}
                  aria-label={`${j} ${moment} : ${texte || 'vide'}${c?.note ? ', ' + c.note : ''}`}
                  onClick={() => (c && !choix ? setOuverte({ jour, moment, note: c.note ?? '' }) : toucherCase(jour, moment))}>
                  {texte}
                  {c?.note && <span className="note-case">{c.note}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {feuille && (
        <FeuilleChoix recettes={recettes} categories={categories} auMenu={auMenu} faites={faites}
          choisir={(recette) => { setChoix({ recette, personnes: 1 }); setFeuille(false); }} fermer={() => setFeuille(false)} />
      )}

      {ouverte && caseDe(ouverte.jour, ouverte.moment) && (
        <form className="carte note-repas" onSubmit={async (e) => { e.preventDefault(); await noter(ouverte.jour, ouverte.moment, ouverte.note.trim()); setOuverte(null); }}>
          <label className="champ"><span>{JOURS[ouverte.jour]} {ouverte.moment} : une note</span>
            <input value={ouverte.note} onChange={(e) => setOuverte({ ...ouverte, note: e.target.value })} placeholder="+ 200 g haricots verts (va dans les courses)" maxLength={200} autoFocus /></label>
          <div className="boutons">
            <button type="button" className="secondaire" onClick={() => { toucherCase(ouverte.jour, ouverte.moment); setOuverte(null); }}>Vider la case</button>
            <button className="principal">Enregistrer</button>
          </div>
        </form>
      )}
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
  const deja = liste.filter((r) => auMenu.has(r.id));
  const reste = liste.filter((r) => !auMenu.has(r.id));
  return (
    <div className="voile" onClick={fermer}>
      <div role="dialog" aria-label="Choisir une recette" className="feuille choix" onClick={(e) => e.stopPropagation()}>
        <span className="poignee-feuille" aria-hidden="true" />
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
