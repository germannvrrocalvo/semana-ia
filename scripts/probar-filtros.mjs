// Pruebas del filtro de entrada de Semana IA.
//
//   node scripts/probar-filtros.mjs
//
// No toca la red: son casos fijos que pasan por admitir(), la misma funcion que
// usa el recolector. Cada caso es una noticia real o una variante minima de una
// real, con el motivo por el que debe entrar o quedarse fuera.
//
// El workflow las ejecuta antes de generar la edicion: si un cambio en los
// filtros vuelve a dejar pasar un articulo de ofertas, la edicion no se publica.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { admitir } from './fetch-news.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(join(AQUI, 'fuentes.json'), 'utf8'));
const fuentePorId = new Map(config.fuentes.map((f) => [f.id, f]));

/** @type {{nombre: string, admitida: boolean, porque: string, noticia: object}[]} */
const CASOS = [
  {
    nombre: 'Ofertas de AliExpress en Xataka',
    admitida: false,
    porque: 'vive bajo /seleccion/, que es la seccion de ofertas de Xataka',
    noticia: {
      fuenteId: 'xataka',
      categoria: 'espanol',
      url: 'https://www.xataka.com/seleccion/aliexpress-comienza-hoy-nueva-promo-cupones-60-euros-hay-nintendo-switch-2-moviles-xiaomi-relojes-garmin',
      titulo:
        'AliExpress comienza hoy nueva promo con cupones de hasta 60 euros: hay Nintendo Switch 2, móviles Xiaomi, relojes Garmin y más',
      extracto:
        'Con la vuelta al cole, llega una nueva promo de AliExpress. Esta se llama Rebajas de otoño, viene con ofertas muy interesantes en tecnología. Para ello, tenemos varios cupones de descuento para aplicar. Descuento compra mínima cupón.',
    },
  },
  {
    nombre: 'El mismo articulo de ofertas fuera de /seleccion/',
    admitida: false,
    porque:
      'sin la ruta delatora tiene que caer igual: "se llama" ya no cuenta como mencion del modelo Llama',
    noticia: {
      fuenteId: 'xataka',
      categoria: 'espanol',
      url: 'https://www.xataka.com/otro/promo-de-otono',
      titulo: 'Empieza una nueva promo con descuentos en móviles y consolas',
      extracto:
        'Con la vuelta al cole, llega una nueva promo de AliExpress. Esta se llama Rebajas de otoño y trae precios interesantes en tecnología.',
    },
  },
  {
    nombre: 'Publirreportaje con declaracion de comision',
    admitida: false,
    porque: 'el propio medio declara la comision de afiliacion en el cuerpo',
    noticia: {
      fuenteId: 'xataka',
      categoria: 'espanol',
      url: 'https://www.xataka.com/analisis/trituradora-de-papel',
      titulo: 'Esta trituradora de papel con asistente inteligente cuesta 16,99 euros',
      extracto:
        'Una de las tareas más tediosas es tirar la ristra de tickets y facturas. Trituradora de papel hoy por 16,99 euros. El precio podría variar. Obtenemos comisión.',
    },
  },
  {
    nombre: 'Accesorios para el iPhone',
    admitida: false,
    porque: 'no menciona nada de inteligencia artificial',
    noticia: {
      fuenteId: 'xataka',
      categoria: 'espanol',
      url: 'https://www.xataka.com/moviles/accesorios-iphone',
      titulo: 'Los cinco accesorios imprescindibles para tu nuevo iPhone 18 Pro',
      extracto: 'Desde el pasado sábado ya se puede reservar el nuevo iPhone 18 Pro.',
    },
  },
  {
    nombre: 'Publirreportaje patrocinado de VentureBeat',
    admitida: false,
    porque:
      'la declaracion de patrocinio esta en el cuerpo, que es donde no miraba el filtro de ruido',
    noticia: {
      fuenteId: 'venturebeat',
      categoria: 'medio',
      url: 'https://venturebeat.com/ai/orquestacion-atencion-cliente',
      titulo: 'Orchestration is the new frontier of AI customer service',
      extracto:
        'Presented by Tata Communications. This article is sponsored. Las empresas conectan agentes de IA y voz automatizada a sistemas heredados.',
    },
  },
  {
    nombre: 'Lanzamiento de Llama 5',
    admitida: true,
    porque: 'el modelo de Meta con version es una mencion legitima',
    noticia: {
      fuenteId: 'xataka',
      categoria: 'espanol',
      url: 'https://www.xataka.com/inteligencia-artificial/meta-presenta-llama-5',
      titulo: 'Meta presenta Llama 5 con una ventana de contexto de un millón de tokens',
      extracto: 'La compañía publica los pesos del modelo y su licencia de uso.',
    },
  },
  {
    nombre: 'Bajada de precios de una API',
    admitida: true,
    porque:
      'habla de precios y descuentos, pero es noticia: el filtro comercial no puede llevarse esto',
    noticia: {
      fuenteId: 'xataka',
      categoria: 'espanol',
      url: 'https://www.xataka.com/inteligencia-artificial/google-baja-precio-gemini',
      titulo: 'Google aplica un descuento del 40% en el precio de la API de Gemini',
      extracto:
        'La rebaja afecta a los modelos de razonamiento y busca competir con la tarifa de OpenAI.',
    },
  },
  {
    nombre: 'Anuncio en un blog oficial',
    admitida: true,
    porque: 'en un blog de laboratorio todo es de IA por definicion, no se exige la mencion',
    noticia: {
      fuenteId: 'openai',
      categoria: 'oficial',
      url: 'https://openai.com/index/algo-nuevo',
      titulo: 'Introducing a new way to build agents',
      extracto: 'Hoy publicamos una forma nueva de construir agentes.',
    },
  },
];

let fallos = 0;
for (const caso of CASOS) {
  const fuente = fuentePorId.get(caso.noticia.fuenteId);
  const resultado = admitir(caso.noticia, config, fuente);
  const bien = resultado === caso.admitida;
  if (!bien) fallos += 1;
  const marca = bien ? 'ok  ' : 'FALLO';
  const esperado = caso.admitida ? 'deberia entrar' : 'deberia quedarse fuera';
  console.log(`${marca} ${caso.nombre}`);
  if (!bien) console.log(`      ${esperado} porque ${caso.porque}, y ha ocurrido lo contrario`);
}

console.log(`\n${CASOS.length - fallos} de ${CASOS.length} casos correctos.`);
if (fallos > 0) process.exit(1);
