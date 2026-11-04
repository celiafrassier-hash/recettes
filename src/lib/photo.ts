// Photo du plat réduite dans le téléphone avant l'envoi (§2.3) : ~1000 px, moins de 300 Ko, pour rester dans le stockage gratuit.
export const COTE_MAX = 1000;
export const POIDS_MAX = 300 * 1024;

// Taille réduite en gardant les proportions ; une petite photo n'est jamais agrandie.
export function taille(l: number, h: number, max = COTE_MAX): { l: number; h: number } {
  const r = Math.min(1, max / Math.max(l, h));
  return { l: Math.round(l * r), h: Math.round(h * r) };
}

export async function reduire(fichier: File): Promise<Blob> {
  const img = await createImageBitmap(fichier); // tient compte de l'orientation de la photo
  const t = taille(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = t.l;
  canvas.height = t.h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, t.l, t.h);
  img.close();
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', q));
    if (blob && (blob.size <= POIDS_MAX || q === 0.4)) return blob;
  }
  throw new Error('photo illisible');
}
