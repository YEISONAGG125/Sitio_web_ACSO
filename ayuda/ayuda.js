/* =====================================================
   ACSO · Centro de ayuda
   - «Volver» lleva al panel de donde vino la persona
   - Preguntas frecuentes por tipo de usuario, con buscador
   - WhatsApp: pon el número en NUMERO_WHATSAPP para abrir el chat directo
===================================================== */

(function () {
    "use strict";

    // Número con indicativo de país y sin signos. Ejemplo (Colombia): "573001234567".
    // Si se deja vacío, se abre WhatsApp Web.
    var NUMERO_WHATSAPP = "";
    var MENSAJE_WHATSAPP = "Hola, necesito ayuda con ACSO.";

    var PANELES = {
        admin:      { url: "../admin/admin.html",           nombre: "panel de administración" },
        supervisor: { url: "../supervisor/supervisor.html", nombre: "panel de supervisión" },
        empleado:   { url: "../empleado/empleado.html",     nombre: "panel de empleado" },
        cliente:    { url: "../cliente/Cliente.html",       nombre: "panel de cliente" }
    };

    var ROLES = {
        cliente: "Cliente", empleado: "Empleado", supervisor: "Supervisor",
        admin: "Administrador", general: "Cuenta y acceso"
    };

    var FAQ = [
        /* ---------- CUENTA Y ACCESO ---------- */
        { g: "general", q: "Olvidé mi contraseña, ¿qué hago?",
          a: "<p>En la pantalla de inicio de sesión elige <strong>«¿Olvidaste tu contraseña?»</strong> y escribe tu usuario. La solicitud llega al administrador.</p><ol><li>El administrador verifica tu identidad (por llamada o mensaje).</li><li>Te entrega un <strong>código de un solo uso</strong>.</li><li>Con ese código eliges una contraseña nueva.</li></ol><p class=\"nota\">El código vence en 30 minutos y se muestra una sola vez. Si se venció, pide uno nuevo.</p>" },
        { g: "general", q: "Mi cuenta quedó bloqueada",
          a: "<p>Por seguridad, después de <strong>3 intentos fallidos</strong> la cuenta se bloquea durante <strong>15 minutos</strong>. Espera ese tiempo e inténtalo de nuevo, o pide ayuda a un administrador si no la recuerdas.</p>" },
        { g: "general", q: "Me dice que mi sesión expiró",
          a: "<p>Las sesiones se cierran solas tras un rato sin actividad para proteger tu cuenta (en supervisores, a los 15 minutos sin usar el panel o a las 8 horas). Inicia sesión otra vez; lo que ya enviaste no se pierde.</p>" },
        { g: "general", q: "¿Cómo cambio mi contraseña o mis datos?",
          a: "<p>Entra a <strong>Mi perfil</strong> en el menú lateral. Allí puedes editar tu nombre, teléfono, correo y dirección, cambiar tu foto y actualizar tu contraseña (mínimo 6 caracteres).</p>" },
        { g: "general", q: "Veo el texto muy pequeño o me cuesta leer la pantalla",
          a: "<p>Ve a <strong>Configuración → Accesibilidad</strong> dentro de tu panel. Puedes agrandar el texto, activar alto contraste, reducir el movimiento, ampliar el espaciado y subrayar los enlaces. Los cambios se recuerdan en ese equipo.</p><p>También puedes usarlas aquí mismo, en la sección «¿Te cuesta leer o usar la pantalla?» al final de esta página.</p>" },
        { g: "general", q: "¿Puedo usar el sitio solo con el teclado?",
          a: "<ul><li><strong>Tab / Shift + Tab</strong>: avanzar y retroceder entre elementos.</li><li><strong>Flechas ↑ ↓, Inicio y Fin</strong>: moverte por el menú lateral.</li><li><strong>Enter o Espacio</strong>: activar botones.</li><li><strong>Esc</strong>: cerrar ventanas y el menú en el celular.</li></ul><p>Al comenzar cada página hay un enlace «Saltar al contenido».</p>" },
        { g: "general", q: "Aparece «Sin conexión» arriba a la derecha",
          a: "<p>Tu dispositivo perdió internet. Revisa tu conexión: cuando vuelva, el indicador cambiará a «Sistema en línea» y los datos se actualizarán solos.</p>" },
        { g: "general", q: "El menú no se ve en mi celular",
          a: "<p>En pantallas pequeñas el menú está oculto. Toca el botón de las <strong>tres rayas</strong> arriba a la izquierda para abrirlo; se cierra solo al elegir una opción.</p>" },

        /* ---------- CLIENTE ---------- */
        { g: "cliente", q: "¿Cómo solicito un servicio o un contrato?",
          a: "<ol><li>Entra a <strong>Solicitar</strong> en el menú.</li><li>Elige si es un <strong>servicio</strong> o un <strong>contrato</strong> y completa el formulario.</li><li>Envía la solicitud.</li></ol><p>Puedes seguirla en <strong>Mis solicitudes</strong>; el estado cambia cuando el supervisor la revisa.</p>" },
        { g: "cliente", q: "¿Dónde veo cómo va mi solicitud?",
          a: "<p>En <strong>Mis solicitudes</strong>. Cada una muestra su estado (por ejemplo Pendiente, En revisión, Aprobada o Rechazada). También te llega un aviso en <strong>Notificaciones</strong>.</p>" },
        { g: "cliente", q: "¿Dónde consulto mi contrato y mis pagos?",
          a: "<p><strong>Mi contrato</strong> muestra las condiciones de tu contrato vigente y <strong>Mis pagos</strong> el historial de pagos. Si algo no coincide, comunícate con el supervisor.</p>" },
        { g: "cliente", q: "Un servicio se hizo mal, ¿a quién se lo digo?",
          a: "<p>Comunícate con el <strong>supervisor</strong> y explícale qué pasó (fecha, lugar y qué faltó o salió mal). Para atención directa también puedes usar el canal de WhatsApp de esta página.</p>" },

        /* ---------- EMPLEADO ---------- */
        { g: "empleado", q: "¿Dónde veo los servicios que me asignaron?",
          a: "<p>En <strong>Mis servicios</strong>. Allí aparecen los servicios que el supervisor te asignó, con su información.</p>" },
        { g: "empleado", q: "¿Cómo pido productos para un servicio?",
          a: "<ol><li>Entra a <strong>Pedir productos</strong>.</li><li>Elige los productos y las cantidades.</li><li>Envía el pedido.</li></ol><p>El supervisor lo recibe y te avisa en <strong>Notificaciones</strong> si fue aprobado.</p>" },
        { g: "empleado", q: "¿Cómo envío una novedad o una incapacidad?",
          a: "<p>En <strong>Novedad laboral</strong> completa el formulario y envíalo. Quedará en estado <strong>Pendiente</strong> hasta que el supervisor la marque como Vista, En revisión, Aprobada o Rechazada. Verás el cambio de estado en tu lista.</p>" },
        { g: "empleado", q: "¿Dónde consulto mi horario?",
          a: "<p>En <strong>Mi horario</strong>. Lo define el supervisor; si algo no es correcto, avísale para que lo actualice.</p>" },

        /* ---------- SUPERVISOR ---------- */
        { g: "supervisor", q: "¿Cómo entro como supervisor?",
          a: "<p>El acceso tiene dos pasos: primero <strong>usuario y contraseña</strong> y luego tu <strong>clave de supervisor</strong> (distinta de la contraseña). Tras 3 fallos se bloquea 15 minutos. La primera vez necesitas el código de autorización que entrega la administración.</p>" },
        { g: "supervisor", q: "¿Cómo reviso novedades e incapacidades?",
          a: "<p>En <strong>Novedad laboral</strong> verás las que envían los empleados. Cambia el estado entre Pendiente, Visto, En revisión, Aprobada o Rechazada; el empleado recibe el aviso.</p>" },
        { g: "supervisor", q: "¿Cómo atiendo las solicitudes de los clientes?",
          a: "<p>En <strong>Solicitudes</strong> aparecen los pedidos de servicio y contrato. Ábrelos, revísalos y márcalos con el estado que corresponda.</p>" },
        { g: "supervisor", q: "¿Cómo asigno servicios, horarios o inventario?",
          a: "<p>Usa <strong>Servicios</strong> para asignar un servicio a un empleado, <strong>Horarios</strong> para fijar su horario, <strong>Inventario</strong> para los productos de bodega y <strong>Pedidos de productos</strong> para responder lo que piden los empleados.</p>" },
        { g: "supervisor", q: "¿Para qué sirve Configuración y dónde saco reportes?",
          a: "<p><strong>Configuración</strong> permite elegir qué avisos quieres ver y ajustar la accesibilidad. Los <strong>Reportes</strong> están en el menú lateral y se abren en su propia página, con un botón para volver al panel.</p>" },

        /* ---------- ADMINISTRADOR ---------- */
        { g: "admin", q: "¿Cómo creo, desactivo o bloqueo un usuario?",
          a: "<p>En <strong>Usuarios</strong> usa «Nuevo usuario» para crear una cuenta. En cada fila puedes activar o desactivar la cuenta y ver si está en línea o bloqueada. Puedes filtrar por cargo y estado y exportar la lista en CSV.</p>" },
        { g: "admin", q: "¿Cómo genero un código de recuperación de contraseña?",
          a: "<ol><li>Entra a <strong>Recuperar contraseñas</strong>.</li><li><strong>Verifica la identidad</strong> de la persona (llamada o mensaje).</li><li>Genera el código y entrégaselo.</li></ol><p class=\"nota\">El código se muestra una sola vez y vence en 30 minutos.</p>" },
        { g: "admin", q: "¿Qué es «Datos del sistema»?",
          a: "<p>Una vista para consultar y editar listas completas (novedades, solicitudes, contratos, servicios, clientes, empleados, zonas, productos, etc.). Elige la lista, filtra y edita con cuidado: los cambios se guardan de inmediato.</p>" }
    ];

    var d = document;
    function $(id) { return d.getElementById(id); }

    function sinTildes(t) {
        return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    }
    function texto(html) {
        var x = d.createElement("div"); x.innerHTML = html; return x.textContent || "";
    }
    function escaparRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }


    /* ---------- «Volver» ---------- */
    function leerCargo() {
        try {
            var s = JSON.parse(localStorage.getItem("usuarioLogueado"));
            if (s && s.cargo) return String(s.cargo).toLowerCase();
        } catch (e) { /* sin sesión */ }
        try { return String(localStorage.getItem("cargo") || "").toLowerCase(); } catch (e) { return ""; }
    }

    function configurarVolver() {
        var params = new URLSearchParams(location.search);
        var clave = String(params.get("desde") || "").toLowerCase();
        if (clave === "administrador") clave = "admin";
        if (!PANELES[clave]) {
            var cargo = leerCargo();
            clave = cargo === "administrador" ? "admin" : (PANELES[cargo] ? cargo : "");
        }
        var enlace = $("btnVolver");
        if (clave) {
            enlace.href = PANELES[clave].url;
            $("txtVolver").textContent = "Volver al " + PANELES[clave].nombre;
        } else {
            enlace.href = "../inicio de sistema/login.html";
            $("txtVolver").textContent = "Volver al inicio de sesión";
        }
        return clave;
    }


    /* ---------- WhatsApp ---------- */
    function configurarWhatsApp() {
        var a = $("btnWhatsApp");
        var numero = String(NUMERO_WHATSAPP).replace(/\D/g, "");
        if (numero) a.href = "https://wa.me/" + numero + "?text=" + encodeURIComponent(MENSAJE_WHATSAPP);
    }


    /* ---------- Preguntas frecuentes ---------- */
    var grupoActivo = "todas";
    var items = [];

    function construirFaq() {
        var cont = $("listaFaq");
        FAQ.forEach(function (f, i) {
            var det = d.createElement("details");
            det.className = "faq-item";
            det.id = "faq-" + i;
            det.setAttribute("data-grupo", f.g);

            var sum = d.createElement("summary");
            var rol = d.createElement("span");
            rol.className = "rol r-" + f.g; rol.textContent = ROLES[f.g];
            var t = d.createElement("span");
            t.className = "t"; t.textContent = f.q;
            sum.appendChild(rol); sum.appendChild(t);

            var cuerpo = d.createElement("div");
            cuerpo.className = "faq-cuerpo"; cuerpo.innerHTML = f.a;   // contenido propio, no del usuario

            det.appendChild(sum); det.appendChild(cuerpo);
            cont.appendChild(det);

            items.push({
                el: det, grupo: f.g, titulo: t, cuerpo: cuerpo, htmlOriginal: f.a, tituloOriginal: f.q,
                claves: sinTildes(f.q + " " + texto(f.a) + " " + ROLES[f.g])
            });
        });

        // Contadores en las pestañas
        d.querySelectorAll(".pestana").forEach(function (p) {
            var g = p.getAttribute("data-grupo");
            var n = g === "todas" ? FAQ.length : FAQ.filter(function (f) { return f.g === g; }).length;
            var c = d.createElement("span"); c.className = "cuenta"; c.textContent = "(" + n + ")";
            p.appendChild(c);
        });
    }

    function resaltar(el, original, palabras, esHtml) {
        if (esHtml) el.innerHTML = original; else el.textContent = original;
        if (!palabras.length) return;
        var base = sinTildes(original);
        // Solo se resalta en texto plano (títulos); en el cuerpo se deja intacto el HTML
        if (esHtml) return;
        var marcas = [];
        palabras.forEach(function (p) {
            var i = base.indexOf(p);
            while (i !== -1) { marcas.push([i, i + p.length]); i = base.indexOf(p, i + p.length); }
        });
        if (!marcas.length) return;
        marcas.sort(function (a, b) { return a[0] - b[0]; });
        var fusion = [marcas[0]];
        marcas.slice(1).forEach(function (m) {
            var u = fusion[fusion.length - 1];
            if (m[0] <= u[1]) u[1] = Math.max(u[1], m[1]); else fusion.push(m);
        });
        el.textContent = "";
        var pos = 0;
        fusion.forEach(function (m) {
            if (m[0] > pos) el.appendChild(d.createTextNode(original.slice(pos, m[0])));
            var mk = d.createElement("mark"); mk.textContent = original.slice(m[0], m[1]); el.appendChild(mk);
            pos = m[1];
        });
        if (pos < original.length) el.appendChild(d.createTextNode(original.slice(pos)));
    }

    function filtrar(abrirResultados) {
        var consulta = sinTildes($("buscar").value).trim();
        var palabras = consulta ? consulta.split(/\s+/).filter(Boolean) : [];
        var visibles = 0;

        items.forEach(function (it) {
            var pasaGrupo = grupoActivo === "todas" || it.grupo === grupoActivo;
            var pasaTexto = palabras.every(function (p) { return it.claves.indexOf(p) !== -1; });
            var ok = pasaGrupo && pasaTexto;
            it.el.hidden = !ok;
            resaltar(it.titulo, it.tituloOriginal, ok ? palabras : [], false);
            if (ok) {
                visibles++;
                if (abrirResultados && palabras.length) it.el.open = true;
            }
        });

        $("sinResultados").hidden = visibles !== 0;
        $("limpiar").hidden = !consulta;

        var estado = $("estadoBusqueda");
        if (!consulta && grupoActivo === "todas") estado.textContent = "";
        else estado.textContent = visibles === 0
            ? "No hay resultados."
            : visibles + (visibles === 1 ? " resultado." : " resultados.");
    }

    function elegirGrupo(g) {
        grupoActivo = g;
        d.querySelectorAll(".pestana").forEach(function (p) {
            p.setAttribute("aria-pressed", String(p.getAttribute("data-grupo") === g));
        });
        filtrar(false);
    }

    function iniciarFaq(clave) {
        construirFaq();

        d.querySelectorAll(".pestana").forEach(function (p) {
            p.addEventListener("click", function () { elegirGrupo(p.getAttribute("data-grupo")); });
        });

        $("formBuscar").addEventListener("submit", function (e) { e.preventDefault(); });
        $("buscar").addEventListener("input", function () { filtrar(true); });
        $("limpiar").addEventListener("click", function () {
            $("buscar").value = ""; filtrar(false); $("buscar").focus();
        });
        $("buscar").addEventListener("keydown", function (e) {
            if (e.key === "Escape" && $("buscar").value) { e.preventDefault(); $("limpiar").click(); }
        });

        $("abrirTodas").addEventListener("click", function () {
            items.forEach(function (it) { if (!it.el.hidden) it.el.open = true; });
        });
        $("cerrarTodas").addEventListener("click", function () {
            items.forEach(function (it) { it.el.open = false; });
        });
        $("verTodasFaq").addEventListener("click", function () {
            $("buscar").value = ""; elegirGrupo("todas"); $("buscar").focus();
        });

        // Si venía de un panel, se muestra primero lo suyo
        var inicial = clave && ROLES[clave] ? clave : "todas";
        var params = new URLSearchParams(location.search);
        if (params.get("q")) { $("buscar").value = params.get("q"); }
        elegirGrupo(inicial);
        if (params.get("q")) filtrar(true);

        // Enlace directo a una pregunta: ayuda.html#faq-3
        var m = /^#faq-(\d+)$/.exec(location.hash);
        if (m && items[+m[1]]) {
            elegirGrupo("todas");
            items[+m[1]].el.open = true;
            items[+m[1]].el.scrollIntoView();
        }
    }


    /* ---------- Botón «subir» ---------- */
    function iniciarSubir() {
        var b = $("btnSubir");
        function ver() { b.hidden = window.scrollY < 600; }
        window.addEventListener("scroll", ver, { passive: true });
        b.addEventListener("click", function () {
            window.scrollTo({ top: 0 });
            var m = $("contenido"); if (m) m.focus({ preventScroll: true });
        });
        ver();
    }

    function iniciar() {
        var clave = configurarVolver();
        configurarWhatsApp();
        iniciarFaq(clave);
        iniciarSubir();
    }

    if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", iniciar);
    else iniciar();
})();
