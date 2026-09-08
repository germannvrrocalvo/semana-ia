import { SITIO } from '../lib/sitio';

/*
  Se genera en vez de dejarlo en public/ para que la URL del sitemap salga de la
  misma constante que el resto del sitio y no se quede apuntando a un dominio
  antiguo el dia que haya dominio propio.
*/
export function GET() {
  const cuerpo = [
    'User-agent: *',
    'Allow: /',
    '',
    '# El rastreador de AdSense necesita entrar para revisar el sitio.',
    'User-agent: Mediapartners-Google',
    'Allow: /',
    '',
    `Sitemap: ${SITIO.url}/sitemap-index.xml`,
    '',
  ].join('\n');

  return new Response(cuerpo, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
