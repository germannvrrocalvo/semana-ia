import { getCollection, render } from 'astro:content';

/*
  Busca la columna de una semana. Devuelve tambien su contenido ya renderizado,
  porque quien la pinta es el componente de la edicion y desde alli no se puede
  llamar a render().

  Los borradores no cuentan: una columna con borrador: true no existe para el
  sitio. Asi se puede dejar media escrita en el repositorio sin publicarla.
*/
export async function columnaDe(semana: string) {
  const columnas = await getCollection('columnas', ({ data }) => !data.borrador);
  const columna = columnas.find((c) => c.data.semana === semana);
  if (!columna) return null;

  const { Content } = await render(columna);
  return { datos: columna.data, Content };
}
