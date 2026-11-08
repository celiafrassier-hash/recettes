import { useState } from 'react';
import { couleurDe, type Recette } from './lib/carnet';
import { JOURS, type CaseLigne, type Choix, type Moment } from './lib/menu';
import { libelleSemaine, lundiDe } from './lib/semaines';

type Props = {
  semaine: Date; changerSemaine: (d: number) => void;
  cases: CaseLigne[]; recettes: Recette[];
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

export default function Menu({ semaine, changerSemaine, cases, recettes, choix, setChoix, toucherCase, noter, demande, ajouterIngredients, plusTard }: Props) {
  const passee = semaine < lundiDe(new Date());
  const nom = (id: string | null) => recettes.find((r) => r.id === id);
  // Recettes déjà au menu cette semaine d'abord, puis le reste du carnet par ordre alphabétique.
  const auMenu = new Set(cases.map((c) => c.recette));
  const tri = [...recettes].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const option = (r: Recette) => <option key={r.id} value={r.id}>{r.nom}{choix?.recette === r.id && choix.personnes > 1 ? ` · ${choix.personnes} pers.` : ''}</option>;
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
          <span className="petit">{choix ? 'Touche les cases où tu la manges' : 'Choisis une recette, puis touche les cases. Touche un repas déjà posé pour y ajouter une note.'}</span>
          <select className="liste" value={choix?.recette ?? ''} aria-label="Recette à poser dans le menu"
            onChange={(e) => { setOuverte(null); setChoix(e.target.value ? { recette: e.target.value, personnes: 1 } : null); }}>
            <option value="">Choisis une recette…</option>
            <option value="plaisir">Plaisir</option>
            {auMenu.size > 0 && <optgroup label="Déjà au menu">{tri.filter((r) => auMenu.has(r.id)).map(option)}</optgroup>}
            <optgroup label="Le carnet">{tri.filter((r) => !auMenu.has(r.id)).map(option)}</optgroup>
          </select>
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
