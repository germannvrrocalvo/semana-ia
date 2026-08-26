// Generador de la edicion semanal de Semana IA.
//
// Toma las noticias que recolecta fetch-news.mjs y escribe un archivo Markdown en
// src/content/ediciones/. Si existe ANTHROPIC_API_KEY, Claude redacta el titular
// de la semana y un resumen propio de cada noticia en espanol. Si no existe, la
// edicion se genera igual usando el extracto original de cada fuente.
//
//   node scripts/build-issue.mjs                 -> escribe la edicion de esta semana
//   node scripts/build-issue.mjs --dry-run       -> la imprime sin guardarla
//   node scripts/build-issue.mjs --forzar        -> sobrescribe una edicion existente
//   node scripts/build-issue.mjs --dias 14       -> amplia la ventana de noticias

import { writeFile, mkdir, access } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { recolectar } from './fetch-news.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src', 'content', 'ediciones');
const MODELO = 'claude-opus-5';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// --- fechas -----------------------------------------------------------------

/** Lunes y domingo de una semana ISO ("2026-W35"). */
function rangoSemana(semana) {
  const [ano, n] = semana.split('-W').map(Number);
  // El 4 de enero siempre cae en la semana 1 segun ISO 8601.
  const cuatroEnero = new Date(Date.UTC(ano, 0, 4));
  const lunesSemana1 = new Date(cuatroEnero);
  lunesSemana1.setUTCDate(cuatroEnero.getUTCDate() - ((cuatroEnero.getUTCDay() || 7) - 1));

  const lunes = new Date(lunesSemana1);
  lunes.setUTCDate(lunesSemana1.getUTCDate() + (n - 1) * 7);
  const domingo = new Date(lunes);
  domingo.setUTCDate(lunes.getUTCDate() + 6);
  return { lunes, domingo };
}

/** "24-30 de agosto de 2026" o "29 de junio al 5 de julio de 2026". */
function rangoLegible({ lunes, domingo }) {
  const d1 = lunes.getUTCDate();
  const d2 = domingo.getUTCDate();
  const m1 = MESES[lunes.getUTCMonth()];
  const m2 = MESES[domingo.getUTCMonth()];
  const ano = domingo.getUTCFullYear();
  return m1 === m2 ? `${d1}-${d2} de ${m1} de ${ano}` : `${d1} de ${m1} al ${d2} de ${m2} de ${ano}`;
}

// --- redaccion con Claude ---------------------------------------------------

const ESQUEMA = {
  type: 'object',
  properties: {
    destacado: {
      type: 'string',
      description: 'Una sola frase, máximo 140 caracteres, que resuma lo más importante de la semana. Sin comillas ni punto final.',
    },
    apertura: {
      type: 'string',
      description: 'Dos o tres frases de contexto sobre la semana, en Markdown plano. Explica por qué importa lo que ha pasado, sin repetir literalmente el campo destacado.',
    },
    temas: {
      type: 'array',
      description: 'Entre dos y cuatro etiquetas en minúsculas y sin tildes que describan los ejes de la semana.',
      items: { type: 'string' },
    },
    entradas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'La URL exacta de la noticia, copiada tal cual de la entrada original.' },
          resumen: { type: 'string', description: 'Dos o tres frases en español explicando la noticia y por qué importa. Sin adjetivos publicitarios.' },
        },
        required: ['url', 'resumen'],
        additionalProperties: false,
      },
    },
  },
  required: ['destacado', 'apertura', 'temas', 'entradas'],
  additionalProperties: false,
};

const INSTRUCCIONES = `Eres el redactor de "Semana IA", un boletín semanal en español sobre inteligencia artificial dirigido a lectores técnicos pero no necesariamente expertos.

Reglas de estilo:
- Escribe en español de España, claro y directo. Nada de jerga de marketing ("revolucionario", "disruptivo", "cambia las reglas del juego").
- No uses la raya larga. Usa guiones normales o reescribe la frase.
- Los nombres de productos, modelos y empresas van en su idioma original.
- No inventes datos, cifras ni declaraciones que no estén en el material que recibes. Si un titular es ambiguo, descríbelo con cautela en vez de rellenar huecos.
- Si una noticia es un anuncio comercial disfrazado de noticia, dilo.
- Cada resumen debe explicar qué ha pasado y por qué importa, no repetir el titular con otras palabras.

Devuelve una entrada por cada noticia recibida, con su URL exacta.`;

async function redactar(datos) {
  const client = new Anthropic();

  const material = datos.noticias
    .map((n, i) => {
      const eco = n.tambienEn.length ? `\nTambien cubierta por: ${n.tambienEn.join(', ')}` : '';
      const extracto = n.extracto ? `\nExtracto de la fuente: ${n.extracto}` : '';
      return `--- Noticia ${i + 1} ---\nTitular: ${n.titulo}\nFuente: ${n.fuente}\nSeccion: ${n.seccion}\nURL: ${n.url}${extracto}${eco}`;
    })
    .join('\n\n');

  const respuesta = await client.messages.create({
    model: MODELO,
    max_tokens: 16000,
    system: INSTRUCCIONES,
    output_config: { format: { type: 'json_schema', schema: ESQUEMA }, effort: 'medium' },
    messages: [
      {
        role: 'user',
        content: `Estas son las ${datos.noticias.length} noticias más relevantes de la semana ${datos.semana}. Redacta la edicion.\n\n${material}`,
      },
    ],
  });

  if (respuesta.stop_reason === 'refusal') {
    throw new Error(`El modelo declino la peticion (${respuesta.stop_details?.category ?? 'sin categoria'})`);
  }

  const texto = respuesta.content.find((b) => b.type === 'text')?.text;
  if (!texto) throw new Error('La respuesta no traia texto');
  return JSON.parse(texto);
}

// --- escritura del Markdown -------------------------------------------------

/** Escapa un valor para YAML: siempre entre comillas dobles, con las internas escapadas. */
const yaml = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function componerMarkdown(datos, redaccion) {
  const rango = rangoSemana(datos.semana);
  const porUrl = new Map((redaccion?.entradas ?? []).map((e) => [e.url, e.resumen]));

  const entradas = datos.noticias.map((n) => {
    const resumen = porUrl.get(n.url) ?? n.extracto ?? '';
    return [
      '  - titulo: ' + yaml(n.titulo),
      '    url: ' + yaml(n.url),
      '    fuente: ' + yaml(n.fuente),
      '    fecha: ' + n.fecha,
      '    seccion: ' + yaml(n.seccion),
      '    resumen: ' + yaml(resumen),
      n.tambienEn.length ? '    tambienEn: [' + n.tambienEn.map(yaml).join(', ') + ']' : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  const conIA = Boolean(redaccion);
  const temas = conIA ? redaccion.temas : [...new Set(datos.noticias.map((n) => n.seccion))];
  const destacado = conIA
    ? redaccion.destacado
    : `${datos.noticias.length} noticias de IA de la semana, recopiladas de ${new Set(datos.noticias.map((n) => n.fuente)).size} fuentes`;

  const frontmatter = [
    '---',
    'semana: ' + yaml(datos.semana),
    'titulo: ' + yaml(`Semana del ${rangoLegible(rango)}`),
    'fecha: ' + rango.domingo.toISOString().slice(0, 10),
    'destacado: ' + yaml(destacado),
    'temas: [' + temas.map(yaml).join(', ') + ']',
    'generadoPor: ' + yaml(conIA ? 'claude' : 'sin-ia'),
    'fuentesConsultadas: ' + datos.informe.filter((f) => f.estado === 'ok').length,
    'entradas:',
    entradas.join('\n'),
    '---',
    '',
  ].join('\n');

  const cuerpo = conIA
    ? redaccion.apertura
    : 'Esta edición se ha generado sin resumen automático, así que cada entrada muestra el extracto original de su fuente.';

  return `${frontmatter}${cuerpo}\n`;
}

// --- orquestacion -----------------------------------------------------------

export async function generarEdicion({ dias = 7, dryRun = false, forzar = false } = {}) {
  const datos = await recolectar({ dias });
  if (datos.noticias.length === 0) throw new Error('No se ha recolectado ninguna noticia; revisa las fuentes');

  const ruta = join(DESTINO, `${datos.semana}.md`);
  if (!forzar && !dryRun) {
    // Sobrescribir en silencio borraria las correcciones a mano de una edicion ya revisada.
    const existe = await access(ruta).then(() => true, () => false);
    if (existe) throw new Error(`${datos.semana}.md ya existe. Usa --forzar para sobrescribirla.`);
  }

  let redaccion = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      redaccion = await redactar(datos);
    } catch (err) {
      // Una edicion con extractos crudos es mejor que ninguna edicion.
      console.error(`Aviso: fallo la redaccion con Claude (${err.message}). Se usaran los extractos originales.`);
    }
  } else {
    console.error('Aviso: sin ANTHROPIC_API_KEY. Se usaran los extractos originales de cada fuente.');
  }

  const markdown = componerMarkdown(datos, redaccion);
  if (dryRun) return { ruta, markdown, datos, redaccion };

  await mkdir(DESTINO, { recursive: true });
  await writeFile(ruta, markdown, 'utf8');
  return { ruta, markdown, datos, redaccion };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const { ruta, markdown, datos, redaccion } = await generarEdicion({
    dias: Number(args[args.indexOf('--dias') + 1]) || 7,
    dryRun: args.includes('--dry-run'),
    forzar: args.includes('--forzar'),
  });

  if (args.includes('--dry-run')) {
    console.log(markdown);
  } else {
    console.log(`Edicion ${datos.semana} escrita en ${ruta}`);
    console.log(`${datos.noticias.length} noticias, redaccion: ${redaccion ? 'Claude' : 'extractos originales'}`);
  }

  // El workflow de GitHub lee estas lineas para titular el Pull Request.
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `semana=${datos.semana}\nnoticias=${datos.noticias.length}\n`);
  }
}
