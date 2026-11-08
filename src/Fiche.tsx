import { useState } from 'react';
import { LogoType, Pastille } from './Carnet';
import { ChampIngredients, Personnes } from './Ingredients';
import { couleurDe, deplacer, versTexte, type Membre, type Recette, type Statut } from './lib/carnet';
import { afficherQty } from './lib/courses';
import { parseIngredients } from './lib/ingredients';
import { norm } from './lib/texte';

type Props = {
  r: Recette; categories: string[]; membres: Membre[]; statuts: Statut[]; moi: string;
  modifier: (patch: Partial<Recette>) => Promise<void>;
  marquer: (fait: boolean) => Promise<void>;
  supprimer: () => Promise<void>;
  mettreAuMenu: (personnes: number) => void;
  photo: (f: File | null) => Promise<void>; // null = retirer
  editerIngredients?: boolean; // ouvre directement le champ (depuis Menu ou Courses)
  fermer: () => void;
};

export default function Fiche({ r, categories, membres, statuts, moi, modifier, marquer, supprimer, mettreAuMenu, photo, editerIngredients, fermer }: Props) {
  const [pers, setPers] = useState(r.portions);
  const [edIng, setEdIng] = useState<string | null>(editerIngredients ? versTexte(r.ingredients, r.portions) : null);
  const [edEtapes, setEdEtapes] = useState<string | null>(null);
  const [edNom, setEdNom] = useState<{ nom: string; mots: string } | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [menuPhoto, setMenuPhoto] = useState(false);
  const [nouvCat, setNouvCat] = useState<string | null>(null);
  // Ligne dont le menu ⋯ (Monter / Descendre) est ouvert.
  const [bouge, setBouge] = useState<{ liste: 'ing' | 'eta'; k: number } | null>(null);
  // Tirer la fiche vers le bas (depuis le haut, photo ou poignée) pour la fermer, au lieu de la croix.
  const [tire, setTire] = useState<{ y0: number; dy: number; t: number; v: number } | null>(null);
  const [part, setPart] = useState(false);
  // Fermeture : la fiche finit de descendre en douceur (0,4 s), puis disparaît.
  const partir = () => {
    setPart(true);
    setTimeout(fermer, 400);
  };
  const tirer = {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setTire({ y0: e.clientY, dy: 0, t: e.timeStamp, v: 0 });
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!tire) return;
      const dy = Math.max(0, e.clientY - tire.y0);
      setTire({ ...tire, dy, t: e.timeStamp, v: (dy - tire.dy) / Math.max(1, e.timeStamp - tire.t) });
    },
    // Lâchée assez bas, ou lancée d'un petit coup vers le bas : elle part. Sinon elle remonte.
    onPointerUp: () => {
      if (tire && (tire.dy > 90 || (tire.dy > 20 && tire.v > 0.5))) partir();
      setTire(null);
    },
    onPointerCancel: () => setTire(null),
  };
  const choisi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setEnvoi(true);
    setMenuPhoto(false);
    await photo(f);
    setEnvoi(false);
  };
  const fait = (m: string) => statuts.some((s) => s.recette === r.id && s.membre === m && s.valeur === 'deja_faite');
  const auteur = membres.find((m) => m.id === r.ajoutee_par);
  const etapes = r.etapes.split('\n').map((s) => s.trim()).filter(Boolean);
  const ajouterCat = (c: string) => {
    const nom = categories.find((x) => norm(x) === norm(c)) ?? c.trim(); // « apero » rejoint « Apéro » si elle existe
    if (nom && !r.categories.includes(nom)) modifier({ categories: [...r.categories, nom] });
    setNouvCat(null);
  };
  const points = (liste: 'ing' | 'eta', k: number, n: number) => {
    const ouvert = bouge?.liste === liste && bouge.k === k;
    const bouger = (sens: -1 | 1) => {
      setBouge({ liste, k: k + sens });
      if (liste === 'ing') modifier({ ingredients: deplacer(r.ingredients, k, sens) });
      else modifier({ etapes: deplacer(etapes, k, sens).join('\n') });
    };
    return (
      <>
        <button className="points" aria-label="Déplacer la ligne" aria-expanded={ouvert} onClick={() => setBouge(ouvert ? null : { liste, k })}>⋯</button>
        {ouvert && (
          <div className="menu-points">
            <button disabled={k === 0} onClick={() => bouger(-1)}>↑ Monter</button>
            <button disabled={k === n - 1} onClick={() => bouger(1)}>↓ Descendre</button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={part ? 'voile part' : 'voile'} onClick={partir}>
      <div role="dialog" aria-label={r.nom} className="feuille fiche" onClick={(e) => e.stopPropagation()}
        style={part ? { transform: 'translateY(100%)', transition: 'transform 0.4s cubic-bezier(0.3, 0, 0.2, 1)' } : tire ? { transform: `translateY(${tire.dy}px)`, transition: 'none' } : undefined}>
        <div className={r.photo ? 'haut avec-photo' : 'haut'} style={{ background: couleurDe(r) }} {...tirer}>
          <span className="poignee" aria-hidden="true" />
          {r.photo ? <img src={r.photo} alt={`Photo : ${r.nom}`} /> : <span className="initiale" aria-hidden="true">{r.nom.trim()[0]?.toUpperCase()}</span>}
          <span className="badges"><Pastille membre={auteur} /><LogoType type={r.type} /></span>
          {r.photo && (
            <button className="crayon" aria-label="Modifier la photo" aria-expanded={menuPhoto} onClick={() => setMenuPhoto(!menuPhoto)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></svg>
            </button>
          )}
          <button className="fermer" aria-label="Fermer" onClick={partir}>
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

          {envoi && <span className="petit">Envoi de la photo…</span>}
          {!envoi && (!r.photo || menuPhoto) && (
          <div className={menuPhoto ? 'photo-boutons menu-photo' : 'photo-boutons'}>
            {(
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
                {menuPhoto && (
                  <div className="boutons">
                    <button className="lien-bouton" onClick={() => setMenuPhoto(false)}>Annuler</button>
                    <button className="lien-bouton rouge" onClick={() => { setMenuPhoto(false); photo(null); }}>Supprimer la photo</button>
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {r.lien && (
            <a className="sombre" href={r.lien} target="_blank" rel="noreferrer">{r.type === 'insta' ? 'Voir la vidéo sur Instagram' : 'Voir la recette sur le site'}</a>
          )}

          <div className="categories enveloppe">
            {r.categories.map((c) => (
              <button key={c} aria-pressed="true" aria-label={`Retirer la catégorie ${c}`} onClick={() => modifier({ categories: r.categories.filter((x) => x !== c) })}>{c} ×</button>
            ))}
            {nouvCat === null ? (
              <select className="liste" value="" aria-label="Ajouter une catégorie" onChange={(e) => (e.target.value === '__nouvelle' ? setNouvCat('') : ajouterCat(e.target.value))}>
                <option value="">+ Catégorie</option>
                {categories.filter((c) => !r.categories.includes(c)).map((c) => <option key={c}>{c}</option>)}
                <option value="__nouvelle">Nouvelle catégorie…</option>
              </select>
            ) : (
              <form className="nouvelle-cat" onSubmit={(e) => { e.preventDefault(); ajouterCat(nouvCat); }}>
                <input value={nouvCat} onChange={(e) => setNouvCat(e.target.value)} placeholder="Apéro, batch…" aria-label="Nom de la nouvelle catégorie" autoFocus />
                <button type="button" className="secondaire" onClick={() => setNouvCat(null)}>Annuler</button>
                <button className="principal">OK</button>
              </form>
            )}
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
                    {r.ingredients.map((i, k) => <li key={k} style={{ animationDelay: `${Math.min(k, 12) * 60}ms` }}><span>{i.name}</span><span className="qte">{afficherQty(i.qty * pers, i.unit, i.name)}</span>{points('ing', k, r.ingredients.length)}</li>)}
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
                {etapes.length > 0 && <ol className="etapes">{etapes.map((s, k) => <li key={k}><span style={{ background: couleurDe(r) }}>{k + 1}</span><p>{s}</p>{points('eta', k, etapes.length)}</li>)}</ol>}
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
