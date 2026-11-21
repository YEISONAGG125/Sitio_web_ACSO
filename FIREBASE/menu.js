/* =====================================================
   ACSO · MENÚ COMPARTIDO (comportamiento)

   Se carga con <script src="../FIREBASE/menu.js"></script> en el <head>
   (script normal, no módulo) para fijar el estado inicial antes de que
   se pinte la página y evitar que el menú "parpadee" abierto en móvil.

   Necesita en el HTML:
     #btnMenu      botón hamburguesa
     #sidebar      barra lateral
     #menuOverlay  fondo oscuro (solo se ve en móvil)

   Escritorio: el botón contrae/expande la barra y recuerda la elección.
   Móvil (<= 900px): la barra se abre encima del contenido.
===================================================== */

(function () {
    "use strict";

    var PUNTO_MOVIL = 900;
    var CLAVE = "acso_menu_cerrado";
    var CLASE = "menu-cerrado";

    var raiz = document.documentElement;
    var consulta = window.matchMedia("(max-width: " + PUNTO_MOVIL + "px)");

    function leerGuardado() {
        try { return localStorage.getItem(CLAVE) === "1"; } catch (e) { return false; }
    }

    function guardar(cerrado) {
        try { localStorage.setItem(CLAVE, cerrado ? "1" : "0"); } catch (e) { /* sin almacenamiento */ }
    }

    function estaCerrado() {
        return raiz.classList.contains(CLASE);
    }

    function esMovil() {
        return consulta.matches;
    }

    // Estado inicial, antes del primer pintado
    raiz.classList.toggle(CLASE, esMovil() || leerGuardado());

    // Preferencias de accesibilidad de la persona (tamaño de texto y contraste).
    // Se aplican aquí, en el <head>, para que la página no «salte» al cargar.
    // El botón que las cambia está en panel.js.
    try {
        var texto = localStorage.getItem("acso_texto");
        if (texto === "grande" || texto === "mayor") raiz.setAttribute("data-acso-texto", texto);
        if (localStorage.getItem("acso_contraste") === "alto") raiz.setAttribute("data-acso-contraste", "alto");
    } catch (e) { /* sin almacenamiento */ }

    var boton = null;

    // En móvil, con el menú abierto, el resto de la página no se puede usar
    // (ni con el teclado ni con lectores de pantalla) hasta que se cierre.
    function bloquearContenido() {
        var principal = document.querySelector(".acso-contenido");
        if (!principal) return;
        var bloquear = esMovil() && !estaCerrado();
        if (bloquear) principal.setAttribute("inert", "");
        else principal.removeAttribute("inert");
    }

    function actualizarAria() {
        if (boton) boton.setAttribute("aria-expanded", String(!estaCerrado()));
        bloquearContenido();
    }

    function abrir() {
        raiz.classList.remove(CLASE);
        if (!esMovil()) guardar(false);
        actualizarAria();

        // En móvil el foco pasa al menú recién abierto
        if (esMovil()) {
            var primero = document.querySelector(".sidebar .acso-nav-item");
            if (primero) setTimeout(function () { primero.focus(); }, 30);
        }
    }

    function cerrar() {
        raiz.classList.add(CLASE);
        if (!esMovil()) guardar(true);
        actualizarAria();
    }

    function alternar() {
        if (estaCerrado()) abrir(); else cerrar();
    }

    // Cierra solo en móvil (sin tocar la preferencia de escritorio)
    function cerrarEnMovil() {
        if (!esMovil() || estaCerrado()) return;
        raiz.classList.add(CLASE);
        actualizarAria();
    }

    // Enfoca el botón del menú al cerrar con el teclado (Escape)
    function cerrarYEnfocar() {
        cerrarEnMovil();
        if (boton) boton.focus();
    }

    function iniciar() {
        boton = document.getElementById("btnMenu");

        var superposicion = document.getElementById("menuOverlay");
        var barra = document.getElementById("sidebar") || document.querySelector(".sidebar");

        if (boton) boton.addEventListener("click", alternar);

        if (superposicion) superposicion.addEventListener("click", cerrarEnMovil);

        // Elegir una opción del menú lo cierra en móvil
        if (barra) {
            barra.addEventListener("click", function (e) {
                if (e.target.closest("a, button, .acso-nav-item, [data-v], [data-seccion], [data-section]")) {
                    cerrarEnMovil();
                }
            });
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && esMovil() && !estaCerrado()) {
                cerrarYEnfocar();
            }
        });

        // Con el menú móvil abierto, Tab no se escapa a la página de atrás
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Tab" || !esMovil() || estaCerrado() || !barra) return;
            var items = Array.prototype.slice.call(
                barra.querySelectorAll("a[href], button:not([disabled])")
            ).filter(function (el) { return el.offsetParent !== null; });
            if (boton) items.unshift(boton);
            if (!items.length) return;
            var primero = items[0];
            var ultimo = items[items.length - 1];
            if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
            else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
        });

        // Al pasar de móvil a escritorio (o al revés) se reajusta
        var alCambiar = function () {
            raiz.classList.toggle(CLASE, esMovil() || leerGuardado());
            actualizarAria();
        };

        if (consulta.addEventListener) consulta.addEventListener("change", alCambiar);
        else if (consulta.addListener) consulta.addListener(alCambiar);

        actualizarAria();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciar);
    } else {
        iniciar();
    }

    window.ACSOMenu = { abrir: abrir, cerrar: cerrar, alternar: alternar, cerrarEnMovil: cerrarEnMovil };
})();
