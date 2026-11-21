/* ACSO · Centro de ayuda: búsqueda, formulario de contacto y copiado de mensaje */
(function () {
    "use strict";

    // Si la empresa tiene un número de WhatsApp de atención, escríbelo aquí
    // con indicativo y sin signos (ej. "573001234567"). Vacío = la persona elige el contacto.
    var WHATSAPP_NUMERO = "";

    var $ = function (id) { return document.getElementById(id); };
    var norm = function (t) {
        return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    };

    /* ---- Volver: a la página anterior si es de este sitio; si no, al inicio de sesión ---- */
    var volver = $("btnVolver");
    if (volver) {
        volver.addEventListener("click", function (e) {
            try {
                if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) {
                    e.preventDefault();
                    history.back();
                }
            } catch (x) { /* se usa el enlace normal */ }
        });
    }

    /* ---- Búsqueda en accesos, tipos y preguntas ---- */
    var elementos = Array.prototype.slice.call(document.querySelectorAll("[data-busca]"));
    var preguntas = Array.prototype.slice.call(document.querySelectorAll(".ayuda-pregunta"));

    function buscar() {
        var q = norm($("buscar").value).trim();
        var visibles = 0;
        var visiblesFaq = 0;

        elementos.forEach(function (el) {
            var texto = norm(el.getAttribute("data-busca") + " " + el.textContent);
            var coincide = !q || q.split(/\s+/).every(function (p) { return texto.indexOf(p) !== -1; });
            el.hidden = !coincide;
            if (coincide) visibles++;
            if (coincide && el.classList.contains("ayuda-pregunta")) visiblesFaq++;
            if (el.classList.contains("ayuda-pregunta")) el.open = !!q && coincide;
        });

        $("sinResultados").hidden = !q || visiblesFaq > 0 || visibles > 0;
        $("resultadoBusqueda").textContent = q
            ? (visibles ? visibles + (visibles === 1 ? " resultado" : " resultados") + " para «" + $("buscar").value.trim() + "»." : "Sin resultados.")
            : "";
    }

    $("formBuscar").addEventListener("submit", function (e) { e.preventDefault(); buscar(); });
    $("buscar").addEventListener("input", buscar);

    /* ---- Formulario de contacto ---- */
    var TIPOS = {
        servicio: "Problema con un servicio",
        acceso: "No puedo entrar o recuperar mi cuenta",
        pagina: "La página no funciona bien",
        otro: "Otro"
    };

    function armarMensaje() {
        var nombre = $("cNombre").value.trim();
        var tipo = TIPOS[$("cTipo").value] || "";
        var texto = $("cMensaje").value.trim();
        return "Hola, necesito ayuda con ACSO.\n" +
            (nombre ? "Nombre: " + nombre + "\n" : "") +
            "Tipo: " + tipo + "\n" +
            "Detalle: " + texto;
    }

    function validar() {
        var ok = true;
        [["cTipo", "Elige qué te pasó."], ["cMensaje", "Describe lo que ocurrió."]].forEach(function (par) {
            var c = $(par[0]);
            var vacio = !c.value.trim();
            if (window.ACSO && window.ACSO.errorCampo) window.ACSO.errorCampo(c, vacio ? par[1] : "");
            if (vacio && ok) { c.focus(); }
            if (vacio) ok = false;
        });
        return ok;
    }

    function aviso(texto) {
        var a = $("avisoContacto");
        a.textContent = texto;
        a.classList.add("mostrar");
        clearTimeout(aviso.t);
        aviso.t = setTimeout(function () { a.classList.remove("mostrar"); }, 4000);
    }

    $("cMensaje").addEventListener("input", function () {
        $("cContador").textContent = this.value.length + " / 600";
    });

    $("btnWhatsapp").addEventListener("click", function (e) {
        if (!validar()) { e.preventDefault(); return; }
        var base = "https://wa.me/" + WHATSAPP_NUMERO.replace(/\D/g, "");
        this.href = base + "?text=" + encodeURIComponent(armarMensaje());
    });

    $("btnCopiar").addEventListener("click", function () {
        if (!validar()) return;
        var mensaje = armarMensaje();
        function listo() { aviso("Mensaje copiado. Pégalo donde quieras enviarlo."); }
        function manual() {
            var t = document.createElement("textarea");
            t.value = mensaje; t.setAttribute("readonly", "");
            t.style.position = "fixed"; t.style.opacity = "0";
            document.body.appendChild(t); t.select();
            try { document.execCommand("copy"); listo(); } catch (x) { aviso("No se pudo copiar. Selecciona y copia el texto a mano."); }
            t.remove();
        }
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(mensaje).then(listo, manual);
        } else { manual(); }
    });
})();
