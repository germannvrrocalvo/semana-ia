import { SITIO } from '../lib/sitio';

/*
  ads.txt declara quien esta autorizado a vender el inventario publicitario de este
  dominio. Google lo comprueba al revisar el sitio, y sirve tambien para verificar
  que el dominio es de quien solicita AdSense.

  Va separado de la carga de anuncios a proposito. Autorizar a Google a vender
  espacio no pone ningun anuncio en la pagina: eso solo ocurre cuando existe
  PUBLIC_ADSENSE_CLIENT en el despliegue. Asi se puede solicitar la revision con
  ads.txt en su sitio y el sitio todavia limpio de scripts de terceros.

  Si algun dia la variable apunta a otra cuenta, manda la variable.
*/
export function GET() {
  const desdeVariable = import.meta.env.PUBLIC_ADSENSE_CLIENT?.trim().replace(/^ca-/, '');
  const editor = desdeVariable || SITIO.editorAdsense;

  const cuerpo = `google.com, ${editor}, DIRECT, f08c47fec0942fa0
`;

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
