import { useState } from 'react';
import { LogoType, Pastille } from './Carnet';
import { ChampIngredients, Personnes } from './Ingredients';
import { CATEGORIES, couleurDe, versTexte, type Membre, type Recette, type Statut } from './lib/carnet';
import { afficherQty } from './lib/courses';
import { parseIngredients } from './lib/ingredients';

type Props = {
  r: Recette; membres: Membre[]; statuts: Statut[]; moi: string;
  modifier: (patch: Partial<Recette>) => Promise<void>;
  marquer: (fait: boolean) => Promise<void>;
  supprimer: () => Promise<void>;
  mettreAuMenu: (personnes: number) => void;
  photo: (f: File | null) => Promise<void>; // null = retirer
  editerIngredients?: boolean; // ouvre directement le champ (depuis Menu ou Courses)
  fermer: () => void;
};

export default function Fiche({ r, membres, statuts, moi, modifier, marquer, supprimer, mettreAuMenu, photo, editerIngredients, fermer }: Props) {
  const [pers, setPers] = useState(r.portions);
  const [edIng, setEdIng] = useState<string | null>(editerIngredients ? versTexte(r.ingredients, r.portions) : null);
  const [edEtapes, setEdEtapes] = useState<string | null>(null);
  const [edNom, setEdNom] = useState<{ nom: string; mots: string } | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const choisi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setEnvoi(true);
    await photo(f);
    setEnvoi(false);
  };
  const fait = (m: string) => statuts.some((s) => s.recette === r.id && s.membre === m && s.valeur === 'deja_faite');
  const auteur = membres.find((m) => m.id === r.ajoutee_par);
  const etapes = r.etapes.split('\n').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="voile" onClick={fermer}>
      <div role="dialog" aria-label={r.nom} className="feuille fiche" onClick={(e) => e.stopPropagation()}>
        <div className={r.photo ? 'haut avec-photo' : 'haut'} style={{ background: couleurDe(r) }}>
          {r.photo ? <img src={r.photo} alt={`Photo : ${r.nom}`} /> : <span className="initiale" aria-hidden="true">{r.nom.trim()[0]?.toUpperCase()}</span>}
          <span className="badges"><Pastille membre={auteur} /><LogoType type={r.type} /></span>
          <button className="fermer" aria-label="Fermer" onClick={fermer}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="corps">
          <div className="titre">
            <span className="etiquette">{membres.map((m) => `${m.id === moi ? 'Moi' : m.prenom} : ${fait(m.id) ? 'déjà faite' : m.id === moi ? 'à tester' : 'pas encore'}`).join(' · ')}</span>
            {auteur && <span className="petit">Ajoutée par {auteur.id === moi ? 'moi' : auteur.prenom}</span>}
            {edNom ? (
              <form className="edition" onSubmit={async (e) => { e.preventDefault(); if (!edNom.nom.trim()) return; await modifier({ nom: edNom.nom.trim(), mots_cles: edNom.mots.trim() }); setEdNom(null); }}>
                <label className="champ"><span>Nom</span><input value={edNom.nom} onChange={(e) => setEdNom({ ...edNom, nom: e.target.value })} autoFocus /></label>
                <label className="champ"><span>Mots-clés</span><input value={edNom.mots} onChange={(e) => setEdNom({ ...edNom, mots: e.target.value })} placeholder="ravioles ricotta" /></label>
                <div className="boutons"><button type="button" className="secondaire" onClick={() => setEdNom(null)}>Annuler</button><button className="principal">Enregistrer</button></div>
              </form>
            ) : (
              <>
                <h2>{r.nom}</h2>
                {r.mots_cles && r.mots_cles !== r.nom && <span className="petit">Mots-clés : {r.mots_cles}</span>}
                <button className="lien-bouton gauche" onClick={() => setEdNom({ nom: r.nom, mots: r.mots_cles })}>Modifier le nom ou les mots-clés</button>
              </>
            )}
          </div>

          <div className="photo-boutons">
            {envoi ? <span className="petit">Envoi de la photo…</span> : (
              <>
                <label className="secondaire">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                  Prendre une photo
                  <input type="file" accept="image/*" capture="environment" onChange={choisi} />
                </label>
                <label className="secondaire">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>
                  Choisir dans la galerie
                  <input type="file" accept="image/*" onChange={choisi} />
                </label>
              </>
            )}
          </div>
          {r.photo && !envoi && <button className="lien-bouton gauche" onClick={() => photo(null)}>Retirer la photo</button>}

          {r.lien && (
            <a className="sombre" href={r.lien} target="_blank" rel="noreferrer">{r.type === 'insta' ? 'Voir la vidéo sur Instagram' : 'Voir la recette sur le site'}</a>
          )}

          <div className="categories enveloppe">
            {CATEGORIES.map((c) => (
              <button key={c} aria-pressed={r.categories.includes(c)} onClick={() => modifier({ categories: r.categories.includes(c) ? r.categories.filter((x) => x !== c) : [...r.categories, c] })}>{c}</button>
            ))}
          </div>

          <section className="bloc">
            {edIng !== null ? (
              <>
                <ChampIngredients texte={edIng} setTexte={setEdIng} pour={pers} setPour={setPers} />
                <div className="boutons">
                  <button className="secondaire" onClick={() => setEdIng(null)}>Annuler</button>
                  <button className="principal" onClick={async () => { await modifier({ ingredients: parseIngredients(edIng, pers), portions: pers }); setEdIng(null); }}>Enregistrer</button>
                </div>
              </>
            ) : (
              <>
                <div className="ligne-titre"><h3>Ingrédients</h3>{r.ingredients.length > 0 && <Personnes n={pers} setN={setPers} />}</div>
                {r.ingredients.length ? (
                  <ul className="ingredients">
                    {r.ingredients.map((i, k) => <li key={k}><span>{i.name}</span><span>{afficherQty(i.qty * pers, i.unit, i.name)}</span></li>)}
                  </ul>
                ) : (
                  <div className="alerte">Pas encore d'ingrédients. Ajoute-les d'un trait (« 250 g ricotta, 1 paquet ravioles ») pour qu'ils aillent dans la liste de courses.</div>
                )}
                <button className="pointilles" onClick={() => setEdIng(versTexte(r.ingredients, pers))}>+ Ajouter ou modifier</button>
              </>
            )}
          </section>

          <section className="bloc">
            <h3>Étapes</h3>
            {edEtapes !== null ? (
              <>
                <label className="champ"><span className="petit">Une ligne par étape. Note tes astuces pour la prochaine fois.</span>
                  <textarea rows={6} value={edEtapes} onChange={(e) => setEdEtapes(e.target.value)} autoFocus /></label>
                <div className="boutons">
                  <button className="secondaire" onClick={() => setEdEtapes(null)}>Annuler</button>
                  <button className="principal" onClick={async () => { await modifier({ etapes: edEtapes.trim() }); setEdEtapes(null); }}>Enregistrer</button>
                </div>
              </>
            ) : (
              <>
                {etapes.length > 0 && <ol className="etapes">{etapes.map((s, k) => <li key={k}><span style={{ background: couleurDe(r) }}>{k + 1}</span>{s}</li>)}</ol>}
                <button className="pointilles" onClick={() => setEdEtapes(r.etapes)}>+ Ajouter ou modifier une étape</button>
              </>
            )}
          </section>

          <div className="boutons">
            <button className={fait(moi) ? 'principal fait' : 'secondaire'} aria-pressed={fait(moi)} onClick={() => marquer(!fait(moi))}>
              {fait(moi) ? 'Déjà faite ✓' : 'Je l’ai faite'}
            </button>
            <button className="principal" onClick={() => mettreAuMenu(pers === r.portions ? 1 : pers)}>Mettre au menu</button>
          </div>

          {confirme ? (
            <div role="alertdialog" className="alerte confirme">
              <span>Supprimer « {r.nom} » ? Elle disparaît aussi pour {membres.filter((m) => m.id !== moi).map((m) => m.prenom).join(' et ') || 'les autres'}.</span>
              <div className="boutons">
                <button className="secondaire" onClick={() => setConfirme(false)}>Annuler</button>
                <button className="danger" onClick={supprimer}>Supprimer</button>
              </div>
            </div>
          ) : (
            <button className="lien-bouton rouge" onClick={() => setConfirme(true)}>Supprimer la recette</button>
          )}
        </div>
      </div>
    </div>
  );
}
