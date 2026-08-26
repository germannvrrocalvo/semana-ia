// Recolector de noticias de Semana IA.
//
// Lee scripts/fuentes.json, descarga cada fuente, normaliza las noticias de los
// ultimos N dias, descarta ruido, agrupa las que cuentan la misma historia y las
// puntua por relevancia.
//
//   node scripts/fetch-news.mjs            -> imprime un resumen legible
//   node scripts/fetch-news.mjs --json     -> imprime el JSON completo
//   node scripts/fetch-news.mjs --dias 14  -> amplia la ventana temporal
//
// Ninguna fuente caida rompe la ejecucion: se anota en el informe y se sigue.

import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { XMLParser } from 'fast-xml-parser';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TIEMPO_LIMITE_MS = 15000;
const AGENTE = 'Mozilla/5.0 (compatible; SemanaIA/1.0; +https://github.com/)';

// Terminos que marcan una noticia como "de IA". Solo se exigen a las fuentes
// generalistas (categoria 'medio', 'comunidad' o 'espanol'), no a los blogs
// oficiales de laboratorios, donde todo es de IA por definicion.
const TERMINOS_IA = [
  'ai', 'a\\.i\\.', 'artificial intelligence', 'inteligencia artificial', 'machine learning',
  'aprendizaje automatico', 'llm', 'llms', 'gpt', 'gpt-\\d', 'chatgpt', 'claude', 'gemini',
  'llama', 'mistral', 'deepseek', 'qwen', 'grok', 'copilot', 'openai', 'anthropic', 'deepmind',
  'hugging face', 'red neuronal', 'neural network', 'modelo de lenguaje', 'language model',
  'generative', 'generativa', 'agentes de ia', 'ai agent', 'agentic', 'transformer',
  'chatbot', 'midjourney', 'stable diffusion', 'sora', 'perplexity',
];

// Se exige palabra completa: "ai" suelto como subcadena caza medio diccionario
// espanol ("aire", "paisaje", "bailar") y llenaba la edicion de noticias de sucesos.
const REGEX_IA = new RegExp(`(?<![a-z0-9])(${TERMINOS_IA.join('|')})(?![a-z0-9])`, 'i');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
});

// --- utilidades -------------------------------------------------------------

/** Identificador ISO de la semana, p. ej. "2026-W35". */
export function idSemana(fecha = new Date()) {
  const d = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
  // ISO 8601: el jueves de la semana decide a que ano pertenece.
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const inicioAno = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const semana = Math.ceil(((d - inicioAno) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(semana).padStart(2, '0')}`;
}

const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const normalizar = (s) => sinAcentos(String(s ?? '')).toLowerCase();

/** Quita etiquetas HTML y colapsa espacios. Los extractos RSS vienen sucios. */
function limpiarTexto(html) {
  return String(html ?? '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&ndash;|&mdash;/g, '-')
    // Entidades numericas (&#039; &#8217; &#x27; ...). Los feeds las usan sin criterio,
    // asi que se decodifican todas de golpe en vez de una por una.
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Recorta a `max` caracteres sin cortar una palabra por la mitad. */
function recortar(texto, max = 320) {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return corte.slice(0, corte.lastIndexOf(' ')).trim() + '...';
}

/** Un valor de fast-xml-parser puede ser string, objeto con #text, o array. */
function valor(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return valor(v[0]);
  if (typeof v === 'object') return String(v['#text'] ?? '');
  return String(v);
}

async function descargar(url) {
  const ctrl = new AbortController();
  const reloj = setTimeout(() => ctrl.abort(), TIEMPO_LIMITE_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'user-agent': AGENTE, accept: 'application/rss+xml, application/xml, text/xml, application/json, */*' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(reloj);
  }
}

// --- lectura de fuentes -----------------------------------------------------

/** RSS 2.0 y Atom en la misma funcion: cambian los nombres, no la forma. */
function leerFeed(xml, fuente) {
  const raiz = parser.parse(xml);
  const canal = raiz?.rss?.channel ?? raiz?.['rdf:RDF'] ?? raiz?.feed;
  if (!canal) return [];

  const crudos = canal.item ?? canal.entry ?? [];
  const items = Array.isArray(crudos) ? crudos : [crudos];

  return items.map((it) => {
    // Atom guarda el enlace en un atributo; RSS, en el texto del nodo.
    let url = valor(it.link);
    if (!url && it.link) {
      const enlaces = Array.isArray(it.link) ? it.link : [it.link];
      const alterno = enlaces.find((l) => l?.['@_rel'] !== 'self' && l?.['@_href']);
      url = alterno?.['@_href'] ?? '';
    }
    const fechaTexto = valor(it.pubDate) || valor(it.published) || valor(it.updated) || valor(it['dc:date']);
    const cuerpo = valor(it.description) || valor(it.summary) || valor(it['content:encoded']) || valor(it.content);

    // Google News formatea los titulares como "Titular - Medio" y su extracto es
    // un bloque de HTML con enlaces a otros medios; ambos sobran.
    let titulo = limpiarTexto(valor(it.title));
    let extracto = recortar(limpiarTexto(cuerpo));
    let publicadoPor = fuente.nombre;
    if (fuente.tipo === 'gnews') {
      // El medio real va en el sufijo del titular. Atribuirlo a "Google News"
      // seria mentir sobre quien firma la noticia.
      const sufijo = titulo.match(/\s+-\s+([^-]{2,40})$/);
      if (sufijo) {
        publicadoPor = sufijo[1].trim();
        titulo = titulo.slice(0, sufijo.index).trim();
      }
      extracto = '';
    }

    return {
      titulo,
      url: url.trim(),
      extracto,
      fecha: fechaTexto ? new Date(fechaTexto) : null,
      fuente: publicadoPor,
      fuenteId: fuente.id,
      // Varias fuentes pueden compartir medio (arXiv cs.AI y cs.CL, por ejemplo).
      // El bono por cobertura multiple cuenta medios, no feeds.
      medio: fuente.medio ?? fuente.id,
      peso: fuente.peso,
      categoria: fuente.categoria,
    };
  });
}

/** Hacker News via la API de Algolia: historias de IA por encima de X puntos. */
async function leerHackerNews(fuente, desde) {
  const consulta = new URLSearchParams({
    tags: 'story',
    query: 'AI OR LLM OR OpenAI OR Anthropic OR "machine learning"',
    numericFilters: `points>${fuente.minPuntos ?? 150},created_at_i>${Math.floor(desde.getTime() / 1000)}`,
    hitsPerPage: '50',
  });
  const datos = JSON.parse(await descargar(`${fuente.url}?${consulta}`));

  return (datos.hits ?? []).map((h) => ({
    titulo: limpiarTexto(h.title),
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    extracto: '',
    fecha: new Date(h.created_at),
    fuente: fuente.nombre,
    fuenteId: fuente.id,
    medio: fuente.medio ?? fuente.id,
    // Una historia muy votada pesa mas que una que apenas paso el filtro.
    peso: fuente.peso + Math.min(2, Math.floor((h.points ?? 0) / 400)),
    categoria: fuente.categoria,
    puntos: h.points,
  }));
}

// --- filtrado, agrupado y puntuacion ----------------------------------------

function esDeIA(noticia) {
  if (noticia.categoria === 'oficial' || noticia.categoria === 'investigacion') return true;
  return REGEX_IA.test(normalizar(`${noticia.titulo} ${noticia.extracto}`));
}

/**
 * Firma de una historia: sus palabras significativas. Dos noticias con muchas
 * palabras en comun cuentan lo mismo aunque los titulares no sean identicos.
 */
function palabrasClave(titulo) {
  const vacias = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'its', 'are', 'was', 'has', 'new',
    'los', 'las', 'una', 'uno', 'del', 'que', 'por', 'con', 'para', 'como', 'sus', 'mas', 'sin',
  ]);
  return new Set(
    normalizar(titulo)
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((p) => p.length > 3 && !vacias.has(p)),
  );
}

function solapamiento(a, b) {
  if (!a.size || !b.size) return 0;
  let comunes = 0;
  for (const p of a) if (b.has(p)) comunes++;
  return comunes / Math.min(a.size, b.size);
}

/** Agrupa noticias que cuentan la misma historia. La de mayor peso lidera el grupo. */
function agrupar(noticias, umbral = 0.5) {
  const grupos = [];
  for (const n of noticias) {
    const firma = palabrasClave(n.titulo);
    const grupo = grupos.find((g) => solapamiento(firma, g.firma) >= umbral);
    if (grupo) {
      grupo.miembros.push(n);
      if (n.peso > grupo.lider.peso) grupo.lider = n;
    } else {
      grupos.push({ firma, lider: n, miembros: [n] });
    }
  }
  return grupos;
}

function puntuar(grupo, config, ahora) {
  const { palabrasFuertes, patronesPromocionales = [] } = config;
  const { lider, miembros } = grupo;
  let puntos = lider.peso * 2;

  // Los blogs corporativos mezclan lanzamientos con casos de exito de clientes.
  // Lo segundo no es noticia, asi que se hunde en vez de descartarse: alguna vez
  // un "How X built Y" si tiene sustancia tecnica.
  if (lider.categoria === 'oficial' && patronesPromocionales.some((p) => new RegExp(p, 'i').test(lider.titulo))) {
    puntos -= 6;
  }

  // Que varias fuentes independientes lo cubran es la senal mas fiable de que importa.
  const fuentesDistintas = new Set(miembros.map((m) => m.medio)).size;
  puntos += (fuentesDistintas - 1) * 4;

  const texto = normalizar(`${lider.titulo} ${lider.extracto}`);
  if (palabrasFuertes.some((p) => texto.includes(normalizar(p)))) puntos += 3;

  // Ligera preferencia por lo mas reciente dentro de la misma semana.
  if (lider.fecha) {
    const dias = (ahora - lider.fecha) / 86400000;
    puntos += Math.max(0, 3 - dias / 2);
  }

  return Math.round(puntos * 10) / 10;
}

function clasificar(noticia, secciones) {
  // Un preprint es investigacion aunque su titulo hable de modelos o benchmarks.
  if (noticia.categoria === 'investigacion') return 'investigacion';
  const texto = normalizar(`${noticia.titulo} ${noticia.extracto}`);
  const seccion = secciones.find((s) => s.claves.some((c) => texto.includes(normalizar(c))));
  return seccion?.id ?? 'producto';
}

// --- orquestacion -----------------------------------------------------------

export async function recolectar({ dias = 7, maximo = 24 } = {}) {
  const config = JSON.parse(await readFile(join(AQUI, 'fuentes.json'), 'utf8'));
  const ahora = new Date();
  const desde = new Date(ahora.getTime() - dias * 86400000);

  const informe = [];
  const resultados = await Promise.all(
    config.fuentes.map(async (fuente) => {
      try {
        const noticias =
          fuente.tipo === 'hn'
            ? await leerHackerNews(fuente, desde)
            : leerFeed(await descargar(fuente.url), fuente);
        informe.push({ fuente: fuente.nombre, id: fuente.id, estado: 'ok', total: noticias.length });
        return noticias;
      } catch (err) {
        informe.push({ fuente: fuente.nombre, id: fuente.id, estado: 'error', motivo: err.message });
        return [];
      }
    }),
  );

  const ruido = config.palabrasRuido.map(normalizar);
  const candidatas = resultados
    .flat()
    .filter((n) => n.titulo && n.url)
    .filter((n) => n.fecha && !Number.isNaN(n.fecha.valueOf()) && n.fecha >= desde && n.fecha <= ahora)
    .filter((n) => !ruido.some((r) => normalizar(n.titulo).includes(r)))
    .filter(esDeIA);

  // Un mismo enlace puede llegar por dos caminos; nos quedamos con la primera copia.
  const porUrl = new Map();
  for (const n of candidatas) {
    const clave = n.url.split('?')[0].replace(/\/$/, '');
    if (!porUrl.has(clave)) porUrl.set(clave, n);
  }

  const grupos = agrupar([...porUrl.values()].sort((a, b) => b.peso - a.peso));

  const noticias = grupos
    .map((g) => ({
      ...g.lider,
      fecha: g.lider.fecha.toISOString(),
      puntuacion: puntuar(g, config, ahora),
      seccion: clasificar(g.lider, config.secciones),
      tambienEn: [...new Set(g.miembros.map((m) => m.fuente))].filter((f) => f !== g.lider.fuente),
    }))
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, maximo);

  return {
    semana: idSemana(ahora),
    generadoEn: ahora.toISOString(),
    ventanaDias: dias,
    secciones: config.secciones,
    informe: informe.sort((a, b) => a.fuente.localeCompare(b.fuente)),
    noticias,
  };
}

// --- interfaz de linea de comandos ------------------------------------------

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const dias = Number(args[args.indexOf('--dias') + 1]) || 7;
  const datos = await recolectar({ dias });

  if (args.includes('--json')) {
    console.log(JSON.stringify(datos, null, 2));
  } else {
    const caidas = datos.informe.filter((f) => f.estado === 'error');
    console.log(`\nSemana ${datos.semana} - ${datos.noticias.length} noticias de los ultimos ${dias} dias`);
    console.log(`Fuentes: ${datos.informe.length - caidas.length} ok, ${caidas.length} con error\n`);
    for (const f of caidas) console.log(`  x ${f.fuente}: ${f.motivo}`);
    if (caidas.length) console.log('');
    for (const n of datos.noticias) {
      const extra = n.tambienEn.length ? ` (+${n.tambienEn.length})` : '';
      console.log(`  ${String(n.puntuacion).padStart(5)}  [${n.seccion}] ${n.fuente}${extra}`);
      console.log(`         ${n.titulo}`);
    }
    console.log('');
  }
}
