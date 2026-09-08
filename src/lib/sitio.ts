/*
  Datos de la publicacion.

  Estan en un solo sitio porque los repiten las paginas legales, el pie, los datos
  estructurados y los metadatos sociales. Si cambia el correo o el responsable,
  se cambia aqui y ya esta.

  REVISAR ANTES DE SOLICITAR ADSENSE: Google exige poder identificar a quien
  publica y una via de contacto que funcione. Los dos campos marcados abajo son
  los unicos que hay que confirmar; el resto describe el sitio tal y como es.
*/
export const SITIO = {
  nombre: 'Semana IA',
  url: 'https://semana-ia.vercel.app',
  descripcion:
    'Boletín semanal en español sobre inteligencia artificial. Cada lunes, lo que ha pasado durante los siete días anteriores.',

  /** CONFIRMAR: nombre de la persona o entidad responsable de la publicacion. */
  responsable: 'Germán Navarro',

  /** CONFIRMAR: conviene una direccion propia del sitio, no la personal de siempre. */
  correo: 'germannvrro@gmail.com',

  /** Ano de la primera edicion, para el aviso de derechos del pie. */
  desde: 2026,

  /** El repositorio es publico y es parte de la explicacion de como se hace. */
  repositorio: 'https://github.com/germannvrrocalvo/semana-ia',
} as const;
