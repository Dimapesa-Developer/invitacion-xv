# Invitación web de XV años

Invitación digital pensada para abrirse en el móvil, con una apertura en vídeo
y un recorrido que se va descubriendo al deslizar.

**Ver la demostración → <https://dimapesa-developer.github.io/invitacion-xv/>**

> Todos los datos son inventados. El nombre, la fecha, los lugares y el
> teléfono no corresponden a ninguna persona ni a ningún sitio real.

---

## Cómo está hecha

HTML, CSS y JavaScript, sin framework ni dependencias. Se sirve como archivos
estáticos.

- **La apertura son dos vídeos encadenados.** Van en dos elementos `<video>`
  distintos para que el segundo esté descargado y pintado cuando acaba el
  primero y el corte no parpadee. Al terminar, la hoja de papel se queda fija
  y aparecen las letras encima.
- **El recorrido se cuenta en tres momentos:** una frase que no dice a qué se
  invita, un puente que señala a una persona, y la revelación con la
  fotografía. Cada uno ocupa su propio espacio de scroll.
- **El desvelado de la fotografía está clavado en pantalla** mientras dura, lo
  que le da recorrido de scroll sin dejar papel vacío: quien pasa deprisa lo ve
  entero igual.
- **Las acuarelas son piezas sueltas** que se mueven a distinta velocidad que el
  papel, para que las secciones no se lean como una pila de bloques.

## Decisiones que conviene saber

- **Los vídeos van a 810 px y CRF 32 con `-tune grain`.** Ese ajuste es el que
  importa: sin él, a partir de CRF 32 desaparece la textura del papel, que es
  lo que da el aire de hecho a mano. El peso total de la página es de 1 MB.
- **El texto de la portada se mide con la hoja, no con la ventana.** La columna
  está limitada a 480 px, así que atarlo a `vw` hacía que la letra creciera en
  pantallas anchas mientras su caja se quedaba igual.
- **El JavaScript congela la altura de la ventana.** Al subir con el dedo, el
  móvil vuelve a sacar su barra de direcciones y `innerHeight` cambia de golpe;
  recalcular el scroll con la altura nueva hacía que la página pegara un brinco.
- **Si algo del JavaScript falla, el contenido se sigue leyendo.** El CSS
  muestra todo por defecto y las animaciones solo lo ocultan para revelarlo.
- **Escala tipográfica de cuatro escalones** para todo lo pequeño, y ninguno
  baja de 11,5 px.

## Montar una invitación

Todo lo editable está en [`datos.js`](datos.js): nombre, fecha, sedes,
itinerario, vestimenta, mensajes, confirmación y música. Lo que esté en `null`
oculta su sección sola.

Con `vistaPrevia: true` se ven contenidos de ejemplo marcados como tales, para
revisar el diseño antes de tener los datos definitivos.

Para verla en local:

```bash
python3 servidor.py
```

## Accesibilidad

- El sobre es un `<button>` real: funciona con teclado y tiene foco visible.
- Con `prefers-reduced-motion` la invitación aparece entera, sin animaciones.
- El estado de «ya abierto» se guarda en la sesión: bajar y volver no repite
  la apertura.
