// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Necesario para el sitemap, el RSS y las URL canonicas: Astro necesita saber
  // el dominio final en tiempo de compilacion. Cambialo el dia que pongas un
  // dominio propio, o el RSS seguira apuntando aqui.
  site: 'https://semana-ia.vercel.app',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    sitemap({
      // /buscar no tiene contenido propio que indexar: lleva noindex, y anunciarla
      // en el sitemap al mismo tiempo seria pedirle a Google dos cosas contrarias.
      filter: (pagina) => !pagina.includes('/buscar'),
    }),
  ],
});
