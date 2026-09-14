import { getCollection } from 'astro:content';

/*
  Indice de busqueda. Un JSON plano con una entrada por noticia publicada, que el
  navegador descarga una vez al abrir /buscar y filtra en local.

  Se hace asi porque el sitio es estatico y no hay servidor donde consultar: la
  alternativa seria montar un backend o pagar un servicio de busqueda para un
  archivo que hoy tiene tres ediciones.

  Cuanto aguanta: cada entrada ocupa unos 200 bytes, asi que un ano de ediciones
  (unas 1.250 noticias) son unos 250 kB sin comprimir y bastante menos con gzip.
  El dia que el archivo pase de dos o tres mil noticias habra que cambiar de
  enfoque, y el sitio para mirarlo es este archivo.

  El resumen se recorta: sirve para encontrar, no para leer.
*/
const LIMITE_RESUMEN = 160;

export async function GET() {
  const ediciones = (await getCollection('ediciones')).sort(
    (a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf(),
  );

  const noticias = ediciones.flatMap((e) =>
    e.data.entradas.map((entrada) => ({
      titulo: entrada.titulo,
      resumen:
        entrada.resumen.length > LIMITE_RESUMEN
          ? `${entrada.resumen.slice(0, LIMITE_RESUMEN).trimEnd()}...`
          : entrada.resumen,
      fuente: entrada.fuente,
      seccion: entrada.seccion,
      url: entrada.url,
      semana: e.data.semana,
      fecha: entrada.fecha.toISOString().slice(0, 10),
    })),
  );

  const cuerpo = {
    generado: new Date().toISOString(),
    ediciones: ediciones.map((e) => ({
      semana: e.data.semana,
      titulo: e.data.titulo,
      destacado: e.data.destacado,
      fecha: e.data.fecha.toISOString().slice(0, 10),
      noticias: e.data.entradas.length,
    })),
    noticias,
  };

  return new Response(JSON.stringify(cuerpo), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
