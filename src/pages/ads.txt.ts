import { SITIO } from '../lib/sitio';

/*
  ads.txt declara quien esta autorizado a vender el inventario publicitario de este
  dominio. Google lo comprueba y, si falta, marca el sitio en el panel de AdSense.

  Se genera a partir de la misma variable de entorno que carga el script de
  anuncios, asi no hay dos sitios donde meter el identificador y desincronizarlos.
  Mientras no exista la variable, el archivo se sirve vacio de autorizaciones, que
  es lo correcto: no hay nadie autorizado todavia.
*/
export function GET() {
  const cliente = import.meta.env.PUBLIC_ADSENSE_CLIENT?.trim();
  const editor = cliente?.replace(/^ca-/, '');

  const cuerpo = editor
    ? `google.com, ${editor}, DIRECT, f08c47fec0942fa0\n`
    : `# ${SITIO.nombre}: sin autorizaciones de venta publicitaria.\n` +
      `# Define PUBLIC_ADSENSE_CLIENT (ca-pub-...) y este archivo se rellena solo.\n`;

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
