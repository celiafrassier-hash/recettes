import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Connexion from './Connexion';
import { supabase } from './lib/supabase';
import { cleLien, extraireLien } from './lib/liens';

// Étape 1 du cahier des charges : tester le partage depuis Insta avant tout le reste.
// shortcut: enregistrements gardés dans ce téléphone seulement ; remplacé par Supabase à l'étape 2.
type Essai = { cle: string; lien: string; motsCles: string; date: string };
const STOCK = 'recettes-essais';

function lireEssais(): Essai[] {
  try {
    return JSON.parse(localStorage.getItem(STOCK) || '[]');
  } catch {
    return [];
  }
}

function lirePartage() {
  const p = new URLSearchParams(location.search);
  const recu = { title: p.get('title'), text: p.get('text'), url: p.get('url') };
  const lien = extraireLien(recu.url, recu.text, recu.title);
  return recu.title || recu.text || recu.url ? { recu, lien } : null;
}

export default function App() {
  const [partage, setPartage] = useState(lirePartage);
  const [motsCles, setMotsCles] = useState('');
  const [essais, setEssais] = useState(lireEssais);
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [prenom, setPrenom] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return setPrenom(null);
    supabase.from('membre').select('prenom').eq('email', session.user.email!.toLowerCase()).maybeSingle()
      .then(({ data }) => setPrenom(data?.prenom ?? ''));
  }, [session]);

  function enregistrer() {
    if (!partage?.lien) return;
    const cle = cleLien(partage.lien) ?? partage.lien;
    const deja = essais.find((e) => e.cle === cle);
    if (deja) {
      setMessage(`Déjà dans le carnet : « ${deja.motsCles} ».`);
      return;
    }
    if (!motsCles.trim()) {
      setMessage('Écris 2-3 mots pour la retrouver.');
      return;
    }
    const suivants = [{ cle, lien: partage.lien, motsCles: motsCles.trim(), date: new Date().toLocaleString('fr-FR') }, ...essais];
    localStorage.setItem(STOCK, JSON.stringify(suivants));
    setEssais(suivants);
    setPartage(null);
    setMotsCles('');
    setMessage('Enregistrée ✓');
    history.replaceState(null, '', location.pathname);
  }

  return (
    <main className="page">
      <header className="entete">
        <span className="surtitre">Test du partage</span>
        <h1>Popote</h1>
        {prenom && <span className="petit">Bonjour {prenom}</span>}
      </header>

      {session === undefined ? null : !session ? <Connexion /> : prenom === '' ? (
        <section className="carte"><div className="alerte" role="alert">Ton adresse n’est pas dans la liste des membres. Demande à Celia de l’ajouter.</div></section>
      ) : (<>

      {partage ? (
        <section className="carte" aria-label="Ajouter depuis Instagram">
          <span className="etiquette">Partagé depuis Instagram</span>
          <div className="lien">{partage.lien ?? 'Aucun lien trouvé dans le partage'}</div>
          {partage.lien && cleLien(partage.lien)?.startsWith('instagram:') && (
            <div className="petit">Vidéo reconnue : {cleLien(partage.lien)!.slice(10)}</div>
          )}
          <label className="champ">
            <span>2-3 mots pour la retrouver</span>
            <input autoFocus value={motsCles} onChange={(e) => setMotsCles(e.target.value)} placeholder="ex. ravioles ricotta" />
          </label>
          {message && <div className="alerte" role="alert">{message}</div>}
          <div className="boutons">
            <button className="secondaire" onClick={() => { setPartage(null); setMessage(''); }}>Annuler</button>
            <button className="principal" onClick={enregistrer}>Enregistrer</button>
          </div>
          <details className="petit">
            <summary>Ce que le téléphone a envoyé</summary>
            <pre>{JSON.stringify(partage.recu, null, 2)}</pre>
          </details>
        </section>
      ) : (
        <section className="carte">
          <p>Pour tester : dans Instagram, ouvre une vidéo, touche <strong>Partager</strong>, puis choisis <strong>Popote</strong>.</p>
          <p className="petit">Si « Popote » n'apparaît pas : installe d'abord l'appli sur l'écran d'accueil (menu ⋮ de Chrome → « Installer l'application »).</p>
          {message && <div className="ok" role="status">{message}</div>}
        </section>
      )}

      <section className="liste">
        <h2>Enregistrées ({essais.length})</h2>
        {essais.map((e) => (
          <a key={e.cle} className="ligne" href={e.lien} target="_blank" rel="noreferrer">
            <strong>{e.motsCles}</strong>
            <span className="petit">{e.date}</span>
          </a>
        ))}
      </section>
      </>)}
    </main>
  );
}
