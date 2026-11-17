/* ===========================================================================
   Invitación de XV años · demostración
   Un solo sistema de animación: revelados por observer + un bucle de scroll.
   =========================================================================== */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const D  = (typeof DATOS !== 'undefined' && DATOS) || window.DATOS || {};
const QUIETO = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* interruptores de prueba por URL, sin tocar archivos:
   ?preview=0  → cómo lo verá el invitado   ·   ?apertura=video → encadena los dos vídeos */
const URLP   = new URLSearchParams(location.search);
const PREVIA = URLP.has('preview') ? URLP.get('preview') === '1' : !!D.vistaPrevia;
const MODO   = URLP.get('apertura') || (D.apertura && D.apertura.modo) || 'dom';

/* usa el valor real si existe; si no, el de ejemplo en vista previa */
const dato = (real, ejemplo) => {
  const vacio = real == null || (Array.isArray(real) && !real.length);
  if (!vacio) return { v: real, ejemplo: false };
  if (PREVIA && ejemplo != null) return { v: ejemplo, ejemplo: true };
  return { v: null, ejemplo: false };
};

/* Si un bloque falla (un dato mal escrito, un elemento que falta), se avisa en la
   consola y el resto de la invitación sigue montándose. Nunca se queda a medias. */
const seguro = (nombre, fn) => {
  try { fn(); }
  catch (e) { console.warn('Invitación · no se pudo montar «' + nombre + '»:', e); }
};

const chip = (txt) => {
  const p = document.createElement('p');
  p.className = 'pendiente';
  p.textContent = txt;
  return p;
};

/* ══════════════ 1 · APERTURA DEL SOBRE ══════════════ */

const escenario = $('#escenario');
const cuerpo    = document.body;
let   abierto   = false;

/* La apertura son dos vídeos seguidos y, al acabar, la hoja se queda fija y
   aparecen las letras encima. Los dos vídeos van en dos elementos distintos:
   el segundo se precarga mientras corre el primero, así el corte entre ellos
   no parpadea (el último fotograma de uno es el primero del otro). */
const VIDEOS = ['assets/apertura-1.mp4', 'assets/apertura-2.mp4'];

/* El texto va centrado sobre LA HOJA, no sobre la pantalla. La hoja cambia
   de tamaño y de sitio según la proporción del móvil, así que un porcentaje
   fijo la dejaba alta en unos y baja en otros. Se mide y se coloca. */
function encajarPortada() {
  const img = $('.hoja-posada img'), carta = $('#carta'), lienzo = $('.lienzo');
  if (!img || !carta || !lienzo) return;
  /* offsetWidth, NO getBoundingClientRect: hasta que la hoja se posa está
     ampliada al 126 % para la animación de entrada, y el rect devuelve esa
     medida. Midiéndola así, la caja del texto salía un 26 % más grande de lo
     que iba a ser, y el nombre se desbordaba de la hoja. */
  const aw = img.offsetWidth, ah = img.offsetHeight;
  if (!aw || !ah) return;
  const cs = getComputedStyle(img);
  const pl = parseFloat(cs.paddingLeft)  || 0, pr = parseFloat(cs.paddingRight)  || 0;
  const pt = parseFloat(cs.paddingTop)   || 0, pb = parseFloat(cs.paddingBottom) || 0;
  const bw = aw - pl - pr, bh = ah - pt - pb;
  if (bw <= 0 || bh <= 0) return;
  const e  = Math.min(bw / 909, bh / 1243);      // la hoja, en su tamaño real
  const hw = 909 * e, hh = 1243 * e;
  const hx = pl + (bw - hw) / 2, hy = pt + (bh - hh) / 2;
  carta.style.left  = (hx + hw * 0.11).toFixed(1) + 'px';
  carta.style.width = (hw * 0.78).toFixed(1) + 'px';
  carta.style.top   = (hy + hh * 0.33).toFixed(1) + 'px';
  /* y el cuerpo de las letras se mide con la HOJA, no con la ventana: la
     columna está limitada a 480 px, así que en una pantalla ancha el texto
     crecía con la ventana mientras su caja se quedaba igual */
  carta.style.setProperty('--hoja-w', hw.toFixed(1) + 'px');
  if (typeof ajustaCarta === 'function') ajustaCarta();
}

function mostrarTodo() {                       // estado final, sin transiciones
  $('#capa-poster').style.opacity = '0';
  $('#capa-final').style.opacity  = '1';
  /* al volver con el sobre ya abierto no se repite el asentamiento: la hoja
     aparece puesta, sin animar */
  const _h = $('.hoja-posada img'); if (_h) _h.style.transition = 'none';
  cuerpo.classList.add('abierto', 'carta-visible', 'hoja-posada-lista');
  cuerpo.classList.remove('sin-abrir');
}

/* La hoja se queda y, un respiro después, llegan las letras. */
function posarse() {
  $('#capa-final').style.opacity = '1';
  requestAnimationFrame(() => {
    $('#video-1').style.opacity = '0';
    $('#video-2').style.opacity = '0';
  });
  cuerpo.classList.add('abierto');
  cuerpo.classList.remove('sin-abrir');
  /* un respiro, la hoja se asienta, y solo entonces las letras */
  setTimeout(() => cuerpo.classList.add('hoja-posada-lista'), 260);
  setTimeout(encajarPortada, 1800);          // ya posada, con su tamaño real
  setTimeout(() => cuerpo.classList.add('carta-visible'), 2060);
}

function abrir() {
  if (abierto) return;
  abierto = true;
  try { sessionStorage.setItem('invitacion-abierta', '1'); } catch (e) {}
  escenario.setAttribute('aria-expanded', 'true');
  escenario.disabled = true;
  $('#carta').removeAttribute('aria-hidden');

  if (QUIETO || MODO !== 'video') { mostrarTodo(); arrancarMusica(); return; }

  reproducirCadena();
  arrancarMusica();
}

function reproducirCadena() {
  const v1 = $('#video-1'), v2 = $('#video-2');

  /* Si el navegador no deja reproducir, no se queda nadie mirando un sobre
     parado: se va directo a la hoja con las letras. */
  const rendirse = () => { if (!cuerpo.classList.contains('abierto')) posarse(); };

  /* El sobre cerrado NO se quita al tocar, sino cuando el vídeo está
     corriendo de verdad. Quitándolo antes, en 3G tocabas y te quedabas
     mirando un hueco mientras el vídeo todavía llegaba. */
  const descubrir = () => { $('#capa-poster').style.opacity = '0'; };
  v1.addEventListener('playing', () => {
    v1.style.opacity = '1';
    cuerpo.classList.add('reproduciendo');     // adiós a «Toca para abrir»
    requestAnimationFrame(descubrir);
  }, { once: true });

  /* Y si tarda, se avisa en voz baja en vez de dejar la pantalla muda. */
  const aviso = setTimeout(() => {
    const e = $('.llamada-texto');
    if (e && v1.paused) { e.textContent = 'Un momento…'; }
  }, 600);
  v1.addEventListener('playing', () => clearTimeout(aviso), { once: true });

  /* Red muy mala: a los 8 s se deja de esperar y se va a la hoja. */
  const plazo = setTimeout(() => { if (v1.paused) rendirse(); }, 8000);
  v1.addEventListener('playing', () => clearTimeout(plazo), { once: true });

  const lanzarSegundo = () => {
    v2.style.opacity = '1';
    v2.play().catch(rendirse);
    requestAnimationFrame(() => { v1.style.opacity = '0'; });
  };

  v1.addEventListener('ended', () => {
    if (v2.readyState >= 2) { lanzarSegundo(); return; }
    /* Con red lenta el segundo puede no estar listo justo en ese instante. Se
       le dan 1,2 s —el primer fotograma del segundo es idéntico al último del
       primero, así que la espera se ve como una pausa, no como un cuelgue— y
       si no llega, se va directo a la hoja. */
    let resuelto = false;
    const seguir = () => { if (resuelto) return; resuelto = true; lanzarSegundo(); };
    v2.addEventListener('canplay', seguir, { once: true });
    setTimeout(() => {
      if (resuelto) return;
      resuelto = true;
      v2.removeEventListener('canplay', seguir);
      posarse();                     // no llegó: se salta sin ruido
    }, 1200);
  }, { once: true });

  v2.addEventListener('ended', posarse, { once: true });

  v1.play().catch(rendirse);
}

encajarPortada();
addEventListener('resize', encajarPortada, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(encajarPortada);

escenario.addEventListener('click', abrir);
escenario.setAttribute('aria-expanded', 'false');

$('.salta a').addEventListener('click', () => {
  if (!abierto) { abierto = true; mostrarTodo(); }
});

let yaAbierto = false;
try { yaAbierto = sessionStorage.getItem('invitacion-abierta') === '1'; } catch (e) {}
if (yaAbierto || QUIETO) { abierto = true; escenario.disabled = true; mostrarTodo(); }

/* El segundo vídeo no se pide al cargar la página: se pide en cuanto el primero
   está listo, para no competir por el ancho de banda con lo que se ve ya. */
if (MODO === 'video' && !yaAbierto && !QUIETO) {
  const v1 = $('#video-1'), v2 = $('#video-2');
  const pedirSegundo = () => {
    if (v2.src) return;
    v2.src = VIDEOS[1]; v2.preload = 'auto'; v2.load();
  };
  if (v1.readyState >= 2) pedirSegundo();
  else v1.addEventListener('loadeddata', pedirSegundo, { once: true });
  setTimeout(pedirSegundo, 2500);          // red lenta: no esperamos para siempre
}

/* ══════════════ 2 · CONTENIDO DESDE datos.js ══════════════ */

if (PREVIA && $('#aviso-previa')) $('#aviso-previa').hidden = false;

const f = D.festejada || {};
const pon = (sel, txt) => { const e = $(sel); if (e && txt) e.textContent = txt; };
pon('#nombre-grande',   f.nombre);
if (f.nombre) document.title = `${D.celebracion || 'Mis XV años'} · ${f.nombre}`;
pon('.rubrica-firma',   f.corto);

/* ── la tarjeta del sobre ──
   Con un mensaje de portada, la tarjeta no lleva ni nombre ni datos: solo
   insinúa y empuja a bajar. El nombre llega al desvelarse la fotografía.
   Sin mensaje, vuelve a la tarjeta clásica: celebración, nombre y fecha. */
const P = D.portada || {};
const reng = (sel, txt) => {
  const e = $(sel); if (!e) return;
  if (txt) { e.textContent = txt; e.hidden = false; }
  else     { e.textContent = '';  e.hidden = true;  }
};
if (P.frase) {
  reng('.carta-cintillo',  P.epigrafe);
  reng('.carta-nombre',    P.frase);
  reng('.carta-apellidos', P.apoyo);
  reng('#carta-fecha',     P.pie);
} else {
  reng('.carta-cintillo',  D.celebracion);
  reng('.carta-nombre',    f.nombre);
  reng('.carta-apellidos', f.apellidos);
}

const M = D.mensajes || {};
pon('#msj-presentacion', M.presentacion);
pon('#msj-puente',       M.puente);

/* el tercer momento: lo que acompaña al nombre sobre la fotografía */
const R = D.revelacion || {};
for (const [sel, txt] of [['.inv-ep', R.antes],
                          ['.inv-pie-a', R.despues],
                          ['.inv-xv', R.destacado]]) {
  const e = $(sel); if (!e) continue;
  if (txt) { e.textContent = txt; e.hidden = false; }
  else     { e.hidden = true; }
}
if (!R.despues && !R.destacado) $('.inv-pie').hidden = true;
pon('#msj-cierre',       M.cierre);

let rFecha = { v: null, ejemplo: false };

seguro('fecha', () => {
  /* ── fecha ── */
  function instanteEn(iso, zona) {
    const prov = new Date(iso + 'Z');
    if (isNaN(prov)) return null;
    try {
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: zona, hour12: false, year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      const p = {};
      for (const x of fmt.formatToParts(prov)) if (x.type !== 'literal') p[x.type] = +x.value;
      const comoZona = Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second);
      return new Date(prov.getTime() - (comoZona - prov.getTime()));
    } catch (e) { return new Date(iso); }
  }

  const fe = D.fecha || {};
  rFecha = dato(fe.iso, fe.ejemplo);
  const cajaFecha = $('#fecha-grande');

  if (rFecha.v) {
    const d = new Date(rFecha.v.replace(' ', 'T'));
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const dia  = new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(d);
    const mes  = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(d);
    cajaFecha.innerHTML =
      `<span class="fecha-mes">${cap(dia)}</span>` +
      `<span class="fecha-dia">${d.getDate()}</span>` +
      `<span class="fecha-mes">${cap(mes)} · ${d.getFullYear()}</span>`;
    /* El pie del sobre no lleva fecha si hay un mensaje de portada: la idea es
       que la tarjeta prometa y que el cuándo llegue abajo, con la cuenta
       regresiva. Sin mensaje, cae de vuelta al mes y el año. */
    if (!P.frase) {
      $('#carta-fecha').textContent = `${cap(mes)} de ${d.getFullYear()}`;
    }
    if (rFecha.ejemplo) cajaFecha.append(chip('Fecha de ejemplo · pendiente de confirmar'));

    const meta = instanteEn(rFecha.v, fe.zona || undefined);
    if (meta && meta > new Date()) {
      const caja = $('#cuenta'); caja.hidden = false;
      const pad = n => String(Math.max(0, n)).padStart(2, '0');
      const tic = () => {
        let s = Math.floor((meta - Date.now()) / 1000);
        if (s < 0) { caja.hidden = true; return; }
        $('#cr-d').textContent = pad(Math.floor(s / 86400));
        $('#cr-h').textContent = pad(Math.floor(s / 3600) % 24);
        $('#cr-m').textContent = pad(Math.floor(s / 60) % 60);
        $('#cr-s').textContent = pad(s % 60);
      };
      tic(); setInterval(tic, 1000);
    }
  } else {
    cajaFecha.innerHTML = '<span class="fecha-pendiente">Fecha por confirmar</span>';
  }
});

seguro('pie de la firma', () => {
  /* pie de la rúbrica: la fecha y el lugar, en seco */
  {
    const pie = $('#rubrica-pie');
    const lineas = [];
    if (rFecha.v && !rFecha.ejemplo) {
      const d = new Date(rFecha.v.replace(' ', 'T'));
      lineas.push(`${String(d.getDate()).padStart(2,'0')} · ` +
                  `${String(d.getMonth()+1).padStart(2,'0')} · ${d.getFullYear()}`);
    }
    if (D.ciudad) lineas.push(D.ciudad);
    pie.innerHTML = lineas.map(t => `<span>${t}</span>`).join('<br>');
  }
});

seguro('sedes', () => {
  /* ── sedes ── */
  const rSedes = dato(D.sedes, D.sedesEjemplo);
  const cajaSedes = $('#sedes');
  if (rSedes.v) {
    for (const s of rSedes.v) {
      const art = document.createElement('article');
      art.className = 'sede revela';
      art.innerHTML =
        `<p class="sede-tipo">${s.tipo}</p>` +
        `<h3 class="sede-nombre">${s.nombre}</h3>` +
        (s.hora ? `<p class="sede-hora">${s.hora}</p>` : '') +
        (s.direccion ? `<p class="sede-dir">${s.direccion}</p>` : '');
      const destino = s.mapa ||
        (s.direccion && !rSedes.ejemplo
          ? 'https://www.google.com/maps/search/?api=1&query=' +
            encodeURIComponent(`${s.nombre} ${s.direccion}`)
          : null);
      if (destino) {
        const a = document.createElement('a');
        a.className = 'boton'; a.href = destino;
        a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'Cómo llegar';
        art.append(a);
      } else if (PREVIA) {
        /* Sin dirección no hay botón: uno que no lleva a ninguna parte es
           peor que ninguno. En vista previa queda el aviso punteado para
           acordarse de que falta el dato; al invitado no le llega nada. */
        const b = document.createElement('p');
        b.className = 'pendiente';
        b.textContent = 'Pendiente: dirección';
        art.append(b);
      }
      cajaSedes.append(art);
    }
    if (rSedes.ejemplo) cajaSedes.append(chip('Sedes de ejemplo · faltan los lugares reales'));
  } else {
    cajaSedes.append(chip('Lugar y horarios por confirmar'));
  }
});

seguro('itinerario', () => {
  /* ── itinerario ── */
  const rItin = dato(D.itinerario, D.itinerarioEjemplo);
  const lista = $('#momentos');
  if (rItin.v) {
    for (const m of rItin.v) {
      const li = document.createElement('li');
      li.className = 'momento';
      li.innerHTML =
        (m.icono
           ? `<span class="icono">` +
             `<img class="icono-agua"  src="assets/icono-${m.icono}.webp" alt="" loading="lazy">` +
             `<img class="icono-color" src="assets/icono-${m.icono}.webp" alt="" loading="lazy">` +
             `</span>`
           : '') +
        `<div><p class="momento-hora">${m.hora}</p><p class="momento-titulo">${m.titulo}</p></div>`;
      lista.append(li);
    }
    if (rItin.ejemplo) $('#linea-tiempo').after(chip('Itinerario de ejemplo · faltan los momentos reales'));
  } else {
    $('#linea-tiempo').replaceWith(chip('Itinerario por confirmar'));
  }
});

seguro('vestimenta', () => {
  /* ── vestimenta ── */
  const rVest = dato(D.vestimenta, D.vestimentaEjemplo);
  const sec = $('#vestir');
  if (rVest.v) {
    if (sec) sec.hidden = false;
    const v = $('#vestimenta'); v.hidden = false;
    v.innerHTML =
      `<p class="vestimenta-eti">Código de vestimenta</p>` +
      `<p class="vestimenta-cod">${rVest.v.codigo}</p>` +
      (rVest.v.nota ? `<p class="vestimenta-nota">${rVest.v.nota}</p>` : '');
    if (rVest.ejemplo) v.append(chip('Vestimenta de ejemplo'));
  }
});

seguro('fotografías', () => {
  /* ── fotografías ── */
  const fotos = D.fotos || {};
  if (fotos.portada) {
    const img = $('#foto-portada');
    img.src = fotos.portada; img.hidden = false;
    $('#retrato-vacio').remove();
  }
});

seguro('confirmación', () => {
  /* ── confirmación ── */
  const C = D.confirmacion || {};
  const caja = $('#accion');

  if (C.tipo === 'whatsapp' && C.whatsapp) {
    const txt = encodeURIComponent(
      `¡Hola! Confirmo mi asistencia a los XV años de ${f.nombre || 'la festejada'}. Mi nombre es: `);
    caja.innerHTML =
      `<a class="boton boton-principal" href="https://wa.me/${C.whatsapp}?text=${txt}" ` +
      `target="_blank" rel="noopener">Confirmar asistencia</a>` +
      (C.fechaLimite ? `<p class="accion-nota">Confirma antes del ${C.fechaLimite}</p>` : '');

  } else if (C.tipo === 'formulario' && C.formulario) {
    caja.innerHTML =
      `<form class="form-rsvp" id="form-rsvp">
         <label><span>Nombre completo</span><input name="nombre" required autocomplete="name"></label>
         <label><span>¿Nos acompañas?</span>
           <select name="asistencia" required>
             <option value="">Elige una opción</option>
             <option value="si">Sí, ahí estaré</option>
             <option value="no">No podré asistir</option>
           </select></label>
         <label><span>Mensaje (opcional)</span><textarea name="mensaje" rows="3"></textarea></label>
         <button class="boton boton-principal" type="submit">Enviar confirmación</button>
         <p class="accion-nota" id="rsvp-estado" role="status"></p>
       </form>`;
    $('#form-rsvp').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const form = ev.currentTarget, estado = $('#rsvp-estado');
      const btn = $('button', form);
      btn.disabled = true; estado.textContent = 'Enviando…';
      try {
        const r = await fetch(C.formulario, {
          method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        estado.textContent = '¡Gracias! Tu confirmación quedó registrada.';
        form.querySelectorAll('input,select,textarea').forEach(e => e.disabled = true);
      } catch (err) {
        btn.disabled = false;
        estado.textContent = 'No se pudo enviar (' + err.message + '). Inténtalo de nuevo.';
      }
    });

  } else {
    caja.innerHTML = `<span class="boton boton-principal" aria-disabled="true">Confirmar asistencia</span>`;
    caja.append(chip('Falta elegir el destino de la confirmación'));
  }
});

/* ── el nombre siempre cabe dentro del marco real de la tarjeta ── */
function ajustaCarta() {
  const caja = $('#carta');
  if (!caja || !caja.clientWidth) return;
  for (const el of $$('.carta-nombre, .carta-apellidos, .carta-cintillo', caja)) {
    el.style.fontSize = '';
    const disp = caja.clientWidth;
    const ancho = el.scrollWidth;
    if (ancho > disp) {
      const base = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = (base * (disp / ancho) * 0.985).toFixed(2) + 'px';
    }
  }
}
ajustaCarta();
addEventListener('resize', ajustaCarta, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustaCarta);

/* ══════════════ 3 · MÚSICA ══════════════ */

let audio = null;
const btnAudio = $('#audio');

if (D.musica && D.musica.archivo && !QUIETO) {
  audio = new Audio(D.musica.archivo);
  audio.loop = true; audio.preload = 'none'; audio.volume = 0;
  audio.addEventListener('canplay', () => { btnAudio.hidden = false; }, { once: true });
  audio.addEventListener('error', () => { btnAudio.hidden = true; audio = null; });
  audio.load();
}

function fundir(hasta, ms = 900) {
  if (!audio) return;
  const ini = audio.volume, t0 = performance.now();
  const paso = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    audio.volume = ini + (hasta - ini) * k;
    if (k < 1) requestAnimationFrame(paso);
    else if (hasta === 0) audio.pause();
  };
  requestAnimationFrame(paso);
}

function arrancarMusica() {
  if (!audio) return;
  audio.play().then(() => {
    btnAudio.hidden = false;
    btnAudio.setAttribute('aria-pressed', 'true');
    btnAudio.setAttribute('aria-label', 'Silenciar la música');
    fundir(0.55);
  }).catch(() => { btnAudio.hidden = false; });
}

btnAudio.addEventListener('click', () => {
  if (!audio) return;
  const son = btnAudio.getAttribute('aria-pressed') === 'true';
  if (son) { fundir(0, 500); btnAudio.setAttribute('aria-pressed', 'false');
             btnAudio.setAttribute('aria-label', 'Activar la música'); }
  else { audio.play().then(() => fundir(0.55)); btnAudio.setAttribute('aria-pressed', 'true');
         btnAudio.setAttribute('aria-label', 'Silenciar la música'); }
});

/* ══════════════ 4 · REVELADOS ══════════════ */

const todoVisible = () => $$('.revela').forEach(el => el.classList.add('visible'));

seguro('revelados', () => {
  if (QUIETO || !('IntersectionObserver' in window)) return;   // ya se ve todo

  /* a partir de aquí sí hay animación: se esconde lo que el observer irá
     mostrando. Si este bloque no llegara a correr, todo queda visible. */
  cuerpo.classList.add('anima');

  const ojo = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) { e.target.classList.add('visible'); ojo.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
  $$('.revela').forEach(el => ojo.observe(el));

  /* Red de seguridad: si el observer no llegara a disparar nunca, a los 4 s se
     muestra todo. Vale más verlo sin animación que no verlo. */
  setTimeout(() => {
    const total = $$('.revela').length;
    const vistos = $$('.revela.visible').length;
    if (total && vistos === 0) todoVisible();
  }, 4000);
});

/* ══════════════ 5 · UN SOLO BUCLE DE SCROLL ══════════════ */

const flores  = $$('.flor[data-parallax]');
const retrato = $('.retrato-marco');
const secFestejada = $('#festejada');
const invitacion = $('#invitacion');
const riel    = $('#linea-riel') || $('.linea-riel');
const avance  = $('#linea-avance');
const puntos  = () => $$('.momento');
const petalo  = $('#petalo');
const secItin = $('#itinerario');
const cierre  = $('.flor-cierre-b');
/* Al subir con el dedo, el móvil vuelve a sacar su barra de direcciones y
   innerHeight cambia de golpe unos 60 px. Todas las cuentas del scroll se
   recalculaban con la altura nueva y la página daba un brinco, como si
   saltara de sección. El maquetado ya usa svh, que no se inmuta; esto hace
   que el JavaScript tampoco. Solo se actualiza en un cambio de verdad:
   girar el móvil, o una ventana que cambia mucho de alto. */
let altoEstable = innerHeight;
let anchoPrevio = innerWidth;
addEventListener('resize', () => {
  const giro   = innerWidth !== anchoPrevio;
  const cambio = Math.abs(innerHeight - altoEstable) > altoEstable * 0.25;
  if (giro || cambio) {
    anchoPrevio = innerWidth;
    altoEstable = innerHeight;
  }
}, { passive: true });

const suave   = (x) => x * x * (3 - 2 * x);

/* Centro y anchura de la flor del cierre, medidos sobre el propio dibujo
   (lienzo 470x206): ahí es donde tiene que posarse la rosa que cae. */
const FLOR_CX = 0.4915, FLOR_CY = 0.5437, FLOR_ANCHO = 0.4149;
const GIRO_CIERRE = cierre
  ? (parseFloat(getComputedStyle(cierre).getPropertyValue('--giro')) || 0) : 0;

/* Franja libre a la derecha del itinerario. Se mide del contenido de verdad
   —las cajas de los glifos y los iconos—, no de fracciones a ojo, porque en
   pantallas estrechas el texto ocupa casi todo y el hueco cambia. */
let banda = null, bandaSucia = true;
addEventListener('resize', () => { bandaSucia = true; }, { passive: true });

function medirBanda() {
  bandaSucia = false;
  banda = null;
  if (!secItin || !petalo) return;
  let der = 0;
  for (const el of secItin.querySelectorAll('.momento *')) {
    if (el.children.length) continue;
    const t = document.createRange();
    t.selectNodeContents(el);
    for (const q of t.getClientRects()) if (q.width > 0) der = Math.max(der, q.right);
  }
  for (const el of secItin.querySelectorAll('.icono')) {
    der = Math.max(der, el.getBoundingClientRect().right);
  }
  if (!der) return;
  const ancho = Math.min(innerWidth, 480);
  let radio = petalo.offsetWidth * 0.57;     // radio real de la acuarela, no de la caja
  const libre = ancho / 2 + innerWidth / 2 - der - 12;

  /* En pantallas estrechas el hueco no da para mecerse. Antes que dejar la rosa
     tiesa, se aleja un poco: encoge lo justo para tener sitio donde moverse. */
  let esc = 1;
  if (libre - 2 * radio < 20) {
    esc = Math.max(0.8, (libre - 20) / (2 * radio));
    radio *= esc;
  }

  const min = der + radio + 6 - innerWidth / 2;
  const max = ancho / 2 - radio - 6;
  banda = max > min
    ? { centro: (min + max) / 2, amplitud: (max - min) / 2, esc: esc }
    : { centro: max, amplitud: 0, esc: esc };
}
const caras   = ['#rosa-frente', '#rosa-tres', '#rosa-perfil'].map(s => $(s));
let pedido = false;

function pintar() {
  pedido = false;
  const vh = altoEstable;
  flotarPetalo(vh);

  for (const el of flores) {
    const r = el.getBoundingClientRect();
    const centro = r.top + r.height / 2;
    const k = (vh / 2 - centro) * parseFloat(el.dataset.parallax);
    el.style.setProperty('--py', Math.max(-18, Math.min(18, k)).toFixed(1) + 'px');
  }

  if (retrato && secFestejada) {
    /* El avance ya NO se mide por dónde está la fotografía —ahora está
       clavada en pantalla y no se mueve—, sino por cuánto se ha recorrido la
       sección. Eso es lo que compra recorrido: 2,6 pantallas en vez de media.

         p 0,00 → 0,12   el rosal cerrado, a pantalla completa
         p 0,12 → 0,56   se abren las rosas  (≈ 570 px de scroll, 2,5× lo de antes)
         p 0,56 → 0,68   descanso: las letras entran en blanco sobre el vestido
         p 0,68 → 0,96   bajan y se vuelven tinta bajo la fotografía            */
    const rs = secFestejada.getBoundingClientRect();
    const recorrido = Math.max(1, secFestejada.offsetHeight - vh);
    const p = Math.max(0, Math.min(1, -rs.top / recorrido));

    const suave = (x) => x * x * (3 - 2 * x);
    const t = Math.max(0, Math.min(1, (p - 0.12) / 0.44));
    /* dentro del desvelado, la guirnalda de arriba va por delante de las dos
       laterales, que la siguen con retraso */
    const arriba = suave(Math.max(0, Math.min(1, t / 0.70)));
    const lados  = suave(Math.max(0, Math.min(1, (t - 0.14) / 0.86)));
    retrato.style.setProperty('--abre-arriba', arriba.toFixed(3));
    retrato.style.setProperty('--abre', lados.toFixed(3));
    retrato.style.setProperty('--zoom', (1.06 - 0.06 * suave(t)).toFixed(3));

    /* Las letras: 1 mientras van en blanco sobre el vestido, 0 ya posadas
       bajo la fotografía. Entre el final del desvelado y el principio de la
       bajada hay una espera, para que dé tiempo a leerlas encima de ella. */
    if (invitacion) {
      const r = retrato.getBoundingClientRect();
      const v = 1 - suave(Math.max(0, Math.min(1, (p - 0.68) / 0.28)));
      invitacion.style.setProperty('--viaje', v.toFixed(3));
      invitacion.style.setProperty('--baja-inv', Math.round(r.height * 0.45 + 24));
    }

    /* Cuando las rosas acaban de abrirse, llega la invitación. Con histéresis
       para que no parpadee si el scroll se queda justo en el borde. Son
       transiciones de CSS: una vez disparadas se completan aunque el dedo se
       pare, así que este momento no se puede perder a medias. */
    if (lados > 0.90) secFestejada.classList.add('descubierta');
    else if (lados < 0.45) secFestejada.classList.remove('descubierta');
  }

  if (riel && avance) {
    const r = riel.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (vh * 0.60 - r.top) / Math.max(1, r.height)));
    avance.style.setProperty('--avance', p.toFixed(3));
    const frente = r.top + r.height * p;
    for (const m of puntos()) {
      const mr = m.getBoundingClientRect();
      const centro = mr.top + mr.height / 2;
      /* 0 justo antes de que la línea llegue al icono, 1 cuando lo ha rebasado */
      const q = Math.max(0, Math.min(1, (frente - centro + 38) / 60));
      m.style.setProperty('--pintado', q.toFixed(3));
      m.classList.toggle('alcanzado', q > 0.55);
    }
  }
}

/* La rosa se desprende de la tarjeta y baja meciéndose por toda la invitación:
   desciende en pantalla mientras la página pasa por detrás. */
function flotarPetalo(vh) {
  if (!petalo || !retrato) return;

  /* La rosa se desprende de los rosales JUSTO cuando terminan de abrirse y la
     fotografía queda descubierta. Antes de ese punto no existe. */
  const topeDoc  = document.documentElement.scrollHeight - vh;
  const retratoY = retrato.getBoundingClientRect().top + scrollY;
  const arranque = retratoY + vh * 0.12;          // ahí acaba el desvelado
  if (topeDoc <= arranque) { petalo.style.opacity = '0'; return; }

  const g = Math.min(1, Math.max(0, (scrollY - arranque) / (topeDoc - arranque)));
  const ancho = Math.min(innerWidth, 480);

  let   y    = vh * (0.12 + g * 0.66);
  let   x    = Math.sin(g * Math.PI * 2.4 + 0.6) * ancho * 0.34;
  let   escBanda = 1;

  /* En el itinerario los iconos van a la izquierda y el texto en medio: la rosa
     se desvía a la franja libre de la derecha para no taparlos. Ahí no se queda
     quieta: sigue meciéndose, pero con el vaivén encogido dentro de esa franja,
     y algo más vivo para que se note la curva en un tramo corto. */
  if (secItin) {
    const ri = secItin.getBoundingClientRect();
    const dentro = Math.max(0, Math.min(vh, ri.bottom) - Math.max(0, ri.top)) / vh;
    const k = Math.min(1, dentro * 1.8);
    if (bandaSucia) medirBanda();
    if (banda) {
      const xBanda = banda.centro + Math.sin(g * Math.PI * 7.2 + 0.6) * banda.amplitud;
      x = x * (1 - k) + xBanda * k;
      escBanda = 1 - (1 - banda.esc) * k;
    }
  }
  let giro = Math.sin(g * Math.PI * 3.0) * 28 + g * 58;
  let esc  = (0.88 + Math.sin(g * Math.PI * 2) * 0.12) * escBanda;
  let op   = Math.min(1, Math.max(0, g / 0.07));        // se desprende
  let sombra = 1, posada = 0;

  /* El viaje termina posándose en la flor del cierre: la rosa persigue el
     hueco que esa flor tiene en medio, igualando sitio, tamaño e inclinación. */
  if (cierre) {
    const rc = cierre.getBoundingClientRect();
    const anchoC = cierre.offsetWidth, altoC = cierre.offsetHeight;
    const a  = GIRO_CIERRE * Math.PI / 180;
    const dx = (FLOR_CX - 0.5) * anchoC, dy = (FLOR_CY - 0.5) * altoC;
    const destX = rc.left + rc.width  / 2 + dx * Math.cos(a) - dy * Math.sin(a);
    const destY = rc.top  + rc.height / 2 + dx * Math.sin(a) + dy * Math.cos(a);

    /* Se mide en scroll que queda, no en una altura fija: así el aterrizaje
       cabe entero por corta que sea la cola de la página, y nunca persigue
       un punto que todavía está debajo del pliegue. */
    const resto   = Math.max(0, topeDoc - scrollY);
    const alcance = vh - destY + resto;            // scroll al asomar por abajo
    const r0 = Math.min(vh * 0.26, Math.max(40, alcance - 8));
    const r1 = Math.min(vh * 0.055, r0 * 0.3);
    const t  = suave(Math.max(0, Math.min(1, (r0 - resto) / Math.max(1, r0 - r1))));

    if (t > 0) {
      const px = destX - innerWidth / 2;
      const py = destY - petalo.offsetHeight / 2;
      const pe = (anchoC * FLOR_ANCHO) / (petalo.offsetWidth * 0.979);
      x     += (px - x) * t;
      y     += (py - y) * t;
      esc   += (pe - esc) * t;
      giro   = giro * (1 - t) + GIRO_CIERRE * t;
      sombra = 1 - t;
      posada = t;
    }

    /* Ya posada, el relevo y el despliegue los hace el CSS, que sigue
       corriendo aunque el scroll se detenga. Con histéresis para que no
       parpadee al quedarse justo en el borde. */
    if (t > 0.96 || resto <= 6) cierre.classList.add('posada');
    else if (t < 0.55) cierre.classList.remove('posada');
  }

  const relevo = cierre && cierre.classList.contains('posada');

  petalo.style.setProperty('--px', x.toFixed(1));
  petalo.style.setProperty('--py', y.toFixed(1));
  petalo.style.setProperty('--giro', giro.toFixed(1));
  petalo.style.setProperty('--esc', esc.toFixed(3));
  petalo.style.setProperty('--sombra-rosa', sombra.toFixed(3));
  petalo.style.opacity = relevo ? '0' : (op * (1 - 0.1 * posada)).toFixed(3);

  /* vuelta y media en todo el viaje: frente → tres cuartos → perfil → frente,
     y al posarse se queda de frente, como la flor del cierre */
  const fase = (g * 1.5) % 1;
  for (let i = 0; i < caras.length; i++) {
    if (!caras[i]) continue;
    let d = Math.abs(fase - i / 3);
    d = Math.min(d, 1 - d);
    const v = Math.max(0, 1 - d * 3) * (1 - posada) + (i === 0 ? posada : 0);
    caras[i].style.opacity = v.toFixed(3);
  }
}

function alScroll() {
  if (!pedido) { pedido = true; requestAnimationFrame(pintar); }
}

seguro('efectos de scroll', () => {
  if (QUIETO) return;
  if (cierre) cierre.classList.add('monta');   // parte de la rosa sola
  if (secFestejada) secFestejada.classList.add('monta'); // la invitación llega después
  addEventListener('scroll', alScroll, { passive: true });
  addEventListener('resize', alScroll, { passive: true });
  pintar();
});

})();
