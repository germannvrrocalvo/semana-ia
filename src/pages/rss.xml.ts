import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const ediciones = (await getCollection('ediciones')).sort(
    (a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf(),
  );

  return rss({
    title: 'Semana IA',
    description: 'Cada lunes, lo que ha pasado en inteligencia artificial durante la semana anterior.',
    site: context.site!,
    items: ediciones.map((e) => ({
      title: e.data.titulo,
      pubDate: e.data.fecha,
      description: e.data.destacado,
      link: `/ediciones/${e.data.semana}/`,
      categories: e.data.temas,
    })),
    customData: '<language>es-es</language>',
  });
}
