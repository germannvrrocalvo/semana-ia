# Semana IA

Boletín semanal en español sobre inteligencia artificial. Cada lunes un proceso automático
recopila lo publicado durante los siete días anteriores, redacta un borrador y abre un Pull
Request. Nada se publica sin que una persona lo apruebe.

Sitio en producción: https://semana-ia-sapiensias-projects.vercel.app

## Cómo funciona

```
Lunes 06:00 UTC
      │
      ├─ scripts/fetch-news.mjs    lee 19 fuentes, filtra, agrupa y puntúa
      ├─ scripts/build-issue.mjs   redacta la edición y escribe el Markdown
      │
      ▼
src/content/ediciones/2026-W35.md  ──►  Pull Request  ──►  vista previa en Vercel
                                              │
                                              └─ merge  ──►  producción
```

Una edición es **un archivo Markdown**. Todo lo demás son plantillas que lo pintan.

## Comandos

```bash
npm run dev              # servidor de desarrollo en localhost:4321
npm run build            # compila el sitio a dist/
npm run noticias         # imprime las noticias de la semana sin escribir nada
npm run edicion          # genera la edición de esta semana
npm run edicion -- --dry-run   # la imprime por pantalla sin guardarla
npm run edicion -- --forzar    # sobrescribe una edición ya existente
```

## Editar el contenido

- **Añadir o quitar fuentes:** `scripts/fuentes.json`. Cada fuente tiene un `peso` de 1 a 5 que
  sube la relevancia de todo lo que publique. El archivo también contiene las secciones, las
  palabras que suben la puntuación y las que descartan una noticia por ruido.
- **Corregir una edición publicada:** edita su archivo en `src/content/ediciones/` y haz commit.
  Vercel vuelve a desplegar solo.
- **Escribir una edición a mano:** copia el formato de una existente y pon `generadoPor: "manual"`.

El esquema de `src/content.config.ts` valida cada edición al compilar. Si falta un campo o una URL
está mal formada, el build falla antes de llegar a producción.

## Resúmenes con IA

El robot funciona sin configurar nada: usa el extracto original de cada fuente. Para que redacte
resúmenes propios en español, añade una clave de la API de Anthropic en el repositorio
(Settings → Secrets and variables → Actions → New repository secret) con el nombre
`ANTHROPIC_API_KEY`. Coste aproximado: unos céntimos por edición.

Si la clave falta o la llamada falla, la edición se genera igual con los extractos originales.

## Stack

Astro 7 · Tailwind 4 · Markdown · GitHub Actions · Vercel. Sitio estático, sin base de datos y sin
servidor propio.
