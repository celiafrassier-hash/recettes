import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Ajout, { type Ajouter } from './Ajout';
import Carnet from './Carnet';
import Connexion from './Connexion';
import Fiche from './Fiche';
import type { Membre, Recette, Statut } from './lib/carnet';
import { cleLien, extraireLien } from './lib/liens';
import { supabase } from './lib/supabase';

// Essais de l'étape 1, gardés dans le téléphone : proposés une fois pour passer dans le carnet partagé.
type Essai = { cle: string; lien: string; motsCles: string };
const STOCK = 'recettes-essais';
function lireEssais(): Essai[] {
  try {
    return JSON.parse(localStorage.getItem(STOCK) || '[]');
  } catch {
    return [];
  }
}

// Lien reçu par le menu Partager d'Android (Web Share Target) ; undefined = rien partagé.
function lirePartage(): string | null | undefined {
  const p = new URLSearchParams(location.search);
  if (!p.get('title') && !p.get('text') && !p.get('url')) return undefined;
  history.replaceState(null, '', location.pathname);
  return extraireLien(p.get('url'), p.get('text'), p.get('title'));
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [membres, setMembres] = useState<(Membre & { email: string })[] | null>(null);
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [ajout, setAjout] = useState<{ lien?: string | null } | null>(() => {
    const lien = lirePartage();
    return lien === undefined ? null : { lien };
  });
  const [message, setMessage] = useState('');
  const [essais, setEssais] = useState(lireEssais);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const charger = useCallback(async () => {
    const [m, r, s] = await Promise.all([
      supabase.from('membre').select('id, prenom, initiale, email'),
      supabase.from('recette').select('*').order('creee_le', { ascending: false }),
      supabase.from('statut').select('*'),
    ]);
    if (m.error || r.error || s.error) return setMessage('Pas de réseau : le carnet n’a pas pu se mettre à jour.');
    setMembres(m.data);
    setRecettes(r.data);
    setStatuts(s.data);
  }, []);

  // Recharge à l'ouverture et quand on revient sur l'appli (l'autre a pu ajouter une recette).
  useEffect(() => {
    if (!session) return;
    charger();
    const revenir = () => document.visibilityState === 'visible' && charger();
    document.addEventListener('visibilitychange', revenir);
    return () => document.removeEventListener('visibilitychange', revenir);
  }, [session, charger]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const moi = membres?.find((m) => m.email === session?.user.email?.toLowerCase());

  const ajouter: Ajouter = async (nouvelle) => {
    const deja = nouvelle.cle_lien && recettes.find((r) => r.cle_lien === nouvelle.cle_lien);
    if (deja) {
      setAjout(null);
      setOuverte(deja.id);
      return setMessage('Déjà dans le carnet');
    }
    const { data, error } = await supabase.from('recette').insert(nouvelle).select().single();
    if (error?.code === '23505') {
      await charger(); // ajoutée entre-temps par l'autre
      return 'Déjà dans le carnet : elle vient d’être ajoutée.';
    }
    if (error) return 'Pas enregistrée (réseau ?). Réessaie.';
    setRecettes((l) => [data, ...l]);
    setAjout(null);
    setMessage('Enregistrée ✓');
  };

  async function modifier(id: string, patch: Partial<Recette>) {
    const { data, error } = await supabase.from('recette').update(patch).eq('id', id).select().single();
    if (error) return setMessage('Pas enregistré (réseau ?). Réessaie.');
    setRecettes((l) => l.map((r) => (r.id === id ? data : r)));
  }

  async function marquer(id: string, fait: boolean) {
    const ligne: Statut = { recette: id, membre: moi!.id, valeur: fait ? 'deja_faite' : 'a_tester' };
    const { error } = await supabase.from('statut').upsert(ligne);
    if (error) return setMessage('Pas enregistré (réseau ?). Réessaie.');
    setStatuts((l) => [...l.filter((s) => !(s.recette === id && s.membre === ligne.membre)), ligne]);
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from('recette').delete().eq('id', id);
    if (error) return setMessage('Pas supprimée (réseau ?). Réessaie.');
    setRecettes((l) => l.filter((r) => r.id !== id));
    setOuverte(null);
    setMessage('Recette supprimée');
  }

  async function importerEssais() {
    for (const e of essais) {
      const cle = cleLien(e.lien);
      if (cle && recettes.some((r) => r.cle_lien === cle)) continue;
      const { error } = await supabase.from('recette').insert({ type: 'insta', nom: e.motsCles, mots_cles: e.motsCles, lien: e.lien, cle_lien: cle, portions: 4 });
      if (error && error.code !== '23505') return setMessage('Pas enregistrée (réseau ?). Réessaie.');
    }
    localStorage.removeItem(STOCK);
    setEssais([]);
    await charger();
    setMessage('Ajoutée au carnet ✓');
  }

  const fiche = recettes.find((r) => r.id === ouverte);

  return (
    <main className="page">
      <header className="entete">
        <span className="surtitre">{moi ? `Bonjour ${moi.prenom}` : 'Le carnet de recettes'}</span>
        <h1>Popote</h1>
      </header>

      {session === undefined ? null : !session ? (
        <Connexion />
      ) : membres && !moi ? (
        <section className="carte"><div className="alerte" role="alert">Ton adresse n’est pas dans la liste des membres. Demande à Celia de l’ajouter.</div></section>
      ) : moi ? (
        <>
          {essais.length > 0 && (
            <section className="carte">
              <p>{essais.length === 1 ? `« ${essais[0].motsCles} » est` : `${essais.length} recettes sont`} restée{essais.length > 1 ? 's' : ''} dans ce téléphone depuis le test.</p>
              <div className="boutons">
                <button className="secondaire" onClick={() => { localStorage.removeItem(STOCK); setEssais([]); }}>Oublier</button>
                <button className="principal" onClick={importerEssais}>Mettre dans le carnet</button>
              </div>
            </section>
          )}
          <Carnet recettes={recettes} membres={membres!} statuts={statuts} moi={moi.id} ouvrir={setOuverte} />
          <nav className="barre" aria-label="Navigation">
            <span className="onglet" aria-current="page">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></svg>
              Recettes
            </span>
            <button className="plus" aria-label="Ajouter une recette" onClick={() => setAjout({})}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </nav>
          {fiche && (
            <Fiche key={fiche.id} r={fiche} membres={membres!} statuts={statuts} moi={moi.id}
              modifier={(p) => modifier(fiche.id, p)} marquer={(f) => marquer(fiche.id, f)} supprimer={() => supprimer(fiche.id)} fermer={() => setOuverte(null)} />
          )}
          {ajout && <Ajout lienPartage={ajout.lien} ajouter={ajouter} fermer={() => setAjout(null)} />}
        </>
      ) : null}

      {message && <div className="toast" role="status">{message}</div>}
    </main>
  );
}
