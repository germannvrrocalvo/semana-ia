import config from '../../scripts/fuentes.json';

/**
 * Las secciones de una edicion viven en scripts/fuentes.json porque es el robot
 * quien clasifica las noticias. El sitio las lee de ahi para que anadir una
 * seccion nueva sea un solo cambio en un solo archivo.
 */
export const SECCIONES: { id: string; titulo: string }[] = config.secciones.map((s) => ({
  id: s.id,
  titulo: s.titulo,
}));

const TITULOS = new Map(SECCIONES.map((s) => [s.id, s.titulo]));

export function tituloSeccion(id: string): string {
  return TITULOS.get(id) ?? id;
}

/** Agrupa las entradas de una edicion respetando el orden editorial de las secciones. */
export function agruparPorSeccion<T extends { seccion: string }>(entradas: T[]) {
  return SECCIONES.map((s) => ({
    ...s,
    entradas: entradas.filter((e) => e.seccion === s.id),
  })).filter((s) => s.entradas.length > 0);
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const fechaLarga = (d: Date) => FORMATO_FECHA.format(d);

const FORMATO_CORTO = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
});

export const fechaCorta = (d: Date) => FORMATO_CORTO.format(d);

/** "semana 35" a partir de "2026-W35", para leerlo en voz alta sin deletrear. */
export const numeroSemana = (semana: string) => Number(semana.split('-W')[1]);

/**
 * Los temas los escribe Claude, asi que pueden llegar con acentos, mayusculas o
 * espacios. Se normalizan aqui para que la URL sea estable pase lo que pase.
 */
export const aSlug = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** El dominio de una URL, que es como el lector reconoce una fuente de un vistazo. */
export function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
