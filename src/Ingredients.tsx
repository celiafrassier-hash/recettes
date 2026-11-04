import { afficherQty } from './lib/courses';
import { aVerifier, parseIngredients } from './lib/ingredients';

export function Personnes({ n, setN }: { n: number; setN: (n: number) => void }) {
  return (
    <div className="personnes">
      <button type="button" aria-label="Une personne de moins" onClick={() => setN(Math.max(1, n - 1))}>−</button>
      <span>{n} pers.</span>
      <button type="button" aria-label="Une personne de plus" onClick={() => setN(Math.min(20, n + 1))}>+</button>
    </div>
  );
}

// Champ d'ingrédients écrits d'un trait + aperçu « L'appli a compris » (§2.2).
export function ChampIngredients({ texte, setTexte, pour, setPour }: { texte: string; setTexte: (t: string) => void; pour: number; setPour: (n: number) => void }) {
  const ing = parseIngredients(texte, pour);
  const doute = ing.some((i) => aVerifier(i, pour));
  return (
    <div className="champ">
      <div className="ligne-titre">
        <span>Ingrédients</span>
        <Personnes n={pour} setN={setPour} />
      </div>
      <textarea rows={5} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder={'250 g ricotta, 1 paquet ravioles, sel'} aria-label={`Ingrédients pour ${pour} personnes`} />
      {ing.length > 0 && (
        <div className="apercu">
          <span className="petit">L'appli a compris :</span>
          <div className="puces">
            {ing.map((i, k) => (
              <span key={k} className={aVerifier(i, pour) ? 'puce doute' : 'puce'}>
                <strong>{afficherQty(i.qty * pour, i.unit, i.name)}</strong> {i.name}
              </span>
            ))}
          </div>
          {doute && <span className="petit doute-texte">En orange : pas d'unité. Vérifie (ex. « 1,5 kg » au lieu de « 1,5 »).</span>}
        </div>
      )}
    </div>
  );
}
