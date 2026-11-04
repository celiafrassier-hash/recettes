// Trouve le premier lien dans un texte partagé (Android met parfois le lien dans `text`, parfois dans `url`).
export function extraireLien(...morceaux: (string | null | undefined)[]): string | null {
  for (const m of morceaux) {
    const found = m?.match(/https?:\/\/[^\s<>"]+/);
    if (found) return found[0];
  }
  for (const m of morceaux) {
    const found = m?.match(/\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\/[^\s<>"]*/i);
    if (found) return 'https://' + found[0];
  }
  return null;
}

const TRACEURS = /^(utm_.*|igsh|igshid|fbclid|gclid|si|ref|mc_.*)$/i;

// Clé unique d'une recette pour repérer les doublons.
// Insta : on ne garde que l'identifiant de la vidéo (/reel/ABC = /p/ABC, traceur ?igsh ignoré).
export function cleLien(lien: string): string | null {
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(lien) ? lien : 'https://' + lien);
  } catch {
    return null;
  }
  const host = u.hostname.toLowerCase().replace(/^(www\.|m\.)/, '');
  if (host === 'instagram.com' || host === 'instagr.am') {
    const id = u.pathname.match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    if (id) return 'instagram:' + id[1];
  }
  const params = [...u.searchParams.entries()].filter(([k]) => !TRACEURS.test(k));
  params.sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? '?' + new URLSearchParams(params).toString() : '';
  return host + u.pathname.replace(/\/+$/, '') + query;
}
