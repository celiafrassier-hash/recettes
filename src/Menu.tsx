import { couleurDe, type Recette } from './lib/carnet';
import { JOURS, type CaseLigne, type Choix, type Moment } from './lib/menu';
import { libelleSemaine, lundiDe } from './lib/semaines';

type Props = {
  semaine: Date; changerSemaine: (d: number) => void;
  cases: CaseLigne[]; recettes: Recette[];
  choix: Choix | null; setChoix: (c: Choix | null) => void;
  toucherCase: (jour: number, moment: Moment) => void;
  demande: Recette | null; ajouterIngredients: () => void; plusTard: () => void;
};

const BEIGE = '#F6E7C8';

export function nomSemaine(lundi: Date): string {
  const ecart = Math.round((lundi.getTime() - lundiDe(new Date()).getTime()) / (7 * 864e5));
  return ecart === 0 ? 'Cette semaine' : ecart === 1 ? 'Semaine prochaine' : ecart === -1 ? 'Semaine dernière' : ecart > 0 ? `Dans ${ecart} semaines` : `Il y a ${-ecart} semaines`;
}

export default function Menu({ semaine, changerSemaine, cases, recettes, choix, setChoix, toucherCase, demande, ajouterIngredients, plusTard }: Props) {
  const passee = semaine < lundiDe(new Date());
  const nom = (id: string | null) => recettes.find((r) => r.id === id);
  const choisir = (recette: Choix['recette']) => setChoix(choix?.recette === recette ? null : { recette, personnes: 1 });
  // Recettes déjà au menu cette semaine d'abord, puis le reste du carnet par ordre alphabétique.
  const auMenu = new Set(cases.map((c) => c.recette));
  const pastilles = [...recettes].sort((a, b) => Number(auMenu.has(b.id)) - Number(auMenu.has(a.id)) || a.nom.localeCompare(b.nom, 'fr'));

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
          <span className="petit">{choix ? 'Touche les cases où tu la manges' : 'Choisis une recette, puis touche les cases'}</span>
          <div className="pastilles">
            <button aria-pressed={choix?.recette === 'plaisir'} style={{ background: BEIGE }} onClick={() => choisir('plaisir')}>Plaisir</button>
            {pastilles.map((r) => (
              <button key={r.id} aria-pressed={choix?.recette === r.id} style={{ background: choix?.recette === r.id ? couleurDe(r) : undefined }} onClick={() => choisir(r.id)}>
                {r.nom}{choix?.recette === r.id && choix.personnes > 1 ? ` · ${choix.personnes} pers.` : ''}
              </button>
            ))}
          </div>
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
              const c = cases.find((x) => x.jour === jour && x.moment === moment);
              const r = c && nom(c.recette);
              const texte = c?.plaisir ? 'Plaisir' : r ? r.nom + (c!.personnes > 1 ? ` · ${c!.personnes} pers.` : '') : '';
              return (
                <button key={moment} className={c ? 'case pleine' : 'case'} disabled={passee}
                  style={{ background: c?.plaisir ? BEIGE : r ? couleurDe(r) : undefined }}
                  aria-label={`${j} ${moment} : ${texte || 'vide'}`} onClick={() => toucherCase(jour, moment)}>
                  {texte}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
