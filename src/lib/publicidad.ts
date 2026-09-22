// La cuenta de AdSense por sí sola no activa scripts ni bloques publicitarios.
// Antes de habilitarlos debe publicarse y probarse una CMP certificada para
// EEE, Reino Unido y Suiza, además de revisar las páginas legales.
export const ADSENSE_CLIENTE = import.meta.env.PUBLIC_ADSENSE_CLIENT?.trim();
export const PUBLICIDAD_ACTIVA = Boolean(
  ADSENSE_CLIENTE && import.meta.env.PUBLIC_ADSENSE_CMP_READY === 'true',
);
