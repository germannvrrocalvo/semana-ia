// Genera la imagen social del sitio. Se ejecuta a mano, una vez, y el PNG
// resultante se versiona: asi no depende de que en el runner de CI existan las
// mismas tipografias que aqui.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

// Los mismos tokens que el sitio, en su tema por defecto: el oscuro.
const PAPEL = '#0e0f11';
const TINTA = '#f2f1ee';
const SENAL = '#ff5436';
const APUNTE = '#9b9ea6';
const LINEA = '#262a30';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPEL}"/>
  <rect width="1200" height="14" fill="${SENAL}"/>

  <text x="90" y="228" font-family="Georgia, 'Times New Roman', serif" font-size="132" font-weight="600" letter-spacing="-5" fill="${TINTA}">Semana IA</text>

  <rect x="90" y="286" width="1020" height="2" fill="${TINTA}"/>

  <text x="90" y="360" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="${TINTA}">Cada lunes, lo que ha pasado en</text>
  <text x="90" y="418" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="${TINTA}">inteligencia artificial.</text>

  <rect x="90" y="486" width="1020" height="1" fill="${LINEA}"/>

  <text x="90" y="546" font-family="'Segoe UI', Arial, sans-serif" font-size="26" letter-spacing="3" fill="${APUNTE}">BOLETÍN SEMANAL</text>
  <text x="1110" y="546" text-anchor="end" font-family="'Segoe UI', Arial, sans-serif" font-size="26" letter-spacing="1" fill="${SENAL}">semana-ia.vercel.app</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
const destino = process.argv[2] ?? 'public/og.png';
await writeFile(destino, png);
console.log(`escrito ${destino} (${(png.length / 1024).toFixed(0)} kB)`);
