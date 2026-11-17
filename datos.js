/* ============================================================================
   INVITACIÓN DE XV AÑOS · DEMOSTRACIÓN
   ----------------------------------------------------------------------------
   Todos los datos de este archivo son INVENTADOS. Esta copia existe para
   enseñar el diseño y el funcionamiento: el nombre, la fecha, los lugares y
   el teléfono no corresponden a ninguna persona ni a ningún sitio real.

   Es el único archivo que hay que tocar para montar una invitación de verdad.
   Lo que esté en `null` se oculta solo hasta que se complete.

   Con `vistaPrevia` en true se ven contenidos de ejemplo marcados como tales,
   para revisar el diseño. En false, la invitación se ve como la verá el
   invitado. Aquí va en false porque los datos ya están puestos.
   ========================================================================== */

const DATOS = {

  vistaPrevia: false,

  festejada: {
    nombre:    'Camila Renata',
    apellidos: 'Herrera Valdés',
    corto:     'Camila'
  },

  celebracion: 'Mis XV años',

  /* La tarjeta del sobre -----------------------------------------------------
     Lo primero que se ve, y lo único que se ve antes de bajar. No lleva nombre
     ni fecha ni lugar: solo insinúa y empuja a seguir. El nombre llega
     después, cuando se desvela la fotografía.
     Si un renglón se pasa de largo, el texto se encoge para caber y pierde
     fuerza, así que conviene respetar los límites:
       epigrafe → versales finas arriba        (hasta ~14 caracteres · opcional)
       frase    → la caligrafía grande         (hasta ~15 caracteres)
       apoyo    → versales bajo la caligrafía  (hasta ~17 caracteres)
       pie      → versales pequeñas al pie     (hasta ~27 caracteres)
     Déjalo todo en null y la tarjeta vuelve a mostrar nombre y fecha.          */
  portada: {
    epigrafe: null,
    frase:    'Algo muy especial',
    apoyo:    'está por suceder',
    // el pie lo pone la flecha de «Desliza»: repetirlo aquí sobraba
    pie:      null
  },

  /* Ciudad, solo para el pie de la firma final */
  ciudad: 'Guadalajara · Jalisco',

  /* Fecha ------------------------------------------------------------------
     iso: 'AAAA-MM-DDTHH:MM:SS' en hora local del evento.
     Con una fecha válida se activa la cuenta regresiva.                      */
  fecha: {
    // Sábado 12 de junio de 2027, 6:00 p.m. Fecha inventada para la demo.
    // El contador apunta a la misa, no a la recepción.
    iso:      '2027-06-12T18:00:00',
    zona:     'America/Mexico_City',
    ejemplo:  '2026-05-16T19:00:00'
  },

  /* Sedes ------------------------------------------------------------------
     Añade solo los momentos que existan. No se presupone ceremonia religiosa.
     Con `mapa` en null, el botón «Cómo llegar» se arma solo buscando el
     nombre y la dirección en Google Maps.                                    */
  sedes: [
    {
      tipo:      'Misa',
      nombre:    'Parroquia de San Felipe de Jesús',
      hora:      '6:00 p.m.',
      direccion: 'Av. de los Jardines 1420, Chapalita, 45040 Zapopan, Jalisco',
      mapa:      null
    },
    {
      tipo:      'Recepción',
      nombre:    'Hacienda Los Laureles',
      hora:      '8:30 p.m.',
      direccion: 'Camino Real al Bosque 55, El Bajío, 45645 Zapopan, Jalisco',
      mapa:      null
    }
  ],
  sedesEjemplo: [
    { tipo:'Ceremonia', nombre:'Nombre del recinto', hora:'6:00 p.m.',
      direccion:'Calle y número, colonia, ciudad', mapa:null },
    { tipo:'Recepción', nombre:'Nombre del salón',  hora:'8:00 p.m.',
      direccion:'Calle y número, colonia, ciudad', mapa:null }
  ],

  /* Itinerario -------------------------------------------------------------
     icono: arco · tacones · brindis · cena · fiesta                          */
  itinerario: [
    { hora:'6:00 p.m.',  titulo:'Ceremonia',  icono:'arco'    },
    { hora:'8:30 p.m.',  titulo:'Recepción',  icono:'cena'    },
    { hora:'9:15 p.m.',  titulo:'Vals',       icono:'tacones' },
    { hora:'9:45 p.m.',  titulo:'Brindis',    icono:'brindis' },
    { hora:'10:30 p.m.', titulo:'Baile',      icono:'fiesta'  }
  ],
  itinerarioEjemplo: [
    { hora:'6:00 p.m.',  titulo:'Ceremonia',   icono:'arco'    },
    { hora:'8:00 p.m.',  titulo:'Recepción',   icono:'cena'    },
    { hora:'8:40 p.m.',  titulo:'Vals',        icono:'tacones' },
    { hora:'9:15 p.m.',  titulo:'Brindis',     icono:'brindis' },
    { hora:'10:00 p.m.', titulo:'Baile',       icono:'fiesta'  }
  ],

  vestimenta: { codigo:'Etiqueta', nota:'Vestido largo · traje oscuro' },
  vestimentaEjemplo: { codigo:'Etiqueta', nota:'Vestido largo · traje oscuro' },

  /* Confirmación -----------------------------------------------------------
     tipo: 'whatsapp' | 'formulario' | null
     whatsapp: número con lada internacional y sin signos. Ej: '523111234567'
     formulario: URL real que reciba el POST (Formspree o similar)

     El número de aquí abajo está inventado: termina en ocho ceros, que no se
     asignan a ninguna línea. El botón funciona y abre WhatsApp, pero no
     escribe a nadie.                                                          */
  confirmacion: {
    tipo:        'whatsapp',
    whatsapp:    '525500000000',
    formulario:  null,
    fechaLimite: '30 de abril'
  },

  /* Fotografías ------------------------------------------------------------
     Coloca los archivos en assets/fotos/ y escribe aquí sus nombres.         */
  fotos: {
    portada:  'assets/fotos/portada.webp',
    momentos: []                 // ej: ['assets/fotos/foto-1.jpg', ...]
  },

  /* Música -----------------------------------------------------------------
     Coloca tu archivo en assets/musica.mp3. Nunca arranca sola al cargar:
     empieza al abrir el sobre y siempre se puede silenciar.                  */
  musica: {
    /* En null no se pide nada. Con la ruta puesta y el archivo ausente, el
       navegador lanzaba una petición que moría en 404 y costaba 2 s en 3G.
       Cuando tengas el mp3, lo dejas en assets/musica.mp3 y pones aquí
       'assets/musica.mp3'. */
    archivo: null,
    titulo:  null
  },

  mensajes: {
    /* Tres momentos encadenados, y en este orden:
       1 · presentacion → intriga. No dice a qué se invita: solo que hay algo.
       2 · puente       → tiende la mano al tercero, señalando a una persona.
       3 · lo dice la propia sección de la fotografía: «Te invito · mis XV años».
       Si en el 1 ya se nombran los quince años, el final deja de ser final. */
    presentacion: 'Hay días que se sueñan mucho antes de llegar. ' +
                  'El mío ya tiene fecha, y me encantaría que me acompañaras.',
    puente:       'Solo falta que conozcas a quien lo soñó.',
    invitacion:   'Con la bendición de mis padres y el cariño de quienes me ' +
                  'han acompañado, te invito a celebrar conmigo.',
    cierre:       'Lo más especial de esta noche será compartirla contigo.'
  },

  /* El tercer momento, el que llega con la fotografía. Es la respuesta al
     puente: «conoce a quien lo soñó» → aquí está, y te invita. Por eso es una
     frase seguida y no dos rótulos sueltos encima y debajo del nombre.
     `antes` en null deja el nombre solo, que es como respira mejor. */
  revelacion: {
    antes:    null,
    despues:  'Te invito a mis',
    destacado:'XV años'            // el golpe final: va en grande y en versales
  },

  /* Apertura ---------------------------------------------------------------
     'dom'   → animación por capas (recomendada: más nítida y sin esperas)
     'video' → encadena assets/apertura-1.mp4 y apertura-2.mp4               */
  apertura: { modo: 'video' }
};
