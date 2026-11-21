/* =====================================================================
   ACSO · AJUSTES DE ACCESIBILIDAD (se muestran en «Configuración»)

   Se carga con  <script src="../FIREBASE/ajustes-a11y.js"></script>
   (script normal, en el <head>). Hace dos cosas:

     1. Aplica al instante las preferencias guardadas, para que la página
        no «salte» al cargar.
     2. Dibuja la tarjeta de accesibilidad dentro de cualquier elemento
        que tenga el atributo  data-acso-ajustes.

   Preferencias (se guardan en este equipo):
     texto       normal | grande | mayor
     contraste   normal | alto
     movimiento  normal | reducido
     lectura     normal | amplia      (más espacio entre líneas y letras)
     enlaces     normal | subrayados

   No depende de Firebase ni de la API.
   ===================================================================== */

(function () {
    "use strict";

    var d = document;
    var raiz = d.documentElement;

    var AJUSTES = {
        texto:      { clave: "acso_texto",      attr: "data-acso-texto",      defecto: "normal", valores: ["normal", "grande", "mayor"] },
        contraste:  { clave: "acso_contraste",  attr: "data-acso-contraste",  defecto: "normal", valores: ["normal", "alto"] },
        movimiento: { clave: "acso_movimiento", attr: "data-acso-movimiento", defecto: "normal", valores: ["normal", "reducido"] },
        lectura:    { clave: "acso_lectura",    attr: "data-acso-lectura",    defecto: "normal", valores: ["normal", "amplia"] },
        enlaces:    { clave: "acso_enlaces",    attr: "data-acso-enlaces",    defecto: "normal", valores: ["normal", "subrayados"] }
    };

    function leer(clave) {
        try { return localStorage.getItem(clave); } catch (e) { return null; }
    }

    function guardar(clave, valor) {
        try {
            if (valor === null) localStorage.removeItem(clave);
            else localStorage.setItem(clave, valor);
        } catch (e) { /* sin almacenamiento: funciona, pero no se recuerda */ }
    }

    function actual(nombre) {
        var a = AJUSTES[nombre];
        var v = raiz.getAttribute(a.attr);
        return a.valores.indexOf(v) === -1 ? a.defecto : v;
    }

    function poner(nombre, valor) {
        var a = AJUSTES[nombre];
        if (a.valores.indexOf(valor) === -1) valor = a.defecto;
        if (valor === a.defecto) {
            raiz.removeAttribute(a.attr);
            guardar(a.clave, null);
        } else {
            raiz.setAttribute(a.attr, valor);
            guardar(a.clave, valor);
        }
    }

    // 1. Aplicar lo guardado de inmediato
    Object.keys(AJUSTES).forEach(function (nombre) {
        var a = AJUSTES[nombre];
        var v = leer(a.clave);
        if (v && a.valores.indexOf(v) > 0) raiz.setAttribute(a.attr, v);
    });

    // El sistema operativo ya pide menos movimiento: se respeta sin guardar nada
    try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && !leer(AJUSTES.movimiento.clave)) {
            raiz.setAttribute(AJUSTES.movimiento.attr, "reducido");
        }
    } catch (e) { /* matchMedia no disponible */ }


    function crear(etiqueta, atributos, hijos) {
        var el = d.createElement(etiqueta);
        Object.keys(atributos || {}).forEach(function (k) {
            if (k === "texto") el.textContent = atributos[k];
            else el.setAttribute(k, atributos[k]);
        });
        (hijos || []).forEach(function (h) { el.appendChild(h); });
        return el;
    }

    function anunciar(texto) {
        var r = d.getElementById("acsoAnunciosAjustes");
        if (!r) {
            r = crear("div", { id: "acsoAnunciosAjustes", "class": "acso-sr", role: "status", "aria-live": "polite", "aria-atomic": "true" });
            d.body.appendChild(r);
        }
        r.textContent = "";
        setTimeout(function () { r.textContent = texto; }, 60);
    }

    var contador = 0;

    // Un grupo de botones excluyentes (como botones de radio)
    function grupo(titulo, ayuda, nombre, opciones) {
        contador++;
        var idAyuda = "acsoAjAyuda" + contador;
        var campo = crear("fieldset", { "class": "acso-aj-campo", "aria-describedby": idAyuda });
        campo.appendChild(crear("legend", { texto: titulo }));
        campo.appendChild(crear("p", { "class": "acso-aj-ayuda", id: idAyuda, texto: ayuda }));
        var fila = crear("div", { "class": "acso-aj-opciones" });
        opciones.forEach(function (o) {
            var b = crear("button", {
                type: "button",
                "class": "acso-aj-opcion",
                "data-ajuste": nombre,
                "data-valor": o.valor,
                "aria-pressed": "false",
                texto: o.etiqueta
            });
            if (o.nombre) b.setAttribute("aria-label", o.nombre);
            if (o.estilo) b.setAttribute("data-muestra", o.estilo);
            fila.appendChild(b);
        });
        campo.appendChild(fila);
        return campo;
    }

    function montar(contenedor) {
        if (!contenedor || contenedor.getAttribute("data-montado")) return;
        contenedor.setAttribute("data-montado", "1");
        contador++;

        var idTitulo = "acsoAjTitulo" + contador;
        var tarjeta = crear("section", { "class": "acso-ajustes", "aria-labelledby": idTitulo });

        tarjeta.appendChild(crear("header", { "class": "acso-aj-cab" }, [
            crear("span", { "class": "acso-aj-ico", "aria-hidden": "true", texto: "Aa" }),
            crear("div", {}, [
                crear("h3", { id: idTitulo, texto: "Accesibilidad" }),
                crear("p", { texto: "Adapta la pantalla a tu comodidad. Los cambios se aplican al instante y se recuerdan en este equipo." })
            ])
        ]));

        var cuerpo = crear("div", { "class": "acso-aj-grid" });
        cuerpo.appendChild(grupo("Tamaño del texto", "Agranda las letras en todo el panel.", "texto", [
            { valor: "normal", etiqueta: "A", nombre: "Texto normal", estilo: "1" },
            { valor: "grande", etiqueta: "A+", nombre: "Texto grande", estilo: "2" },
            { valor: "mayor", etiqueta: "A++", nombre: "Texto muy grande", estilo: "3" }
        ]));
        cuerpo.appendChild(grupo("Contraste", "El alto contraste hace más nítidos textos y bordes.", "contraste", [
            { valor: "normal", etiqueta: "Normal", nombre: "Contraste normal" },
            { valor: "alto", etiqueta: "Alto", nombre: "Contraste alto" }
        ]));
        cuerpo.appendChild(grupo("Movimiento", "Quita animaciones y desplazamientos suaves.", "movimiento", [
            { valor: "normal", etiqueta: "Normal", nombre: "Movimiento normal" },
            { valor: "reducido", etiqueta: "Reducido", nombre: "Movimiento reducido" }
        ]));
        cuerpo.appendChild(grupo("Espaciado de lectura", "Más aire entre líneas, palabras y letras.", "lectura", [
            { valor: "normal", etiqueta: "Normal", nombre: "Espaciado normal" },
            { valor: "amplia", etiqueta: "Amplio", nombre: "Espaciado amplio" }
        ]));
        cuerpo.appendChild(grupo("Enlaces", "Subraya los enlaces para distinguirlos sin depender del color.", "enlaces", [
            { valor: "normal", etiqueta: "Normal", nombre: "Enlaces normales" },
            { valor: "subrayados", etiqueta: "Subrayados", nombre: "Enlaces subrayados" }
        ]));
        tarjeta.appendChild(cuerpo);

        var muestra = crear("p", { "class": "acso-aj-muestra", texto: "Así se verá el texto de tu panel: servicios, horarios, solicitudes y notificaciones." });
        var restablecer = crear("button", { type: "button", "class": "acso-aj-restablecer", texto: "Restablecer accesibilidad" });
        tarjeta.appendChild(crear("div", { "class": "acso-aj-pie" }, [muestra, restablecer]));

        contenedor.appendChild(tarjeta);

        function sincronizar() {
            tarjeta.querySelectorAll("[data-ajuste]").forEach(function (b) {
                var n = b.getAttribute("data-ajuste");
                b.setAttribute("aria-pressed", String(b.getAttribute("data-valor") === actual(n)));
            });
        }

        tarjeta.addEventListener("click", function (e) {
            var b = e.target.closest("button");
            if (!b || !tarjeta.contains(b)) return;

            if (b === restablecer) {
                Object.keys(AJUSTES).forEach(function (n) { poner(n, AJUSTES[n].defecto); });
                sincronizar();
                anunciar("Opciones de accesibilidad restablecidas.");
                return;
            }
            if (b.hasAttribute("data-ajuste")) {
                poner(b.getAttribute("data-ajuste"), b.getAttribute("data-valor"));
                sincronizar();
                anunciar((b.getAttribute("aria-label") || b.textContent) + " activado.");
            }
        });

        // Si otra pestaña cambia una preferencia, esta se actualiza
        window.addEventListener("storage", function (e) {
            Object.keys(AJUSTES).forEach(function (n) {
                if (e.key === AJUSTES[n].clave) {
                    var v = e.newValue;
                    if (v && AJUSTES[n].valores.indexOf(v) > 0) raiz.setAttribute(AJUSTES[n].attr, v);
                    else raiz.removeAttribute(AJUSTES[n].attr);
                }
            });
            sincronizar();
        });

        sincronizar();
    }

    function montarTodos() {
        d.querySelectorAll("[data-acso-ajustes]").forEach(montar);
    }

    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", montarTodos);
    else montarTodos();

    window.ACSOAjustes = { montar: montar, montarTodos: montarTodos, poner: poner, actual: actual };
})();
