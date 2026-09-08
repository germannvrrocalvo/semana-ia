import * as simpleIcons from 'simple-icons';
import config from '../../scripts/fuentes.json';

/*
  Marcas de los medios.

  Los logotipos salen de Simple Icons, que solo distribuye los que tienen permiso:
  faltan varios de los medios que seguimos (OpenAI y Microsoft se retiraron del
  catalogo, y The Verge o Xataka nunca han estado). Para esos se dibuja un
  monograma con las iniciales, encajado en la misma celda cuadrada que los
  logotipos, de forma que el muro se lea como un sistema y no como una coleccion
  de huecos.

  Todo se resuelve en tiempo de compilacion: al navegador no le llega ni la
  libreria ni una peticion a un CDN externo.
*/

/** Slug de Simple Icons por id de fuente. Solo los que existen en el catalogo. */
const LOGOTIPOS: Record<string, string> = {
  deepmind: 'Deepmind',
  'google-ai': 'Google',
  'meta-ai': 'Meta',
  nvidia: 'Nvidia',
  mistral: 'Mistralai',
  huggingface: 'Huggingface',
  techcrunch: 'Techcrunch',
  arstechnica: 'Arstechnica',
  hackernews: 'Ycombinator',
  'arxiv-ai': 'Arxiv',
  'arxiv-cl': 'Arxiv',
};

/** Iniciales para los medios sin logotipo disponible. Explicitas: adivinarlas da resultados raros. */
const MONOGRAMAS: Record<string, string> = {
  openai: 'OA',
  'microsoft-ai': 'MS',
  theverge: 'TV',
  'mit-tr': 'MIT',
  venturebeat: 'VB',
  'wired-ai': 'W',
  xataka: 'XT',
  hipertextual: 'HT',
};

export type Marca =
  | { tipo: 'logo'; nombre: string; path: string; color: string }
  | { tipo: 'monograma'; nombre: string; letras: string };

function construir(id: string, nombre: string): Marca {
  const slug = LOGOTIPOS[id];
  const icono = slug
    ? (simpleIcons as Record<string, { path: string; hex: string } | undefined>)[`si${slug}`]
    : undefined;

  if (icono) {
    return { tipo: 'logo', nombre, path: icono.path, color: `#${icono.hex}` };
  }

  return { tipo: 'monograma', nombre, letras: MONOGRAMAS[id] ?? iniciales(nombre) };
}

/** Reserva para una fuente que aparezca en una edicion y no este en el catalogo. */
function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-Z]+$/.test(p))
    .slice(0, 2);
  return palabras.map((p) => p[0]).join('').toUpperCase() || nombre.slice(0, 2).toUpperCase();
}

/** Todas las marcas del catalogo, en el orden en que estan declaradas las fuentes. */
export const MARCAS: Marca[] = config.fuentes.map((f) => construir(f.id, f.nombre));

/*
  Las entradas de una edicion guardan el nombre del medio, no su id, porque es lo
  que se muestra al lector. Este indice permite ir del nombre a su marca sin que
  las plantillas tengan que saber nada de fuentes.json.
*/
const POR_NOMBRE = new Map(config.fuentes.map((f) => [f.nombre.toLowerCase(), construir(f.id, f.nombre)]));

export function marcaDe(nombre: string): Marca {
  return (
    POR_NOMBRE.get(nombre.toLowerCase()) ?? { tipo: 'monograma', nombre, letras: iniciales(nombre) }
  );
}

/** Solo los medios con logotipo real, que son los que se pintan en el muro de portada. */
export const MARCAS_CON_LOGO = MARCAS.filter((m): m is Extract<Marca, { tipo: 'logo' }> => m.tipo === 'logo');
