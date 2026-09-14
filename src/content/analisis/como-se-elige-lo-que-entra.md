---
titulo: "Cómo se elige lo que entra en Semana IA"
descripcion: "Diecinueve fuentes, un filtro que confundió un verbo con un modelo de Meta y una regla incómoda: que muchos medios cubran algo no significa que importe."
fecha: 2026-09-14
firma: "Germán Navarro"
borrador: true
---

<!--
  BORRADOR. Mientras borrador siga en true, esta pieza no se publica: no sale en
  /analisis, ni en el sitemap, ni en ningún índice.

  Todo lo que hay aquí es verificable en el repositorio: las cifras, los dos casos
  que se colaron y las reglas de puntuación salen de scripts/fuentes.json y de
  scripts/fetch-news.mjs. No hay ni un dato inventado.

  Lo que falta es tuyo, y está marcado con [TU OPINIÓN]. Son cuatro sitios. Sin
  ellos esto es documentación técnica; con ellos es una pieza que solo puedes
  firmar tú, y es la diferencia entre un agregador y una publicación.

  Cuando termines: borra este comentario y pon borrador: false.
-->

Cada lunes entran en Semana IA entre veinte y veinticinco noticias. La semana pasada los
candidatos fueron algo más de trescientos. Esta pieza explica qué pasa entre esas dos cifras,
porque es lo único que de verdad distingue a esta publicación de una lista de enlaces.

## Diecinueve fuentes, y ninguna paga por estar

El material sale de diecinueve fuentes públicas, todas por RSS o por API abierta: los blogs
oficiales de los laboratorios (OpenAI, Google DeepMind, Meta, Microsoft, NVIDIA, Mistral, Hugging
Face), la prensa especializada (TechCrunch, The Verge, Ars Technica, MIT Technology Review,
VentureBeat, WIRED), dos categorías de arXiv, Hacker News y dos medios en español, Xataka e
Hipertextual.

Ninguna paga por aparecer y ninguna puede pedir que se la quite del recuento. La lista está
publicada y añadir o quitar una es cambiar una línea en un archivo. Eso es a propósito: si el
catálogo fuera negociable, todo lo demás daría igual.

[TU OPINIÓN: aquí conviene que digas por qué faltan medios en español, que son solo dos de
diecinueve, y si eso te parece un problema del sitio o del mercado. Es una carencia real y es
mejor que la cuentes tú antes de que la note un lector.]

## Lo que se descarta antes de puntuar nada

Un agregador se nota en lo que deja fuera. Lo primero que cae no es lo irrelevante, es lo
comercial.

Los medios de tecnología viven en parte de las ofertas. Xataka publica las suyas bajo
`/seleccion/`, Hipertextual agrupa su contenido de marca en `/brands/`, y ninguna de esas
direcciones ha contenido nunca una noticia. Están excluidas por fuente, no por palabras: es más
fiable saber dónde publica un medio sus publirreportajes que intentar reconocerlos por el titular.

Lo segundo es más elegante, porque lo delata el propio medio. En España es obligatorio declarar la
comisión de afiliación y el patrocinio, así que los artículos comerciales llevan escrita su propia
sentencia: «obtenemos comisión», «este artículo está patrocinado», «el precio podría variar». Esas
frases viven en el cuerpo del texto, no en el titular, y basta buscarlas ahí.

Lo tercero son las listas de trucos y los casos de éxito de clientes en los blogs corporativos.
Esos no se descartan: se hunden. Alguna vez un «cómo construimos X» tiene sustancia técnica de
verdad, y matarlos a todos sería tirar lo bueno con lo malo.

## El cupón de AliExpress

El 14 de septiembre de 2026 se publicó en la edición 37 una recopilación de cupones de AliExpress
con Nintendo Switch y relojes Garmin. En un boletín de inteligencia artificial.

La causa no fue un descuido, y merece contarse porque explica cómo se rompen estos sistemas. El
filtro que decide si algo es «de IA» busca una lista de términos: `gpt`, `chatgpt`, `openai`,
`anthropic`, `transformer`, `llama`. Ese último es el modelo de Meta. Y el extracto del artículo
de Xataka decía:

> Con la vuelta al cole, llega una nueva promo de AliExpress. Esta se **llama** Rebajas de otoño.

El filtro leyó el presente del verbo *llamar* y entendió que se hablaba del modelo de Meta. El
mismo código ya tenía una nota sobre este problema para el término `ai`, que en español caza
«aire», «paisaje» y «bailar»; se había resuelto exigiendo palabra completa. Pero `llama` **es** una
palabra española completa, así que la solución anterior no servía. Ahora el término exige versión o
apellido: `llama 3`, `code llama`, `llama guard`.

Al revisarlo apareció un segundo caso que nadie había visto: en la edición 35 se había publicado un
texto de VentureBeat patrocinado por Tata Communications. Pasó porque el filtro de ruido solo
miraba el titular.

Las dos noticias se retiraron de sus ediciones, y las dos son ahora casos de prueba que se ejecutan
antes de generar cada edición. Si un cambio futuro vuelve a dejar pasar uno, la edición no se
publica.

[TU OPINIÓN: di qué te pareció encontrarte eso publicado, y si crees que el sistema se puede
cerrar del todo o hay que convivir con fallos así. Un lector se fía más de quien cuenta sus errores
que de quien presume de no tenerlos.]

## La regla incómoda

Cuando ya solo queda lo que sí es noticia, hay que ordenarlo. La señal que más peso tiene es esta:
que varios medios independientes cubran la misma historia. Cada medio adicional que la cuenta suma
cuatro puntos, más que cualquier otro factor.

Es una regla razonable y es una regla discutible. Premia el consenso, y el consenso se equivoca a
menudo en tecnología: lo importante de verdad suele empezar en un sitio pequeño y tarda semanas en
llegar a los grandes. Mide atención, no importancia, y no son lo mismo.

[TU OPINIÓN: esto es el corazón de la pieza. ¿Compras el consenso como medida de relevancia?
¿Recuerdas alguna semana en la que el orden te pareciera claramente mal? ¿Qué usarías en su lugar,
si es que hay algo mejor que no sea leerlas una por una?]

## Lo que no hace la máquina

Los titulares traducidos al español y los resúmenes los escribe un modelo de lenguaje a partir del
titular y del extracto que publica cada medio. Eso hay que decirlo claro y está dicho en el
método.

Lo que el modelo no hace: inventar noticias, escribir artículos completos ni sustituir a la fuente.
Cada entrada enlaza siempre al original, y ese es el texto que cuenta. Si un resumen no se
corresponde con lo que dice el artículo, es un error de esta casa y se corrige en cuanto se avisa.

[TU OPINIÓN: cierra tú. Lo que un lector quiere saber al llegar aquí es por qué debería fiarse de
un sitio que automatiza la selección, y esa respuesta no la puede dar el código.]
