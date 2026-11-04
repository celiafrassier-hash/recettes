import { useState } from 'react';
import { ChampIngredients } from './Ingredients';
import type { Recette } from './lib/carnet';
import { parseIngredients } from './lib/ingredients';
import { cleLien } from './lib/liens';

export type Nouvelle = Pick<Recette, 'type' | 'nom' | 'mots_cles' | 'lien' | 'cle_lien' | 'portions' | 'ingredients' | 'etapes'>;
// Renvoie un message d'erreur, ou rien si c'est enregistré.
export type Ajouter = (r: Nouvelle) => Promise<string | void>;

type Props = { lienPartage?: string | null; ajouter: Ajouter; fermer: () => void };

export default function Ajout({ lienPartage, ajouter, fermer }: Props) {
  const [mode, setMode] = useState<'choix' | 'web' | 'main' | 'insta'>(lienPartage !== undefined ? 'insta' : 'choix');
  const [lien, setLien] = useState(lienPartage ?? '');
  const [nom, setNom] = useState('');
  const [ing, setIng] = useState('');
  const [pour, setPour] = useState(1);
  const [etapes, setEtapes] = useState('');
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    const n = nom.trim();
    let r: Nouvelle;
    if (mode === 'main') {
      if (!n) return setErreur('Donne un nom au plat.');
      r = { type: 'main', nom: n, mots_cles: '', lien: null, cle_lien: null, portions: pour, ingredients: parseIngredients(ing, pour), etapes: etapes.trim() };
    } else {
      const l = lien.trim() && (/^https?:\/\//i.test(lien.trim()) ? lien.trim() : 'https://' + lien.trim());
      const cle = l ? cleLien(l) : null;
      if (!l || !cle || !/\.[a-z]{2,}/i.test(new URL(l).hostname)) return setErreur(mode === 'insta' ? 'Aucun lien trouvé dans le partage.' : 'Ce lien ne marche pas. Colle l’adresse de la page de la recette.');
      if (!n) return setErreur(mode === 'insta' ? 'Écris 2-3 mots pour la retrouver.' : 'Donne un nom au plat.');
      r = { type: mode === 'insta' ? 'insta' : 'web', nom: n, mots_cles: mode === 'insta' ? n : '', lien: l, cle_lien: cle, portions: 4, ingredients: [], etapes: '' };
    }
    setAttente(true);
    const msg = await ajouter(r);
    setAttente(false);
    if (msg) setErreur(msg);
  }

  const champ = (label: string, valeur: string, set: (v: string) => void, place: string, type = 'text') => (
    <label className="champ">
      <span>{label}</span>
      <input type={type} inputMode={type === 'url' ? 'url' : undefined} autoCapitalize={type === 'url' ? 'none' : undefined} value={valeur} onChange={(e) => { set(e.target.value); setErreur(''); }} placeholder={place} autoFocus={mode === 'web' ? type === 'url' : true} />
    </label>
  );

  return (
    <div className="voile" onClick={fermer}>
      <div role="dialog" aria-label="Ajouter une recette" className="feuille" onClick={(e) => e.stopPropagation()}>
        <div className="poignee" />
        {mode === 'choix' ? (
          <>
            <h2>Ajouter une recette</h2>
            <button className="choix" onClick={() => setMode('web')}>
              <span className="icone" style={{ background: '#BFDCEB' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" /></svg></span>
              <span><strong>Recette d'un site web</strong><span className="petit">Coller le lien + le nom du plat</span></span>
            </button>
            <button className="choix" onClick={() => { setMode('main'); setPour(1); }}>
              <span className="icone" style={{ background: '#CFE3D4' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></svg></span>
              <span><strong>Recette à la main</strong><span className="petit">Nom, ingrédients, étapes</span></span>
            </button>
            <p className="petit">Les vidéos Instagram s'ajoutent depuis Instagram : Partager, puis Popote.</p>
            <button className="lien-bouton" onClick={fermer}>Annuler</button>
          </>
        ) : (
          <form onSubmit={enregistrer} noValidate>
            <span className="etiquette">{{ insta: 'Partagé depuis Instagram', web: "Recette d'un site web", main: 'Recette à la main' }[mode]}</span>
            {mode === 'insta' && <div className="lien">{lien || 'Aucun lien trouvé dans le partage'}</div>}
            {mode === 'web' && champ('Lien de la recette', lien, setLien, 'marmiton.org/crepes', 'url')}
            {champ(mode === 'insta' ? '2-3 mots pour la retrouver' : 'Nom du plat', nom, setNom, mode === 'insta' ? 'ravioles ricotta' : 'Gratin de patates')}
            {mode === 'main' && (
              <>
                <ChampIngredients texte={ing} setTexte={setIng} pour={pour} setPour={setPour} />
                <label className="champ">
                  <span>Étapes <em className="petit">(facultatif)</em></span>
                  <textarea rows={4} value={etapes} onChange={(e) => setEtapes(e.target.value)} placeholder={'Une ligne par étape'} />
                </label>
              </>
            )}
            {erreur && <div className="alerte" role="alert">{erreur}</div>}
            <div className="boutons">
              <button type="button" className="secondaire" onClick={fermer}>Annuler</button>
              <button className="principal" disabled={attente}>{attente ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
