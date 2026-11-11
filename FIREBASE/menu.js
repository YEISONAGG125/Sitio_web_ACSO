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

    var boton = null;

    function actualizarAria() {
        if (boton) boton.setAttribute("aria-expanded", String(!estaCerrado()));
    }

    function abrir() {
        raiz.classList.remove(CLASE);
        if (!esMovil()) guardar(false);
        actualizarAria();
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

    function iniciar() {
        boton = document.getElementById("btnMenu");

        var superposicion = document.getElementById("menuOverlay");
        var barra = document.getElementById("sidebar") || document.querySelector(".sidebar");

        if (boton) boton.addEventListener("click", alternar);

        if (superposicion) superposicion.addEventListener("click", cerrarEnMovil);

        // Elegir una opción del menú lo cierra en móvil
        if (barra) {
            barra.addEventListener("click", function (e) {
                if (e.target.closest("a, button, .tab, [data-v], [data-seccion], [data-section]")) {
                    cerrarEnMovil();
                }
            });
        }

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && esMovil() && !estaCerrado()) {
                cerrarEnMovil();
                if (boton) boton.focus();
            }
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
