import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

export const ADRESSE_AJOUT = 'https://kbfictvldzuogtiyipmk.supabase.co/functions/v1/ajout';
const GUIDE = 'https://github.com/celiafrassier-hash/recettes/blob/main/docs/raccourci-iphone.md';

// Donne à la personne connectée SON jeton, à coller une fois dans le raccourci iPhone.
export default function Raccourci({ fermer }: { fermer: () => void }) {
  const [jeton, setJeton] = useState<string | null>(null);
  const [erreur, setErreur] = useState('');
  const [copie, setCopie] = useState('');

  useEffect(() => {
    supabase.rpc('mon_jeton').then(({ data, error }) => (error ? setErreur('Pas de réseau, ou le raccourci n’est pas encore installé dans Supabase.') : setJeton(data)));
  }, []);

  async function copier(quoi: string, texte: string) {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(quoi);
    } catch {
      setCopie('');
    }
  }

  return (
    <div className="voile" onClick={fermer}>
      <div role="dialog" aria-label="Raccourci iPhone" className="feuille" onClick={(e) => e.stopPropagation()}>
        <div className="poignee" />
        <h2>Raccourci iPhone</h2>
        <p>Sur iPhone, Popote n'apparaît pas dans Partager. Le raccourci « Ajouter à Popote » fait le travail : Partager, Ajouter à Popote, 2-3 mots, c'est enregistré.</p>
        <p className="petit">À régler une seule fois, avec le guide. Il te demandera ces deux choses :</p>
        <span className="etiquette">Adresse</span>
        <div className="lien">{ADRESSE_AJOUT}</div>
        <button className="secondaire plein" onClick={() => copier('adresse', ADRESSE_AJOUT)}>{copie === 'adresse' ? 'Adresse copiée ✓' : 'Copier l’adresse'}</button>
        <span className="etiquette">Ton jeton (secret, ne le donne à personne)</span>
        {erreur ? <div className="alerte">{erreur}</div> : <div className="lien">{jeton ?? '…'}</div>}
        {jeton && <button className="secondaire plein" onClick={() => copier('jeton', jeton)}>{copie === 'jeton' ? 'Jeton copié ✓' : 'Copier le jeton'}</button>}
        <a className="sombre" href={GUIDE} target="_blank" rel="noreferrer">Ouvrir le guide pas à pas</a>
        <button className="lien-bouton" onClick={fermer}>Fermer</button>
      </div>
    </div>
  );
}
