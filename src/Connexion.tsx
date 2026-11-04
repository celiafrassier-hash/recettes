import { useState } from 'react';
import { supabase } from './lib/supabase';

// Connexion par code à 6 chiffres reçu par mail (une seule fois, la session reste ouverte).
export default function Connexion() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [etape, setEtape] = useState<'mail' | 'code'>('mail');
  const [message, setMessage] = useState('');
  const [attente, setAttente] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const adresse = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(adresse)) return setMessage('Écris ton adresse mail.');
    setAttente(true);
    // shouldCreateUser: false → une adresse inconnue ne crée pas de compte
    const { error } = await supabase.auth.signInWithOtp({ email: adresse, options: { shouldCreateUser: false } });
    setAttente(false);
    if (error) return setMessage(error.status === 429 ? 'Trop d’essais. Réessaie dans quelques minutes.' : 'Cette adresse n’a pas accès à Popote.');
    setEmail(adresse);
    setMessage('');
    setEtape('code');
  }

  async function verifier(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setMessage('Le code fait 6 chiffres.');
    setAttente(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setAttente(false);
    if (error) setMessage('Code faux ou trop vieux. Vérifie le dernier mail reçu.');
  }

  return (
    <section className="carte" aria-label="Connexion">
      {etape === 'mail' ? (
        <form onSubmit={envoyer}>
          <label className="champ">
            <span>Ton adresse mail</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setMessage(''); }} placeholder="prenom@gmail.com" />
          </label>
          {message && <div className="alerte" role="alert">{message}</div>}
          <div className="boutons">
            <button className="principal" disabled={attente}>{attente ? 'Envoi…' : 'Recevoir un code'}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={verifier}>
          <p>Code envoyé à <strong>{email}</strong>. Regarde aussi dans les spams.</p>
          <label className="champ">
            <span>Code à 6 chiffres</span>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setMessage(''); }} placeholder="123456" />
          </label>
          {message && <div className="alerte" role="alert">{message}</div>}
          <div className="boutons">
            <button type="button" className="secondaire" onClick={() => { setEtape('mail'); setCode(''); setMessage(''); }}>Changer d’adresse</button>
            <button className="principal" disabled={attente}>{attente ? 'Vérification…' : 'Entrer'}</button>
          </div>
        </form>
      )}
    </section>
  );
}
