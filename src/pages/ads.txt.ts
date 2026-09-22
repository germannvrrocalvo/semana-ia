import { SITIO } from '../lib/sitio';

/*
  ads.txt declara quien esta autorizado a vender el inventario publicitario de este
  dominio. Google lo comprueba al revisar el sitio, y sirve tambien para verificar
  la cuenta autorizada para este dominio. Tambien puede utilizarse como metodo
  de conexion del sitio a AdSense si asi se selecciona en su panel.

  Va separado de la carga de anuncios a proposito. Autorizar a Google a vender
  espacio no pone ningun anuncio en la pagina: para eso se requieren tanto
  PUBLIC_ADSENSE_CLIENT como PUBLIC_ADSENSE_CMP_READY='true' en el despliegue,
  despues de publicar y comprobar una CMP certificada.

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
