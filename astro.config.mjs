// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // Necesario para el sitemap, el RSS y las URL canonicas.
  // Cambialo si algun dia pones un dominio propio.
  site: 'https://semana-ia.vercel.app',

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [sitemap()],
});
