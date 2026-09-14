// Prepara el archivo de la columna de una semana.
//
//   node scripts/nueva-columna.mjs              -> la ultima edicion publicada
//   node scripts/nueva-columna.mjs 2026-W37     -> una semana concreta
//
// Deja en src/content/columnas/<semana>.md un archivo con la cabecera puesta, el
// material que dejo el robot recogido arriba y el resto en blanco. Nace con
// borrador: true, asi que no se publica hasta que lo quites tu.
//
// Nunca sobrescribe: si el archivo existe, avisa y no toca nada.

import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const EDICIONES = join(RAIZ, 'src', 'content', 'ediciones');
const COLUMNAS = join(RAIZ, 'src', 'content', 'columnas');

/* La firma sale de src/lib/sitio.ts, que es donde vive el responsable del sitio.
   Se lee con una expresion regular en vez de importarlo porque es TypeScript y
   este script lo ejecuta Node a pelo. */
async function firma() {
  const fuente = await readFile(join(RAIZ, 'src', 'lib', 'sitio.ts'), 'utf8');
  return fuente.match(/responsable:\s*'([^']+)'/)?.[1] ?? 'Redacción';
}

/** Separa el frontmatter del cuerpo de un Markdown. */
function partir(texto) {
  const m = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { cabecera: m[1], cuerpo: m[2].trim() } : { cabecera: '', cuerpo: texto.trim() };
}

const campo = (cabecera, nombre) =>
  cabecera.match(new RegExp(`^${nombre}:\\s*"?(.*?)"?\\s*$`, 'm'))?.[1] ?? '';

const semanaPedida = process.argv[2];

const archivos = (await readdir(EDICIONES)).filter((f) => f.endsWith('.md')).sort();
if (archivos.length === 0) {
  console.error('No hay ninguna edicion publicada todavia.');
  process.exit(1);
}

const nombre = semanaPedida ? `${semanaPedida}.md` : archivos[archivos.length - 1];
if (!archivos.includes(nombre)) {
  console.error(`No existe la edicion ${nombre}. Hay estas: ${archivos.join(', ')}`);
  process.exit(1);
}

const { cabecera, cuerpo } = partir(await readFile(join(EDICIONES, nombre), 'utf8'));
const semana = campo(cabecera, 'semana') || nombre.replace('.md', '');
const titulo = campo(cabecera, 'titulo');
const destacado = campo(cabecera, 'destacado');
const titularCorto = campo(cabecera, 'titularCorto');

const destino = join(COLUMNAS, `${semana}.md`);
if (await access(destino).then(() => true, () => false)) {
  console.error(`Ya existe ${destino}. No se toca.`);
  process.exit(1);
}

/* El material del robot va en un comentario HTML: se ve al editar y no se publica.
   La idea es que sea el punto de partida y que acabe borrado. */
const plantilla = `---
semana: "${semana}"
titulo: "TITULO DE LA COLUMNA"
fecha: ${new Date().toISOString().slice(0, 10)}
firma: "${await firma()}"
borrador: true
---

<!--
  Material de la semana, tal y como lo dejo el robot. Es para arrancar, no para
  publicar: cuando termines la columna, borra este bloque.

  Semana:    ${titulo}
  Titular:   ${titularCorto || destacado}
  Entradilla del robot:
  ${cuerpo.replace(/\n/g, '\n  ') || '(esta edicion no trae entradilla)'}

  Tres preguntas que suelen bastar para escribirla:
  1. Que patron ves en la semana que no se ve en ninguna noticia por separado.
  2. Que te ha sorprendido de verdad, y por que esperabas otra cosa.
  3. Que ha cubierto todo el mundo y crees que no importa. Esto es lo que nadie
     mas escribe, y es lo que hace que la columna valga algo.

  Cuando quites borrador: true, la columna sustituye a la entradilla del robot en
  la edicion, firmada y en primer lugar.
-->

Escribe aquí.
`;

await writeFile(destino, plantilla, 'utf8');
console.log(`Creada ${destino}`);
console.log('Lleva borrador: true, asi que todavia no se publica.');
