import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Cada edicion semanal es un archivo Markdown en src/content/ediciones/.
// Este esquema es la red de seguridad: si el robot escribe una edicion con un
// campo mal puesto, el build falla en local o en el Pull Request, nunca en
// produccion.
const ediciones = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ediciones' }),
  schema: z.object({
    /** Identificador ISO de la semana, p. ej. "2026-W35". Es tambien el slug. */
    semana: z.string().regex(/^\d{4}-W\d{2}$/, 'Formato esperado: 2026-W35'),
    titulo: z.string(),
    /**
     * Titular de portada, corto, para poder ponerlo a cuerpo de cartel. Opcional
     * porque las ediciones anteriores al campo no lo tienen y siguen validando:
     * en esas, la portada cae en destacado, que es una frase entera.
     */
    titularCorto: z.string().max(90).optional(),
    fecha: z.coerce.date(),
    /** Una frase con lo mas importante de la semana. Se usa como entradilla y en los metadatos. */
    destacado: z.string(),
    // Vocabulario cerrado: alimenta las paginas de /temas, que solo son utiles si
    // las mismas etiquetas se repiten semana tras semana.
    temas: z
      .array(z.enum(['modelos', 'producto', 'investigacion', 'negocio', 'regulacion', 'open-source']))
      .default([]),
    // Libres y descriptivas de una semana concreta ("chips", "empleo"). Se muestran
    // en la edicion, pero no generan paginas ni navegacion.
    etiquetas: z.array(z.string()).default([]),
    generadoPor: z.enum(['claude', 'sin-ia', 'manual']).default('manual'),
    fuentesConsultadas: z.number().optional(),
    entradas: z
      .array(
        z.object({
          titulo: z.string(),
          // El titular tal y como lo publico la fuente. Solo existe cuando el
          // titular mostrado es una traduccion, y sirve para poder cotejarlo.
          tituloOriginal: z.string().optional(),
          // Las URL llegan de feeds de terceros, que son contenido no confiable.
          // z.url() por si sola acepta javascript: y data:, que en un href son
          // ejecutables; aqui solo pasan http y https.
          url: z
            .string()
            .url()
            .refine((u) => /^https?:$/.test(new URL(u).protocol), {
              message: 'Solo se admiten URL http o https',
            }),
          fuente: z.string(),
          fecha: z.coerce.date(),
          seccion: z.string(),
          resumen: z.string().default(''),
          /**
           * La lectura de la noticia: a quien afecta o que cambia. Opcional a
           * proposito, en dos sentidos: las ediciones publicadas antes de que
           * existiera el campo siguen validando, y el redactor lo omite cuando la
           * noticia no da para mas que el hecho.
           */
          porQueImporta: z.string().optional(),
          /** Otros medios que cubrieron la misma historia. */
          tambienEn: z.array(z.string()).default([]),
        }),
      )
      .default([]),
  }),
});

/*
  La columna de la semana. Vive en su propia carpeta, y eso no es organizacion:
  es la garantia de que el robot no puede pisarla. El workflow solo hace
  `git add src/content/ediciones/`, asi que nada de lo que escribes tu esta al
  alcance de una ejecucion automatica.

  Si existe la columna de una semana, la edicion la muestra firmada y en primer
  lugar, y la entradilla del robot pasa a ser material de trabajo. Si no existe,
  la edicion se ve como siempre.
*/
const columnas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/columnas' }),
  schema: z.object({
    /** La semana que comenta, con el mismo identificador que su edicion. */
    semana: z.string().regex(/^\d{4}-W\d{2}$/, 'Formato esperado: 2026-W35'),
    titulo: z.string(),
    fecha: z.coerce.date(),
    /** Quien firma. Una columna sin firma no es una columna. */
    firma: z.string(),
    /**
     * Mientras sea true la columna no se publica: no sale en la edicion, ni en el
     * indice, ni en el sitemap. Sirve para dejar un borrador a medias en el
     * repositorio sin que lo lea nadie.
     */
    borrador: z.boolean().default(false),
  }),
});

/*
  Piezas de fondo: lo que no caduca. Un agregador con criterio necesita algun
  texto que explique el criterio, y esto es donde va.
*/
const analisis = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/analisis' }),
  schema: z.object({
    titulo: z.string(),
    /** Se usa como meta description y como entradilla, asi que conviene que valga para las dos. */
    descripcion: z.string(),
    fecha: z.coerce.date(),
    /** Solo si se ha revisado despues de publicarla. Los buscadores lo miran. */
    actualizada: z.coerce.date().optional(),
    firma: z.string(),
    borrador: z.boolean().default(false),
  }),
});

export const collections = { ediciones, columnas, analisis };
