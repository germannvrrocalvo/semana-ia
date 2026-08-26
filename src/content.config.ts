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
    fecha: z.coerce.date(),
    /** Una frase con lo mas importante de la semana. Se usa como entradilla y en los metadatos. */
    destacado: z.string(),
    temas: z.array(z.string()).default([]),
    generadoPor: z.enum(['claude', 'sin-ia', 'manual']).default('manual'),
    fuentesConsultadas: z.number().optional(),
    entradas: z
      .array(
        z.object({
          titulo: z.string(),
          url: z.string().url(),
          fuente: z.string(),
          fecha: z.coerce.date(),
          seccion: z.string(),
          resumen: z.string().default(''),
          /** Otros medios que cubrieron la misma historia. */
          tambienEn: z.array(z.string()).default([]),
        }),
      )
      .default([]),
  }),
});

export const collections = { ediciones };
