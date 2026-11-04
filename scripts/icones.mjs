// Génère les icônes PNG (fond sauge, marmite bordeaux) sans dépendance : node scripts/icones.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4);
  c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

// Logo A « la marmite » (choisi le 2026-11-04), dessiné sur une grille de 120 comme la maquette.
const rects = [[30, 52, 60, 38, 10], [24, 50, 72, 8, 4], [14, 62, 16, 6, 3], [90, 62, 16, 6, 3]];
const vapeur = [48, 60, 72].flatMap((x, i) => {
  const y = i === 1 ? 28 : 30;
  // courbe de Bézier « c-4 5 4 8 0 14 », échantillonnée
  return Array.from({ length: 40 }, (_, k) => {
    const t = k / 39, u = 1 - t;
    return [x + 3 * u * u * t * -4 + 3 * u * t * t * 4, y + 3 * u * u * t * 5 + 3 * u * t * t * 8 + t * t * t * 14];
  });
});
function dansRect(x, y, [rx, ry, w, h, r]) {
  const dx = Math.max(rx + r - x, 0, x - (rx + w - r));
  const dy = Math.max(ry + r - y, 0, y - (ry + h - r));
  return dx * dx + dy * dy <= r * r;
}
function dansLogo(x, y) {
  // marge pour les icônes « maskable » (Android découpe en rond)
  x = 60 + (x - 60) / 0.85;
  y = 60 + (y - 60) / 0.85 - 1;
  return rects.some((r) => dansRect(x, y, r)) || vapeur.some(([vx, vy]) => (x - vx) ** 2 + (y - vy) ** 2 <= 4);
}

function png(size) {
  const bg = [0xdc, 0xe3, 0xd6];
  const fg = [0x8e, 0x1b, 0x1e];
  const rows = [];
  const N = 4; // 4×4 sous-pixels pour lisser les bords
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    for (let x = 0; x < size; x++) {
      let n = 0;
      for (let i = 0; i < N; i++)
        for (let j = 0; j < N; j++) if (dansLogo(((x + (i + 0.5) / N) * 120) / size, ((y + (j + 0.5) / N) * 120) / size)) n++;
      const a = n / (N * N);
      for (let c = 0; c < 3; c++) row[1 + x * 3 + c] = Math.round(bg[c] * (1 - a) + fg[c] * a);
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const s of [180, 192, 512]) writeFileSync(new URL(`../public/icone-${s}.png`, import.meta.url), png(s));
console.log('icônes générées');
