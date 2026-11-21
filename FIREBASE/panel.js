/* =====================================================================
   ACSO · COMPORTAMIENTO COMÚN DE LOS CUATRO PANELES
   (administrador, supervisor, empleado y cliente)

   Se carga con  <script src="../FIREBASE/panel.js" defer></script>
   No depende de Firebase ni de la API: si algo falla, el panel sigue.

   Qué hace (igual en todos los paneles):
     1. Accesibilidad: ya no hay botón en la barra; las opciones están en
        «Configuración» (ver ajustes-a11y.js).
     2. Al cambiar de sección: actualiza el título de la pestaña, lleva el foco
        al título de la sección y lo anuncia a los lectores de pantalla.
     3. Menú lateral: flechas arriba/abajo, Inicio y Fin.
     4. Indicador «Sistema en línea / Sin conexión».
     5. Botones de filtro con aria-pressed, tablas con nombre accesible,
        campos obligatorios marcados, mensajes de error asociados al campo.
     6. ACSO.confirmar() y ACSO.preguntar(): diálogos accesibles que sustituyen
        a confirm()/prompt() y se ven iguales en todos los paneles.

   El estado del menú lateral lo maneja menu.js; las preferencias de
   accesibilidad se aplican desde menu.js (en <head>) para evitar parpadeos.
   ===================================================================== */

(function () {
    "use strict";

    var d = document;
    var raiz = d.documentElement;

    function listo(fn) {
        if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", fn);
        else fn();
    }

    function leer(clave) {
        try { return localStorage.getItem(clave); } catch (e) { return null; }
    }

    function guardar(clave, valor) {
        try {
            if (valor === null) localStorage.removeItem(clave);
            else localStorage.setItem(clave, valor);
        } catch (e) { /* sin almacenamiento: no se recuerda, pero funciona */ }
    }

    function crear(etiqueta, atributos, hijos) {
        var el = d.createElement(etiqueta);
        Object.keys(atributos || {}).forEach(function (k) {
            if (k === "texto") el.textContent = atributos[k];
            else el.setAttribute(k, atributos[k]);
        });
        (hijos || []).forEach(function (h) { el.appendChild(h); });
        return el;
    }


    /* ---------------------------------------------------------------
       Anuncios para lectores de pantalla
       --------------------------------------------------------------- */
    var regionAnuncios = null;

    function anunciar(texto) {
        if (!regionAnuncios) {
            regionAnuncios = crear("div", {
                "class": "sr-only", role: "status", "aria-live": "polite", "aria-atomic": "true", id: "acsoAnuncios"
            });
            d.body.appendChild(regionAnuncios);
        }
        // Se vacía y se vuelve a llenar para que se anuncie aunque el texto se repita
        regionAnuncios.textContent = "";
        setTimeout(function () { regionAnuncios.textContent = texto; }, 60);
    }


    /* ---------------------------------------------------------------
       1. Accesibilidad
       Ya no hay un botón en la barra superior: las opciones de
       accesibilidad viven en «Configuración» de cada panel y las dibuja
       FIREBASE/ajustes-a11y.js (que también aplica lo guardado).
       --------------------------------------------------------------- */
    function montarAjustes() {
        if (window.ACSOAjustes) window.ACSOAjustes.montarTodos();
    }


    /* ---------------------------------------------------------------
       2. Cambio de sección: título, foco y anuncio
       --------------------------------------------------------------- */
    var hayInteraccion = false;
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
        d.addEventListener(ev, function () { hayInteraccion = true; }, { once: true, capture: true, passive: true });
    });

    function seccionActiva() {
        return d.querySelector(".contenido.active, .seccion.activa, .vista:not([hidden])");
    }

    function alCambiarSeccion(item) {
        var etiqueta = item.querySelector(".acso-nav-txt");
        var nombre = (etiqueta ? etiqueta.textContent : item.textContent || "").replace(/\s+/g, " ").trim();
        if (!nombre) return;

        var panel = d.body.getAttribute("data-panel") || "ACSO";
        d.title = nombre + " | ACSO · " + panel;

        if (!hayInteraccion) return;   // en la carga inicial no se roba el foco

        // El foco va al título de la sección para que lectores de pantalla y
        // teclado sepan dónde está el contenido nuevo.
        setTimeout(function () {
            var sec = seccionActiva();
            var objetivo = sec && (sec.querySelector(".section-header h2") || sec.querySelector("h2, h3"));
            if (!objetivo && sec) objetivo = sec;
            if (objetivo) {
                if (!objetivo.hasAttribute("tabindex")) objetivo.setAttribute("tabindex", "-1");
                try { objetivo.focus({ preventScroll: true }); } catch (e) { objetivo.focus(); }
            }
            anunciar("Sección " + nombre);
        }, 80);
    }

    function vigilarNavegacion() {
        var menu = d.querySelector(".sidebar");
        if (!menu) return;

        new MutationObserver(function (cambios) {
            cambios.forEach(function (c) {
                var el = c.target;
                if (el.getAttribute && el.getAttribute("aria-current") === "page" && el.classList.contains("acso-nav-item")) {
                    alCambiarSeccion(el);
                }
            });
        }).observe(menu, { attributes: true, attributeFilter: ["aria-current"], subtree: true });

        // Título inicial de la pestaña
        var inicial = menu.querySelector(".acso-nav-item[aria-current='page']");
        if (inicial) alCambiarSeccion(inicial);
    }


    /* ---------------------------------------------------------------
       3. Menú lateral con teclado (flechas, Inicio, Fin)
       --------------------------------------------------------------- */
    function menuConTeclado() {
        var menu = d.querySelector(".sidebar");
        if (!menu) return;

        menu.addEventListener("keydown", function (e) {
            if (["ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) === -1) return;
            var items = Array.prototype.slice.call(menu.querySelectorAll(".acso-nav-item"))
                .filter(function (el) { return el.offsetParent !== null; });
            var i = items.indexOf(d.activeElement);
            if (i === -1) return;

            e.preventDefault();
            if (e.key === "ArrowDown") i = (i + 1) % items.length;
            else if (e.key === "ArrowUp") i = (i - 1 + items.length) % items.length;
            else if (e.key === "Home") i = 0;
            else i = items.length - 1;
            items[i].focus();
        });
    }


    /* ---------------------------------------------------------------
       4. Estado de conexión
       --------------------------------------------------------------- */
    function estadoConexion() {
        var indicadores = d.querySelectorAll(".acso-estado");
        if (!indicadores.length) return;

        function pintar() {
            var enLinea = navigator.onLine !== false;
            indicadores.forEach(function (el) {
                el.textContent = enLinea ? "Sistema en línea" : "Sin conexión";
                el.classList.toggle("sin-conexion", !enLinea);
            });
        }

        indicadores.forEach(function (el) {
            el.setAttribute("role", "status");
        });
        window.addEventListener("online", pintar);
        window.addEventListener("offline", pintar);
        pintar();
    }


    /* ---------------------------------------------------------------
       5. Detalles de accesibilidad que se repiten en todo el panel
       --------------------------------------------------------------- */

    // Botones de filtro: aria-pressed según la clase que les pone cada panel
    var GRUPOS_FILTRO = ".chips-estado .chip, .sol-tabs .sol-tab, .gx-estados .gx-estado-btn";

    function sincronizarFiltros(raizBusqueda) {
        (raizBusqueda || d).querySelectorAll(GRUPOS_FILTRO).forEach(function (b) {
            var activo = b.classList.contains("activo") || b.classList.contains("actual") || b.classList.contains("active");
            b.setAttribute("aria-pressed", String(activo));
        });
    }

    // Tablas: nombre accesible a partir del título de su tarjeta o sección
    function nombrarTablas(raizBusqueda) {
        (raizBusqueda || d).querySelectorAll("table:not([aria-label]):not([aria-labelledby])").forEach(function (t) {
            if (t.querySelector("caption")) return;
            var texto = "";
            var tarjeta = t.closest(".table-card");
            var titulo = tarjeta && tarjeta.querySelector(".table-title > :first-child, .table-title");
            if (titulo) texto = titulo.textContent;
            if (!texto) {
                var cont = t.closest(".panel, .tarjeta, .gx-card, section");
                var h = cont && cont.querySelector("h2, h3");
                if (h) texto = h.textContent;
            }
            texto = texto.replace(/\s+/g, " ").trim();
            if (texto) t.setAttribute("aria-label", texto);
        });
    }

    // Campos obligatorios: asterisco visible + aria-required
    function marcarObligatorios(raizBusqueda) {
        (raizBusqueda || d).querySelectorAll("input[required], select[required], textarea[required]").forEach(function (c) {
            if (c.type === "hidden") return;
            c.setAttribute("aria-required", "true");
            var etiqueta = c.labels && c.labels[0];
            if (etiqueta && !etiqueta.querySelector(".acso-requerido")) {
                var marca = crear("span", { "class": "acso-requerido", "aria-hidden": "true", texto: " *" });
                etiqueta.appendChild(marca);
            }
        });
    }

    // Botones que solo tienen un ícono o emoji: que tengan nombre
    function nombrarBotones(raizBusqueda) {
        (raizBusqueda || d).querySelectorAll("button:not([aria-label]), a[href]:not([aria-label])").forEach(function (b) {
            if (b.textContent.replace(/[\s\u200d\ufe0f]/g, "").length > 1) return;
            var t = b.getAttribute("title");
            if (t) b.setAttribute("aria-label", t);
        });
    }

    // Emojis decorativos de los menús: no se leen
    function ocultarIconos() {
        d.querySelectorAll(".acso-nav-ico, .card-icon, .bienvenida-icono, .icono-notificacion, .notificacion-icono")
            .forEach(function (el) { el.setAttribute("aria-hidden", "true"); });
    }

    /* Errores de campo: ACSO.errorCampo(input, "mensaje") lo deja asociado
       al campo (aria-describedby + aria-invalid) y lo anuncia.            */
    function errorCampo(campo, mensaje) {
        if (!campo) return;
        var id = (campo.id || "campo") + "-error";
        var previo = d.getElementById(id);
        if (previo) previo.remove();

        if (!mensaje) {
            campo.removeAttribute("aria-invalid");
            var descr = (campo.getAttribute("aria-describedby") || "").split(" ").filter(function (x) { return x && x !== id; });
            if (descr.length) campo.setAttribute("aria-describedby", descr.join(" "));
            else campo.removeAttribute("aria-describedby");
            return;
        }

        var aviso = crear("div", { "class": "acso-error-campo", id: id, role: "alert", texto: mensaje });
        campo.setAttribute("aria-invalid", "true");
        var actual = campo.getAttribute("aria-describedby");
        campo.setAttribute("aria-describedby", actual ? actual + " " + id : id);
        campo.insertAdjacentElement("afterend", aviso);
        campo.addEventListener("input", function limpiar() {
            errorCampo(campo, "");
            campo.removeEventListener("input", limpiar);
        });
    }

    function observarContenidoDinamico() {
        var pendiente = false;
        new MutationObserver(function (muts) {
            if (pendiente) return;
            // Solo reaccionamos si entraron nodos (no por cambios de atributos)
            var hayNodos = muts.some(function (m) { return m.addedNodes && m.addedNodes.length; });
            var hayClases = muts.some(function (m) { return m.type === "attributes"; });
            if (!hayNodos && !hayClases) return;
            pendiente = true;
            requestAnimationFrame(function () {
                pendiente = false;
                nombrarTablas();
                marcarObligatorios();
                sincronizarFiltros();
                ocultarIconos();
            });
        }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    }


    /* ---------------------------------------------------------------
       6. Diálogos accesibles: ACSO.confirmar() y ACSO.preguntar()
       --------------------------------------------------------------- */
    function abrirDialogo(opciones) {
        return new Promise(function (resolver) {
            var previoFoco = d.activeElement;
            var dlg = crear("dialog", { "aria-labelledby": "acsoDlgTitulo", "aria-describedby": "acsoDlgTexto" });
            var form = crear("form", { method: "dialog" });
            form.appendChild(crear("h2", { id: "acsoDlgTitulo", texto: opciones.titulo }));
            if (opciones.mensaje) form.appendChild(crear("p", { id: "acsoDlgTexto", texto: opciones.mensaje }));

            var campo = null;
            if (opciones.campo) {
                var etiqueta = crear("label", { "for": "acsoDlgCampo", texto: opciones.campo.etiqueta });
                campo = crear("input", {
                    id: "acsoDlgCampo",
                    type: opciones.campo.tipo || "text",
                    value: opciones.campo.valor || ""
                });
                if (opciones.campo.min !== undefined) campo.setAttribute("min", opciones.campo.min);
                if (opciones.campo.tipo === "number") campo.setAttribute("inputmode", "numeric");
                form.appendChild(etiqueta);
                form.appendChild(campo);
            }

            var menu = crear("menu");
            var cancelar = crear("button", { type: "button", "class": "btn", texto: opciones.cancelar || "Cancelar" });
            var aceptar = crear("button", {
                type: "submit",
                "class": opciones.peligro ? "btn btn-peligro" : "btn btn-primario",
                texto: opciones.aceptar || "Aceptar"
            });
            menu.appendChild(cancelar);
            menu.appendChild(aceptar);
            form.appendChild(menu);
            dlg.appendChild(form);
            d.body.appendChild(dlg);

            var resultado = null;
            var cerrado = false;

            function terminar(valor) {
                if (cerrado) return;
                cerrado = true;
                resultado = valor;
                if (dlg.open) dlg.close();
            }

            cancelar.addEventListener("click", function () { terminar(opciones.campo ? null : false); });
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                if (campo) {
                    if (!campo.value.trim()) { errorCampo(campo, "Escribe un valor."); campo.focus(); return; }
                    terminar(campo.value);
                } else {
                    terminar(true);
                }
            });
            dlg.addEventListener("cancel", function () { cerrado = true; resultado = opciones.campo ? null : false; });
            dlg.addEventListener("close", function () {
                dlg.remove();
                if (previoFoco && previoFoco.focus) previoFoco.focus();
                resolver(resultado === null && !opciones.campo ? false : resultado);
            });

            dlg.showModal();
            // En acciones destructivas el foco empieza en «Cancelar» (evita borrar sin querer)
            (campo || (opciones.peligro ? cancelar : aceptar)).focus();
            if (campo) campo.select();
        });
    }

    function confirmar(opciones) {
        if (typeof opciones === "string") opciones = { mensaje: opciones };
        opciones = opciones || {};
        return abrirDialogo({
            titulo: opciones.titulo || "¿Confirmas la acción?",
            mensaje: opciones.mensaje || "",
            aceptar: opciones.aceptar || "Sí, continuar",
            cancelar: opciones.cancelar || "Cancelar",
            // Si no se indica, se detecta por el texto (eliminar, borrar, quitar…)
            peligro: opciones.peligro !== undefined
                ? !!opciones.peligro
                : /elimin|borr|quitar/i.test((opciones.titulo || "") + " " + (opciones.aceptar || "") + " " + (opciones.mensaje || ""))
        });
    }

    function preguntar(opciones) {
        opciones = opciones || {};
        return abrirDialogo({
            titulo: opciones.titulo || "Escribe un valor",
            mensaje: opciones.mensaje || "",
            aceptar: opciones.aceptar || "Aceptar",
            cancelar: opciones.cancelar || "Cancelar",
            campo: { etiqueta: opciones.etiqueta || "Valor", tipo: opciones.tipo || "text", valor: opciones.valor, min: opciones.min }
        });
    }


    /* ---------------------------------------------------------------
       Inicio
       --------------------------------------------------------------- */
    listo(function () {
        montarAjustes();
        vigilarNavegacion();
        menuConTeclado();
        estadoConexion();
        nombrarTablas();
        marcarObligatorios();
        sincronizarFiltros();
        nombrarBotones();
        ocultarIconos();
        observarContenidoDinamico();
    });

    window.ACSO = window.ACSO || {};
    window.ACSO.anunciar = anunciar;
    window.ACSO.confirmar = confirmar;
    window.ACSO.preguntar = preguntar;
    window.ACSO.errorCampo = errorCampo;
})();
