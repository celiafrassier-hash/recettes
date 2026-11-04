// Lundi (à midi, pour éviter les soucis d'heure d'été) de la semaine qui contient `d`.
export function lundiDe(d: Date): Date {
  const l = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  return l;
}

// Semaine ouverte par défaut dans Menu et Courses : le dimanche, on prépare la semaine suivante.
export function semaineParDefaut(aujourdhui: Date): Date {
  const l = lundiDe(aujourdhui);
  if (aujourdhui.getDay() === 0) l.setDate(l.getDate() + 7);
  return l;
}

export function cleSemaine(lundi: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${lundi.getFullYear()}-${p(lundi.getMonth() + 1)}-${p(lundi.getDate())}`;
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// « 2 – 8 nov. » ou « 30 nov. – 6 déc. »
export function libelleSemaine(lundi: Date): string {
  const dim = new Date(lundi);
  dim.setDate(dim.getDate() + 6);
  const debut = lundi.getMonth() === dim.getMonth() ? `${lundi.getDate()}` : `${lundi.getDate()} ${MOIS[lundi.getMonth()]}`;
  return `${debut} – ${dim.getDate()} ${MOIS[dim.getMonth()]}`;
}
