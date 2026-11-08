import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import Ajout, { type Ajouter } from './Ajout';
import Carnet from './Carnet';
import Connexion from './Connexion';
import Courses from './Courses';
import Fiche from './Fiche';
import type { Rayon } from './lib/aliments';
import { norm } from './lib/texte';
import { couleurDe, toutesCategories, type Membre, type Recette, type Statut } from './lib/carnet';
import { cleLien, extraireLien } from './lib/liens';
import { JOURS_LONGS, reunir, toucher, type AjLigne, type CaseLigne, type Choix, type Moment } from './lib/menu';
import { reduire } from './lib/photo';
import { cleSemaine, lundiDe, semaineParDefaut } from './lib/semaines';
import { supabase } from './lib/supabase';
import Menu from './Menu';
import Raccourci from './Raccourci';

type Onglet = 'carnet' | 'menu' | 'courses';
type Donnees = { email: string; membres: (Membre & { email: string })[]; recettes: Recette[]; statuts: Statut[]; cases: CaseLigne[]; ajustements: AjLigne[]; categories?: string[]; rayons?: Record<string, Rayon> };

// Copie dans le téléphone : l'appli s'ouvre au magasin sans réseau (§2.6).
const COPIE = 'popote-copie';
// Coches et × faits sans réseau : envoyés au retour du réseau.
const FILE = 'popote-file';
const lire = <T,>(cle: string, defaut: T): T => {
  try {
    return JSON.parse(localStorage.getItem(cle) || 'null') ?? defaut;
  } catch {
    return defaut;
  }
};
const ecrire = (cle: string, v: unknown) => {
  try {
    localStorage.setItem(cle, JSON.stringify(v));
  } catch {
    /* stockage plein ou bloqué : l'appli marche quand même en ligne */
  }
};

// Essais de l'étape 1, gardés dans le téléphone : proposés une fois pour passer dans le carnet partagé.
type Essai = { cle: string; lien: string; motsCles: string };
const STOCK = 'recettes-essais';

// Lien reçu par le menu Partager d'Android (Web Share Target) ; undefined = rien partagé.
function lirePartage(): string | null | undefined {
  const p = new URLSearchParams(location.search);
  if (!p.get('title') && !p.get('text') && !p.get('url')) return undefined;
  history.replaceState(null, '', location.pathname);
  return extraireLien(p.get('url'), p.get('text'), p.get('title'));
}

// Le raccourci ne sert que sur iPhone/iPad (Android a Popote dans Partager). iPad récent se dit « Mac » avec écran tactile.
const IPHONE = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const ERREUR = 'Pas enregistré (réseau ?). Réessaie.';

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [d, setD] = useState<Donnees | null>(null);
  const [onglet, setOnglet] = useState<Onglet>('carnet');
  const [semaine, setSemaine] = useState(() => semaineParDefaut(new Date()));
  const [choix, setChoix] = useState<Choix | null>(null);
  const [demande, setDemande] = useState<string | null>(null); // recette sans ingrédients posée au menu
  const [ouverte, setOuverte] = useState<{ id: string; ingredients?: boolean } | null>(null);
  // Animations du carnet : rebond de la carte ajoutée ou remplie, barres pendant la lecture du lien.
  const [nouvelle, setNouvelle] = useState<string | null>(null);
  const [lecture, setLecture] = useState<string | null>(null);
  const rebond = (id: string) => {
    setNouvelle(id);
    setTimeout(() => setNouvelle((x) => (x === id ? null : x)), 1200);
  };
  const [ajout, setAjout] = useState<{ lien?: string | null } | null>(() => {
    const lien = lirePartage();
    return lien === undefined ? null : { lien };
  });
  const [message, setMessage] = useState('');
  const [raccourci, setRaccourci] = useState(false);
  const [essais, setEssais] = useState<Essai[]>(() => lire(STOCK, []));
  const enCours = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const maj = useCallback((f: (d: Donnees) => Donnees) => {
    setD((avant) => {
      if (!avant) return avant;
      const apres = f(avant);
      ecrire(COPIE, apres);
      return apres;
    });
  }, []);

  const charger = useCallback(async (email: string) => {
    if (enCours.current) return;
    enCours.current = true;
    const file: AjLigne[] = lire(FILE, []);
    if (file.length) {
      const { error } = await supabase.from('ajustement').upsert(file);
      if (!error) localStorage.removeItem(FILE);
    }
    const [m, r, s, c, a, k, ry] = await Promise.all([
      supabase.from('membre').select('id, prenom, initiale, email'),
      supabase.from('recette').select('*').order('creee_le', { ascending: false }),
      supabase.from('statut').select('*'),
      supabase.from('case_menu').select('semaine, jour, moment, plat, recette, plaisir, personnes, note'),
      supabase.from('ajustement').select('semaine, cle, coche, retire, qty, ajoute, nom, unite'),
      supabase.from('categorie').select('nom').order('nom'),
      supabase.from('rayon_aliment').select('cle, rayon'),
    ]);
    enCours.current = false;
    if (m.error || r.error || s.error || c.error || a.error || k.error) {
      const copie = lire<Donnees | null>(COPIE, null);
      if (copie?.email === email) setD((x) => x ?? copie);
      return setMessage('Pas de réseau : tu vois la dernière version gardée.');
    }
    // Les coches encore en attente gardent le dessus sur ce que dit le serveur.
    const enAttente: AjLigne[] = lire(FILE, []);
    const ajustements = [...a.data.filter((x) => !enAttente.some((y) => y.semaine === x.semaine && y.cle === x.cle)), ...enAttente];
    const tout = { email, membres: m.data, recettes: r.data, statuts: s.data, cases: c.data, ajustements, categories: k.data.map((x) => x.nom), rayons: Object.fromEntries((ry.data ?? []).map((x) => [x.cle, x.rayon])) };
    ecrire(COPIE, tout);
    setD(tout);
  }, []);

  // Recharge à l'ouverture, au retour sur l'appli et au retour du réseau (l'autre a pu ajouter une recette).
  useEffect(() => {
    const email = session?.user.email?.toLowerCase();
    if (!email) return;
    const copie = lire<Donnees | null>(COPIE, null);
    if (copie?.email === email) setD((x) => x ?? copie);
    charger(email);
    const revenir = () => document.visibilityState === 'visible' && charger(email);
    document.addEventListener('visibilitychange', revenir);
    window.addEventListener('online', revenir);
    return () => {
      document.removeEventListener('visibilitychange', revenir);
      window.removeEventListener('online', revenir);
    };
  }, [session, charger]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3500);
    return () => clearTimeout(t);
  }, [message]);

  const moi = d?.membres.find((m) => m.email === d.email);
  const recettes = d?.recettes ?? [];
  const sem = cleSemaine(semaine);

  const ajouter: Ajouter = async (nouvelle) => {
    const deja = nouvelle.cle_lien && recettes.find((r) => r.cle_lien === nouvelle.cle_lien);
    if (deja) {
      setAjout(null);
      setOuverte({ id: deja.id });
      return setMessage('Déjà dans le carnet');
    }
    const { data, error } = await supabase.from('recette').insert(nouvelle).select().single();
    if (error?.code === '23505') {
      await charger(d!.email); // ajoutée entre-temps par l'autre
      return 'Déjà dans le carnet : elle vient d’être ajoutée.';
    }
    if (error) return ERREUR;
    maj((x) => ({ ...x, recettes: [data, ...x.recettes] }));
    setAjout(null);
    setMessage('Enregistrée ✓');
    rebond(data.id);
    if (data.lien) remplirDepuisLien(data);
  };

  // Ingrédients, étapes et photo repris du post Insta ou du site web par la fonction « ajout ». Sans réponse : la recette reste lien + nom.
  async function remplirDepuisLien(r: Recette) {
    setLecture(r.id);
    const { data } = await supabase.functions.invoke<Recette | null>('ajout', { body: { remplir: r.id } }).catch(() => ({ data: null }));
    setLecture(null);
    if (!data) return;
    rebond(r.id);
    maj((x) => ({ ...x, recettes: x.recettes.map((y) => (y.id === r.id ? data : y)) }));
    setMessage(`Recette reprise ${r.type === 'insta' ? 'de la légende' : 'du site'} ✓ À relire`);
  }

  async function modifier(id: string, patch: Partial<Recette>) {
    const avant = recettes.find((r) => r.id === id);
    maj((x) => ({ ...x, recettes: x.recettes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    const { data, error } = await supabase.from('recette').update(patch).eq('id', id).select().single();
    if (error) {
      if (avant) maj((x) => ({ ...x, recettes: x.recettes.map((r) => (r.id === id ? avant : r)) }));
      return setMessage(ERREUR);
    }
    maj((x) => ({ ...x, recettes: x.recettes.map((r) => (r.id === id ? data : r)) }));
    if (patch.ingredients?.length && demande === id) setDemande(null);
  }

  // Photo du plat : réduite dans le téléphone, rangée dans le stockage « photos », l'ancienne est effacée.
  async function photo(r: Recette, f: File | null) {
    const ancienne = r.photo?.split('/photos/')[1];
    if (f) {
      let blob: Blob;
      try {
        blob = await reduire(f);
      } catch {
        return setMessage('Cette photo ne peut pas être lue. Essaie une autre.');
      }
      const chemin = `${r.id}/${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('photos').upload(chemin, blob, { contentType: 'image/jpeg' });
      if (error) return setMessage('Photo pas envoyée (réseau ?). Réessaie.');
      await modifier(r.id, { photo: supabase.storage.from('photos').getPublicUrl(chemin).data.publicUrl });
    } else {
      await modifier(r.id, { photo: null });
    }
    if (ancienne) await supabase.storage.from('photos').remove([decodeURIComponent(ancienne)]);
  }

  async function marquer(id: string, fait: boolean) {
    const ligne: Statut = { recette: id, membre: moi!.id, valeur: fait ? 'deja_faite' : 'a_tester' };
    const { error } = await supabase.from('statut').upsert(ligne);
    if (error) return setMessage(ERREUR);
    maj((x) => ({ ...x, statuts: [...x.statuts.filter((s) => !(s.recette === id && s.membre === ligne.membre)), ligne] }));
  }

  async function supprimer(id: string) {
    const auMenu = d!.cases.some((c) => c.recette === id);
    const { error } = await supabase.from('recette').delete().eq('id', id);
    if (error) return setMessage('Pas supprimée (réseau ?). Réessaie.');
    maj((x) => ({ ...x, recettes: x.recettes.filter((r) => r.id !== id), cases: x.cases.filter((c) => c.recette !== id) }));
    setOuverte(null);
    setMessage(auMenu ? 'Recette supprimée : ses cases du menu sont vidées' : 'Recette supprimée');
  }

  // Ajoute un plat au repas : la recette choisie dans la rangée, ou `c` choisie depuis le repas lui-même.
  async function toucherCase(jour: number, moment: Moment, c: Choix | null = choix) {
    if (!c) return setMessage('Choisis d’abord une recette');
    const repas = d!.cases.filter((x) => x.semaine === sem && x.jour === jour && x.moment === moment);
    const geste = toucher(repas, c);
    if (geste.action === 'deja') return setMessage('Déjà dans ce repas');
    const plaisir = c.recette === 'plaisir';
    // La note est celle du repas : un plat ajouté la reprend.
    const ligne: CaseLigne = { semaine: sem, jour, moment, plat: geste.plat, recette: plaisir ? null : c.recette, plaisir, personnes: c.personnes, note: repas[0]?.note ?? null };
    const { error } = await supabase.from('case_menu').upsert(ligne);
    if (error) return setMessage(ERREUR);
    maj((x) => ({ ...x, cases: [...x.cases.filter((y) => !(y.semaine === sem && y.jour === jour && y.moment === moment && y.plat === geste.plat)), ligne] }));
    const r = recettes.find((x) => x.id === ligne.recette);
    if (r && !r.ingredients.length) setDemande(r.id);
  }

  // Repas glissé sur un autre jour : il y va, ou rejoint le repas déjà posé là.
  async function deplacer(de: { jour: number; moment: Moment }, vers: { jour: number; moment: Moment }) {
    const du = (p: typeof de) => (x: CaseLigne) => x.semaine === sem && x.jour === p.jour && x.moment === p.moment;
    const lignes = reunir(d!.cases.filter(du(de)), d!.cases.filter(du(vers)), vers.jour, vers.moment);
    // Enregistrer l'arrivée avant d'effacer le départ : en cas de coupure, rien n'est perdu.
    const { error } = await supabase.from('case_menu').upsert(lignes);
    if (error) return setMessage(ERREUR);
    const { error: e2 } = await supabase.from('case_menu').delete().match({ semaine: sem, jour: de.jour, moment: de.moment });
    if (e2) setMessage(ERREUR);
    maj((x) => ({ ...x, cases: [...x.cases.filter((y) => !du(vers)(y) && (!!e2 || !du(de)(y))), ...lignes] }));
  }

  // Retire un plat du repas, ou tout le repas si aucun plat n'est donné.
  async function enlever(jour: number, moment: Moment, plat?: number) {
    const cible = plat === undefined ? { semaine: sem, jour, moment } : { semaine: sem, jour, moment, plat };
    const { error } = await supabase.from('case_menu').delete().match(cible);
    if (error) return setMessage(ERREUR);
    maj((x) => ({ ...x, cases: x.cases.filter((c) => !(c.semaine === sem && c.jour === jour && c.moment === moment && (plat === undefined || c.plat === plat))) }));
  }

  // Rayon choisi à la main pour un aliment (commun : le jambon cru est au même rayon pour tout le monde).
  async function changerRayon(nom: string, rayon: Rayon) {
    const cle = norm(nom);
    maj((x) => ({ ...x, rayons: { ...x.rayons, [cle]: rayon } }));
    const { error } = await supabase.from('rayon_aliment').upsert({ cle, rayon });
    if (error) setMessage(ERREUR);
  }

  // Supprime la catégorie de la liste commune et la retire de chaque recette qui l'avait.
  async function supprimerCategorie(nom: string) {
    const { error } = await supabase.from('categorie').delete().eq('nom', nom);
    if (error) return setMessage(ERREUR);
    maj((x) => ({ ...x, categories: (x.categories ?? []).filter((c) => c !== nom) }));
    for (const r of recettes.filter((r) => r.categories.includes(nom))) await modifier(r.id, { categories: r.categories.filter((c) => c !== nom) });
    setMessage(`Catégorie « ${nom} » supprimée`);
  }

  async function creerCategorie(nom: string) {
    const { error } = await supabase.from('categorie').insert({ nom });
    if (error && error.code !== '23505') return setMessage(ERREUR); // 23505 : l'autre vient de la créer
    maj((x) => ({ ...x, categories: [...(x.categories ?? []), nom] }));
    setMessage(`Catégorie « ${nom} » créée ✓`);
  }

  async function noter(jour: number, moment: Moment, note: string) {
    const { error } = await supabase.from('case_menu').update({ note: note || null }).match({ semaine: sem, jour, moment });
    if (error) return setMessage(ERREUR);
    maj((x) => ({ ...x, cases: x.cases.map((c) => (c.semaine === sem && c.jour === jour && c.moment === moment ? { ...c, note: note || null } : c)) }));
  }

  // Coches, × et corrections : enregistrés tout de suite dans le téléphone, envoyés dès que possible.
  async function ajuster(cle: string, patch: Partial<AjLigne>) {
    const avant = d!.ajustements.find((a) => a.semaine === sem && a.cle === cle);
    const ligne: AjLigne = { semaine: sem, cle, coche: false, retire: false, qty: null, ajoute: false, nom: null, unite: null, ...avant, ...patch };
    maj((x) => ({ ...x, ajustements: [...x.ajustements.filter((a) => !(a.semaine === sem && a.cle === cle)), ligne] }));
    const { error } = await supabase.from('ajustement').upsert(ligne);
    if (error) {
      const file: AjLigne[] = lire(FILE, []);
      ecrire(FILE, [...file.filter((a) => !(a.semaine === sem && a.cle === cle)), ligne]);
    }
  }

  async function importerEssais() {
    for (const e of essais) {
      const cle = cleLien(e.lien);
      if (cle && recettes.some((r) => r.cle_lien === cle)) continue;
      const { error } = await supabase.from('recette').insert({ type: 'insta', nom: e.motsCles, mots_cles: e.motsCles, lien: e.lien, cle_lien: cle, portions: 4 });
      if (error && error.code !== '23505') return setMessage(ERREUR);
    }
    localStorage.removeItem(STOCK);
    setEssais([]);
    await charger(d!.email);
    setMessage('Ajoutée au carnet ✓');
  }

  // Copie de secours du carnet, en fichier, à garder où on veut (en plus de la sauvegarde du dimanche).
  function exporter() {
    const blob = new Blob([JSON.stringify({ date: cleSemaine(new Date()), recettes, statuts: d!.statuts }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `popote-recettes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function changerSemaine(n: number) {
    const s = new Date(semaine);
    s.setDate(s.getDate() + 7 * n);
    setSemaine(s);
  }

  const fiche = recettes.find((r) => r.id === ouverte?.id);
  const casesSemaine = d?.cases.filter((c) => c.semaine === sem) ?? [];

  // « Aujourd'hui » suit toujours le jour réel, même le dimanche.
  const auj = new Date();
  const jourAuj = (auj.getDay() + 6) % 7;
  const repas = (['midi', 'soir'] as Moment[]).map((moment) => {
    const plats = (d?.cases ?? []).filter((x) => x.semaine === cleSemaine(lundiDe(auj)) && x.jour === jourAuj && x.moment === moment).sort((x, y) => x.plat - y.plat);
    const noms = plats.map((x) => (x.plaisir ? 'Plaisir · on improvise' : recettes.find((y) => y.id === x.recette)?.nom)).filter(Boolean);
    const c = plats[0];
    return { moment, c, noms: noms.join(' + '), r: recettes.find((x) => x.id === plats.find((y) => y.recette)?.recette) };
  });

  const titre = { carnet: 'Popote', menu: 'Mon menu', courses: 'Mes courses' }[onglet];

  return (
    <main className="page">
      <header className="entete">
        <span className="surtitre">{moi ? `Bonjour ${moi.prenom}` : 'Le carnet de recettes'}</span>
        <h1>{session && moi ? titre : 'Popote'}</h1>
      </header>

      {session === undefined ? null : !session ? (
        <Connexion />
      ) : d && !moi ? (
        <section className="carte"><div className="alerte" role="alert">Ton adresse n’est pas dans la liste des membres. Demande à Celia de l’ajouter.</div></section>
      ) : d && moi ? (
        <>
          {onglet === 'carnet' && (
            <>
              {essais.length > 0 && (
                <section className="carte">
                  <p>{essais.length === 1 ? `« ${essais[0].motsCles} » est restée` : `${essais.length} recettes sont restées`} dans ce téléphone depuis le test.</p>
                  <div className="boutons">
                    <button className="secondaire" onClick={() => { localStorage.removeItem(STOCK); setEssais([]); }}>Oublier</button>
                    <button className="principal" onClick={importerEssais}>Mettre dans le carnet</button>
                  </div>
                </section>
              )}
              <section className="aujourdhui">
                <span className="etiquette">Aujourd'hui · {JOURS_LONGS[jourAuj]}</span>
                {repas.map(({ moment, c, noms, r }) => (
                  <button key={moment} onClick={() => (r ? setOuverte({ id: r.id }) : setOnglet('menu'))}>
                    <span className="pave" style={{ background: c?.plaisir ? '#F6E7C8' : r ? couleurDe(r) : 'rgba(255,255,255,0.12)' }} />
                    <span>
                      <span className="quand">{moment === 'midi' ? 'Ce midi' : 'Ce soir'}</span>
                      <span className="quoi">{noms || 'Rien de prévu'}{c?.note ? ` · ${c.note}` : ''}</span>
                    </span>
                  </button>
                ))}
              </section>
              <Carnet recettes={recettes} categories={d.categories ?? []} creerCategorie={creerCategorie} supprimerCategorie={supprimerCategorie} membres={d.membres} statuts={d.statuts} moi={moi.id} ouvrir={(id) => setOuverte({ id })} nouvelle={nouvelle} lecture={lecture} />
              {IPHONE && <button className="lien-bouton" onClick={() => setRaccourci(true)}>Le raccourci « Ajouter à Popote »</button>}
              <button className="lien-bouton" onClick={exporter}>Exporter mes recettes</button>
            </>
          )}
          {onglet === 'menu' && (
            <Menu semaine={semaine} changerSemaine={changerSemaine} cases={casesSemaine} recettes={recettes} categories={d.categories ?? []} faites={new Set(d.statuts.filter((s) => s.membre === moi.id && s.valeur === 'deja_faite').map((s) => s.recette))} choix={choix} setChoix={setChoix} toucherCase={toucherCase} noter={noter} enlever={enlever} deplacer={deplacer}
              demande={recettes.find((r) => r.id === demande) ?? null}
              ajouterIngredients={() => { setOuverte({ id: demande!, ingredients: true }); setDemande(null); }} plusTard={() => setDemande(null)} />
          )}
          {onglet === 'courses' && (
            <Courses semaine={semaine} changerSemaine={changerSemaine} cases={casesSemaine} recettes={recettes}
              ajustements={d.ajustements.filter((a) => a.semaine === sem)} ajuster={ajuster} ajouterIngredients={(id) => setOuverte({ id, ingredients: true })} rayons={d.rayons ?? {}} changerRayon={changerRayon} />
          )}

          <nav className="barre" aria-label="Navigation">
            {(['carnet', 'menu'] as Onglet[]).map((o) => <Onglet key={o} o={o} actif={onglet === o} aller={setOnglet} />)}
            <button className="plus" aria-label="Ajouter une recette" onClick={() => setAjout({})}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <Onglet o="courses" actif={onglet === 'courses'} aller={setOnglet} />
          </nav>
          {fiche && (
            <Fiche key={fiche.id + String(ouverte?.ingredients)} r={fiche} categories={toutesCategories(recettes, d.categories)} membres={d.membres} statuts={d.statuts} moi={moi.id} editerIngredients={ouverte?.ingredients}
              modifier={(p) => modifier(fiche.id, p)} marquer={(f) => marquer(fiche.id, f)} supprimer={() => supprimer(fiche.id)}
              photo={(f) => photo(fiche, f)}
              mettreAuMenu={(personnes) => { setChoix({ recette: fiche.id, personnes }); setSemaine(semaineParDefaut(new Date())); setOuverte(null); setOnglet('menu'); }}
              fermer={() => setOuverte(null)} />
          )}
          {raccourci && <Raccourci fermer={() => setRaccourci(false)} />}
          {ajout && <Ajout lienPartage={ajout.lien} ajouter={ajouter} fermer={() => setAjout(null)} />}
        </>
      ) : null}

      {message && <div className="toast" role="status">{message}</div>}
    </main>
  );
}

const ICONES: Record<Onglet, JSX.Element> = {
  carnet: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>,
  menu: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  courses: <><path d="M3 4h2l2.5 11h11L21 8H6.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
};

function Onglet({ o, actif, aller }: { o: Onglet; actif: boolean; aller: (o: Onglet) => void }) {
  return (
    <button className={actif ? 'onglet actif' : 'onglet'} aria-current={actif ? 'page' : undefined} onClick={() => { aller(o); scrollTo(0, 0); }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONES[o]}</svg>
      {{ carnet: 'Recettes', menu: 'Menu', courses: 'Courses' }[o]}
    </button>
  );
}
