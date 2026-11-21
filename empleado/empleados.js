

import {
    db,
    rtdb,
    ref,
    update,
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    COL_NOVEDADES,
    COL_NOTIFICACIONES,
    COL_INVENTARIO,
    COL_PEDIDOS,
    COL_ASIGNACIONES,
    COL_HORARIOS
} from "../FIREBASE/firebase.js";

import { montarPerfil } from "../FIREBASE/perfil.js";
const API_BASE = "http://localhost:8080/api";

function leerSesion() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogueado")) || {};
    } catch {
        return {};
    }
}

const sesion = leerSesion();

// Solo pueden entrar empleados
if (String(sesion.cargo || localStorage.getItem("cargo") || "").toLowerCase() !== "empleado") {
    window.location.href = "../inicio de sistema/login.html";
}
const idEmpleado = String(
    localStorage.getItem("id_empleado") ||
    sesion.id_empleado ||
    sesion.id_usuario ||
    sesion.id ||
    ""
);

let nombreEmpleado =
    localStorage.getItem("nombre_empleado") ||
    sesion.nombre_empleado ||
    sesion.nombre_completo ||
    sesion.nombre ||
    sesion.usuario ||
    "Empleado";


// =====================================================
// UTILIDADES
// =====================================================

const $ = (id) => document.getElementById(id);

function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
}

function formatearFecha(valor) {
    if (!valor) return "";
    const fecha = valor.toDate ? valor.toDate() : new Date(valor);
    if (isNaN(fecha)) return "";
    return fecha.toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatearDia(isoDia) {
    if (!isoDia) return "-";
    const [a, m, d] = isoDia.split("-");
    return `${d}/${m}/${a}`;
}

function claseEstado(estado) {
    return "estado-" + String(estado || "Pendiente")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

function milisegundos(valor) {
    if (!valor) return 0;
    return valor.toMillis ? valor.toMillis() : new Date(valor).getTime();
}

function mostrarMensaje(texto, tipo = "") {
    const caja = $("mensajeSistema");
    $("textoMensaje").textContent = texto;
    caja.className = "mensaje-sistema mostrar " + tipo;
    clearTimeout(mostrarMensaje.t);
    mostrarMensaje.t = setTimeout(() => {
        caja.className = "mensaje-sistema";
    }, 3500);
}


// =====================================================
// DATOS DEL EMPLEADO EN PANTALLA
// =====================================================

function mostrarDatosEmpleado() {
    $("nombreEmpleado").textContent = nombreEmpleado;
    $("inicioNombre").textContent = nombreEmpleado;
    $("formNombreEmpleado").textContent = nombreEmpleado;
    $("saludoEmpleado").textContent = `Hola, ${nombreEmpleado.split(" ")[0]}`;

    $("inicioId").textContent = idEmpleado || "-";
    $("formIdEmpleado").textContent = idEmpleado || "-";

    // El avatar (foto o iniciales) lo pinta FIREBASE/perfil.js
}


// =====================================================
// MENÚ
// =====================================================

const TITULOS = {
    inicio: ["Panel del Empleado", "Consulta tu información laboral"],
    servicios: ["Mis servicios", "Servicios asignados"],
    productos: ["Pedir productos", "Pide al supervisor lo que necesitas para tu servicio"],
    novedades: ["Novedad laboral", "Envía una novedad o incapacidad al supervisor"],
    notificaciones: ["Notificaciones", "Información importante"],
    horarios: ["Mi horario", "Consulta tus horarios de trabajo"],
    perfil: ["Mi perfil", "Consulta y actualiza tus datos personales"]
};

function irASeccion(seccion) {

    const botones = document.querySelectorAll(".sidebar .acso-nav-item[data-seccion]");
    const secciones = document.querySelectorAll(".seccion");

    if (!$(seccion)) return;

    botones.forEach(b => {
        if (b.dataset.seccion === seccion) b.setAttribute("aria-current", "page");
        else b.removeAttribute("aria-current");
    });

    secciones.forEach(s => s.classList.remove("activa"));
    $(seccion).classList.add("activa");


    // Al abrir notificaciones se marcan como leídas
    if (seccion === "notificaciones") {
        marcarNotificacionesLeidas();
    }

    // En móvil el menú se cierra solo al elegir una opción
    window.ACSOMenu?.cerrarEnMovil();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function configurarMenu() {

    document.querySelectorAll(".sidebar .acso-nav-item[data-seccion]").forEach(boton => {
        boton.addEventListener("click", () => irASeccion(boton.dataset.seccion));
    });

    // El logo de la barra superior lleva al inicio
    document.querySelector(".acso-marca")?.addEventListener("click", (e) => {
        e.preventDefault();
        irASeccion("inicio");
    });

    // Tarjeta de usuario del encabezado -> Mi perfil
    const tarjeta = $("abrirPerfil");
    tarjeta?.addEventListener("click", () => irASeccion("perfil"));
    tarjeta?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            irASeccion("perfil");
        }
    });

    // Se puede entrar directo con empleado.html#perfil
    const hash = location.hash.replace("#", "");
    if (hash && $(hash)?.classList.contains("seccion")) irASeccion(hash);
}


// =====================================================
// FORMULARIO DE NOVEDAD / INCAPACIDAD
// =====================================================

function configurarFormulario() {

    const tipo = $("tipoNovedad");
    const bloque = $("camposIncapacidad");
    const fInicio = $("fechaInicio");
    const fFin = $("fechaFin");
    const dias = $("diasCalculados");
    const texto = $("descripcionNovedad");

    // Mostrar campos extra si es incapacidad
    tipo.addEventListener("change", () => {
        const esIncapacidad = tipo.value === "Incapacidad";
        bloque.classList.toggle("oculto", !esIncapacidad);
        fInicio.required = esIncapacidad;
        fFin.required = esIncapacidad;
    });

    // Calcular días
    function calcularDias() {
        if (!fInicio.value || !fFin.value) {
            dias.textContent = "-";
            return null;
        }
        const diff = (new Date(fFin.value) - new Date(fInicio.value)) / 86400000 + 1;
        if (diff < 1) {
            dias.textContent = "Fechas inválidas";
            return null;
        }
        dias.textContent = diff + (diff === 1 ? " día" : " días");
        return diff;
    }

    fInicio.addEventListener("change", () => {
        fFin.min = fInicio.value;
        calcularDias();
    });
    fFin.addEventListener("change", calcularDias);

    // Contador de caracteres
    texto.addEventListener("input", () => {
        $("contadorCaracteres").textContent = texto.value.length;
    });

    // Enviar
    $("formNovedad").addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!idEmpleado) {
            mostrarMensaje("No se encontró tu ID. Vuelve a iniciar sesión.", "error");
            return;
        }

        const tipoValor = tipo.value;
        const descripcion = texto.value.trim();

        if (!tipoValor) {
            mostrarMensaje("Selecciona el tipo de novedad.", "error");
            return;
        }

        if (!descripcion) {
            mostrarMensaje("Escribe una descripción.", "error");
            return;
        }

        const esIncapacidad = tipoValor === "Incapacidad";
        let diasIncapacidad = null;

        if (esIncapacidad) {
            diasIncapacidad = calcularDias();
            if (!diasIncapacidad) {
                mostrarMensaje("Revisa las fechas de la incapacidad.", "error");
                return;
            }
        }

        const boton = $("btnEnviarNovedad");
        boton.disabled = true;
        boton.textContent = "Enviando...";

        const novedad = {
            id_empleado: idEmpleado,
            nombre_empleado: nombreEmpleado,
            usuario: sesion.usuario || "",
            tipo_novedad: tipoValor,
            descripcion: descripcion,
            es_incapacidad: esIncapacidad,
            fecha_inicio: esIncapacidad ? fInicio.value : null,
            fecha_fin: esIncapacidad ? fFin.value : null,
            dias_incapacidad: diasIncapacidad,
            entidad: esIncapacidad ? $("entidadIncapacidad").value.trim() : "",
            estado: "Pendiente",
            comentario_supervisor: "",
            fecha_envio: serverTimestamp(),
            fecha_actualizacion: serverTimestamp()
        };

        try {
            await addDoc(collection(db, COL_NOVEDADES), novedad);

            mostrarMensaje(
                esIncapacidad
                    ? "Incapacidad enviada al supervisor."
                    : "Novedad enviada al supervisor.",
                "exito"
            );

            $("formNovedad").reset();
            bloque.classList.add("oculto");
            dias.textContent = "-";
            $("contadorCaracteres").textContent = "0";

        } catch (error) {
            console.error("Error enviando novedad:", error);
            mostrarMensaje(
                "No se pudo enviar. Revisa tu conexión y las reglas de Firestore.",
                "error"
            );
        } finally {
            boton.disabled = false;
            boton.textContent = "📤 Enviar novedad";
        }
    });
}


// =====================================================
// HISTORIAL DE NOVEDADES (TIEMPO REAL)
// =====================================================

function escucharNovedades() {

    const contenedor = $("listaNovedades");

    if (!idEmpleado) {
        contenedor.innerHTML = `<div class="mensaje-error">No se encontró el ID del empleado.</div>`;
        return;
    }

    const q = query(
        collection(db, COL_NOVEDADES),
        where("id_empleado", "==", idEmpleado)
    );

    onSnapshot(q, (snap) => {

        const lista = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => milisegundos(b.fecha_envio) - milisegundos(a.fecha_envio));

        $("totalNovedades").textContent = lista.length;

        if (lista.length === 0) {
            contenedor.innerHTML = `<div class="mensaje-vacio">No tienes novedades registradas.</div>`;
            return;
        }

        contenedor.innerHTML = lista.map(n => {

            const rango = n.es_incapacidad
                ? `<div class="novedad-extra">
                       📅 ${formatearDia(n.fecha_inicio)} → ${formatearDia(n.fecha_fin)}
                       · <strong>${n.dias_incapacidad} ${n.dias_incapacidad === 1 ? "día" : "días"}</strong>
                       ${n.entidad ? "· " + escaparHTML(n.entidad) : ""}
                   </div>`
                : "";

            const respuesta = n.comentario_supervisor
                ? `<div class="novedad-respuesta">
                       <strong>Respuesta del supervisor:</strong>
                       ${escaparHTML(n.comentario_supervisor)}
                   </div>`
                : "";

            return `
                <div class="novedad-item">
                    <div class="novedad-top">
                        <h3>${n.es_incapacidad ? "🩺" : "📝"} ${escaparHTML(n.tipo_novedad)}</h3>
                        <span class="badge-estado ${claseEstado(n.estado)}">${escaparHTML(n.estado)}</span>
                    </div>
                    ${rango}
                    <p>${escaparHTML(n.descripcion)}</p>
                    ${respuesta}
                    <div class="novedad-meta">Enviada: ${formatearFecha(n.fecha_envio) || "ahora"}</div>
                </div>
            `;
        }).join("");

    }, (error) => {
        console.error("Error escuchando novedades:", error);
        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se pudieron cargar las novedades. Revisa las reglas de Firestore.
            </div>`;
    });
}


// =====================================================
// NOTIFICACIONES (TIEMPO REAL)
// =====================================================

let notificacionesActuales = [];

function escucharNotificaciones() {

    const contenedor = $("listaNotificaciones");

    if (!idEmpleado) {
        contenedor.innerHTML = `<div class="mensaje-vacio">No tienes notificaciones.</div>`;
        return;
    }

    const q = query(
        collection(db, COL_NOTIFICACIONES),
        where("id_empleado", "==", idEmpleado)
    );

    onSnapshot(q, (snap) => {

        notificacionesActuales = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha));

        const sinLeer = notificacionesActuales.filter(n => !n.leida).length;

        $("totalNotificaciones").textContent = notificacionesActuales.length;

        const contador = $("contadorNotificaciones");
        contador.textContent = sinLeer;
        contador.classList.toggle("oculto", sinLeer === 0);

        if (notificacionesActuales.length === 0) {
            contenedor.innerHTML = `<div class="mensaje-vacio">No tienes notificaciones.</div>`;
            return;
        }

        contenedor.innerHTML = notificacionesActuales.map(n => `
            <div class="notificacion ${n.leida ? "" : "nueva"}">
                <div class="icono-notificacion" aria-hidden="true">🔔</div>
                <div class="notificacion-texto">
                    <strong>${escaparHTML(n.titulo || "Notificación")}${n.leida ? "" : ' <span class="gx-badge gx-b-aviso">Nueva</span>'}</strong>
                    <p>${escaparHTML(n.mensaje || "")}</p>
                    <small>${formatearFecha(n.fecha)}</small>
                </div>
            </div>
        `).join("");

        // Si la sección está abierta, se marcan leídas al instante
        if ($("notificaciones").classList.contains("activa")) {
            marcarNotificacionesLeidas();
        }

    }, (error) => {
        console.error("Error escuchando notificaciones:", error);
        contenedor.innerHTML = `<div class="mensaje-error">No se pudieron cargar las notificaciones.</div>`;
    });
}

async function marcarNotificacionesLeidas() {
    const pendientes = notificacionesActuales.filter(n => !n.leida);
    for (const n of pendientes) {
        try {
            await updateDoc(doc(db, COL_NOTIFICACIONES, n.id), { leida: true });
        } catch (e) {
            console.error("No se pudo marcar como leída:", e);
        }
    }
}


// =====================================================
// SERVICIOS Y HORARIOS (API SPRING BOOT - OPCIONAL)
// =====================================================

async function obtenerDatos(endpoint) {
    const respuesta = await fetch(`${API_BASE}${endpoint}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
}

// ---------- utilidades de hora ----------

function hoyISO() {
    const h = new Date();
    h.setMinutes(h.getMinutes() - h.getTimezoneOffset());
    return h.toISOString().slice(0, 10);
}

function formatearHora(valor) {
    if (!valor) return "-";
    const m = String(valor).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return escaparHTML(valor);
    const h = Number(m[1]);
    return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h >= 12 ? "p. m." : "a. m."}`;
}

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function diaSemana(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return DIAS_SEMANA[new Date(a, m - 1, d).getDay()];
}

const COLOR_ESTADO = {
    "Pendiente": "aviso",
    "Aprobado": "azul",
    "Entregado": "ok",
    "Rechazado": "rojo"
};


// =====================================================
// MIS SERVICIOS  (asignados por el supervisor + API)
// =====================================================

let asignaciones = [];      // los asigna el supervisor (Firestore, en vivo)
let serviciosApi = [];      // los que vengan del servidor Spring Boot
let apiServiciosFallo = false;

function escucharAsignaciones() {

    if (!idEmpleado) return;

    const q = query(
        collection(db, COL_ASIGNACIONES),
        where("id_empleado", "==", idEmpleado)
    );

    let primera = true;

    onSnapshot(q, (snap) => {

        if (!primera) {
            snap.docChanges().forEach(cambio => {
                if (cambio.type === "added" && !cambio.doc.metadata.hasPendingWrites) {
                    mostrarMensaje(`🧹 Nuevo servicio: ${cambio.doc.data().servicio}`, "exito");
                }
            });
        }
        primera = false;

        asignaciones = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        $("cargandoServicios").style.display = "none";
        pintarServicios();
        llenarServiciosPedido();

    }, (error) => {
        console.error("Error escuchando servicios asignados:", error);
        $("cargandoServicios").style.display = "none";
    });
}

function pintarServicios() {

    const contenedor = $("listaServicios");

    $("totalServicios").textContent = asignaciones.length + serviciosApi.length;

    if (asignaciones.length === 0 && serviciosApi.length === 0) {
        contenedor.innerHTML = `
            <div class="mensaje-vacio">
                No tienes servicios asignados.
                ${apiServiciosFallo ? "<br><small>(El servidor de servicios no está conectado.)</small>" : ""}
            </div>`;
        return;
    }

    const terminado = (a) => a.estado === "Completado" || a.estado === "Cancelado";

    const ordenadas = [...asignaciones].sort((a, b) => {
        if (terminado(a) !== terminado(b)) return terminado(a) ? 1 : -1;
        return `${a.fecha || ""} ${a.hora || ""}`.localeCompare(`${b.fecha || ""} ${b.hora || ""}`);
    });

    const tarjetasAsignadas = ordenadas.map(a => {

        let accion = "";
        if (a.estado === "Asignado") {
            accion = `<button type="button" class="gx-btn gx-btn-mini gx-btn-prim" data-id="${a.id}" data-estado="En curso">▶ Empezar servicio</button>`;
        } else if (a.estado === "En curso") {
            accion = `<button type="button" class="gx-btn gx-btn-mini gx-btn-prim" data-id="${a.id}" data-estado="Completado">✔ Marcar como completado</button>`;
        }

        return `
            <div class="tarjeta-servicio">
                <h3>🧹 ${escaparHTML(a.servicio)}</h3>
                <p><strong>Fecha:</strong> ${formatearDia(a.fecha)}${a.hora ? " · " + formatearHora(a.hora) : ""}</p>
                <p><strong>Ubicación:</strong> ${escaparHTML(a.direccion || "No especificada")}</p>
                ${a.cliente ? `<p><strong>Cliente:</strong> ${escaparHTML(a.cliente)}</p>` : ""}
                ${a.descripcion ? `<p><strong>Instrucciones:</strong> ${escaparHTML(a.descripcion)}</p>` : ""}
                <span class="estado">${escaparHTML(a.estado || "Asignado")}</span>
                ${accion ? `<div style="margin-top:12px">${accion}</div>` : ""}
            </div>`;
    }).join("");

    const tarjetasApi = serviciosApi.map(s => `
        <div class="tarjeta-servicio">
            <h3>🧹 ${escaparHTML(s.nombre_servicio || s.nombre || "Servicio")}</h3>
            <p><strong>Fecha:</strong> ${escaparHTML(s.fecha || s.fecha_servicio || "No especificada")}</p>
            <p><strong>Ubicación:</strong> ${escaparHTML(s.ubicacion || s.direccion || "No especificada")}</p>
            <span class="estado">${escaparHTML(s.estado || "Pendiente")}</span>
        </div>`).join("");

    contenedor.innerHTML = tarjetasAsignadas + tarjetasApi;
}

async function cambiarEstadoServicio(id, estado) {

    try {
        await updateDoc(doc(db, COL_ASIGNACIONES, id), {
            estado,
            fecha_actualizacion: serverTimestamp()
        });
        mostrarMensaje(
            estado === "Completado" ? "Servicio completado. ¡Buen trabajo!" : "Servicio en curso.",
            "exito"
        );
    } catch (error) {
        console.error("Error cambiando estado del servicio:", error);
        mostrarMensaje("No se pudo actualizar el servicio.", "error");
    }
}

async function cargarServicios() {

    const cargando = $("cargandoServicios");

    cargando.style.display = "flex";

    try {
        const servicios = await obtenerDatos(`/servicios/empleado/${idEmpleado}`);
        serviciosApi = Array.isArray(servicios) ? servicios : [];
        apiServiciosFallo = false;
    } catch (error) {
        serviciosApi = [];
        apiServiciosFallo = true;
    }

    cargando.style.display = "none";
    pintarServicios();
}


// =====================================================
// PEDIR PRODUCTOS AL SUPERVISOR
// =====================================================

let inventario = [];

function escucharInventario() {

    onSnapshot(collection(db, COL_INVENTARIO), (snap) => {

        inventario = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

        $("notaInventario").textContent = inventario.length === 0
            ? "El supervisor aún no ha registrado productos. Puedes pedir uno escribiéndolo en «Otro»."
            : "Entre paréntesis ves cuántas unidades hay en bodega.";

        refrescarSelectsProducto();

    }, (error) => {
        console.error("Error leyendo el inventario:", error);
        $("notaInventario").textContent = "No se pudo cargar la lista de productos. Puedes escribirlo en «Otro».";
    });
}

function opcionesProductos() {
    return `<option value="">Elige un producto...</option>` +
        inventario.map(p => {
            const agotado = Number(p.cantidad || 0) <= 0;
            return `<option value="${escaparHTML(p.id)}">${escaparHTML(p.nombre)} (${agotado ? "agotado" : "hay " + p.cantidad + " " + (p.unidad || "")})</option>`;
        }).join("") +
        `<option value="__otro">Otro (no está en la lista)...</option>`;
}

function refrescarSelectsProducto() {
    document.querySelectorAll("#pedidoItems .pi-prod").forEach(sel => {
        const actual = sel.value;
        sel.innerHTML = opcionesProductos();
        if ([...sel.options].some(o => o.value === actual)) sel.value = actual;
    });
}

function agregarFilaProducto() {

    const fila = document.createElement("div");
    fila.className = "gx-fila-producto";
    fila.innerHTML = `
        <select class="pi-prod" aria-label="Producto">${opcionesProductos()}</select>
        <input type="number" class="pi-cant" min="1" step="any" value="1" aria-label="Cantidad">
        <button type="button" class="gx-btn gx-btn-mini gx-btn-peligro pi-quitar" aria-label="Quitar producto">✕</button>
        <input type="text" class="pi-otro gx-oculto" maxlength="80" placeholder="¿Qué producto necesitas?" aria-label="Otro producto">
    `;

    $("pedidoItems").appendChild(fila);
}

function llenarServiciosPedido() {

    const sel = $("pedidoServicio");
    if (!sel) return;

    const actual = sel.value;

    const activos = asignaciones
        .filter(a => a.estado !== "Completado" && a.estado !== "Cancelado")
        .sort((a, b) => String(a.fecha || "").localeCompare(String(b.fecha || "")));

    sel.innerHTML = `<option value="">Sin servicio específico</option>` +
        activos.map(a => `<option value="${escaparHTML(a.id)}">${escaparHTML(a.servicio)} · ${formatearDia(a.fecha)}</option>`).join("");

    if ([...sel.options].some(o => o.value === actual)) sel.value = actual;
}

function configurarPedidos() {

    agregarFilaProducto();

    const contenedor = $("pedidoItems");

    $("btnAgregarProducto").addEventListener("click", agregarFilaProducto);

    contenedor.addEventListener("change", (e) => {
        if (e.target.classList.contains("pi-prod")) {
            const otro = e.target.closest(".gx-fila-producto").querySelector(".pi-otro");
            otro.classList.toggle("gx-oculto", e.target.value !== "__otro");
            if (e.target.value === "__otro") otro.focus();
        }
    });

    contenedor.addEventListener("click", (e) => {
        if (!e.target.closest(".pi-quitar")) return;

        const filas = contenedor.querySelectorAll(".gx-fila-producto");
        const fila = e.target.closest(".gx-fila-producto");

        if (filas.length === 1) {
            // Si es la única fila, solo se limpia
            fila.querySelector(".pi-prod").value = "";
            fila.querySelector(".pi-cant").value = 1;
            fila.querySelector(".pi-otro").value = "";
            fila.querySelector(".pi-otro").classList.add("gx-oculto");
        } else {
            fila.remove();
        }
    });

    $("formPedido").addEventListener("submit", enviarPedido);
}

async function enviarPedido(event) {

    event.preventDefault();

    if (!idEmpleado) {
        mostrarMensaje("No se encontró tu ID. Vuelve a iniciar sesión.", "error");
        return;
    }

    const items = [];

    for (const fila of document.querySelectorAll("#pedidoItems .gx-fila-producto")) {

        const seleccion = fila.querySelector(".pi-prod").value;
        const cantidad = Number(fila.querySelector(".pi-cant").value);

        if (!seleccion) continue;     // fila vacía

        if (isNaN(cantidad) || cantidad <= 0) {
            mostrarMensaje("Revisa las cantidades: deben ser mayores a 0.", "error");
            return;
        }

        if (seleccion === "__otro") {
            const nombre = fila.querySelector(".pi-otro").value.trim();
            if (!nombre) {
                mostrarMensaje("Escribe el nombre del producto en «Otro».", "error");
                return;
            }
            items.push({ id_producto: null, nombre, cantidad, unidad: "" });
        } else {
            const prod = inventario.find(p => p.id === seleccion);
            if (!prod) continue;
            items.push({ id_producto: prod.id, nombre: prod.nombre, cantidad, unidad: prod.unidad || "" });
        }
    }

    if (items.length === 0) {
        mostrarMensaje("Elige al menos un producto.", "error");
        return;
    }

    const idServicio = $("pedidoServicio").value;
    const servicio = asignaciones.find(a => a.id === idServicio);

    const boton = $("btnEnviarPedido");
    boton.disabled = true;
    boton.textContent = "Enviando...";

    try {
        await addDoc(collection(db, COL_PEDIDOS), {
            id_empleado: idEmpleado,
            nombre_empleado: nombreEmpleado,
            id_asignacion: servicio ? servicio.id : null,
            servicio: servicio ? servicio.servicio : "",
            items,
            nota: $("pedidoNota").value.trim(),
            estado: "Pendiente",
            comentario_supervisor: "",
            descontado: false,
            fecha_envio: serverTimestamp(),
            fecha_actualizacion: serverTimestamp()
        });

        mostrarMensaje("Pedido enviado al supervisor.", "exito");

        $("formPedido").reset();
        $("pedidoItems").innerHTML = "";
        agregarFilaProducto();

    } catch (error) {
        console.error("Error enviando pedido:", error);
        mostrarMensaje("No se pudo enviar. Revisa tu conexión y las reglas de Firestore.", "error");
    } finally {
        boton.disabled = false;
        boton.textContent = "📤 Enviar pedido";
    }
}

function escucharPedidos() {

    const contenedor = $("listaPedidos");

    if (!idEmpleado) return;

    const q = query(
        collection(db, COL_PEDIDOS),
        where("id_empleado", "==", idEmpleado)
    );

    onSnapshot(q, (snap) => {

        const lista = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => milisegundos(b.fecha_envio) - milisegundos(a.fecha_envio));

        if (lista.length === 0) {
            contenedor.innerHTML = `<div class="mensaje-vacio">No has pedido productos todavía.</div>`;
            return;
        }

        contenedor.innerHTML = `<div class="gx-lista">` + lista.map(p => `
            <article class="gx-item ${p.estado === "Entregado" ? "ok" : ""}">
                <div class="gx-item-cab">
                    <div>
                        <h3>🧰 ${p.servicio ? escaparHTML(p.servicio) : "Pedido general"}</h3>
                        <small>Enviado: ${formatearFecha(p.fecha_envio) || "ahora"}</small>
                    </div>
                    <span class="gx-badge gx-b-${COLOR_ESTADO[p.estado] || "gris"}">${escaparHTML(p.estado)}</span>
                </div>

                <ul class="gx-productos">
                    ${(p.items || []).map(i => `
                        <li><span><strong>${escaparHTML(i.cantidad)}</strong> ${escaparHTML(i.unidad || "")} · ${escaparHTML(i.nombre)}</span></li>`).join("")}
                </ul>

                ${p.nota ? `<p class="gx-texto">💬 ${escaparHTML(p.nota)}</p>` : ""}

                ${p.comentario_supervisor
                    ? `<div class="gx-respuesta"><strong>Respuesta del supervisor:</strong> ${escaparHTML(p.comentario_supervisor)}</div>`
                    : ""}
            </article>`).join("") + `</div>`;

    }, (error) => {
        console.error("Error escuchando pedidos:", error);
        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se pudieron cargar tus pedidos. Revisa las reglas de Firestore.
            </div>`;
    });
}


// =====================================================
// MI HORARIO  (lo pone el supervisor + API)
// =====================================================

let horariosFs = [];
let horariosApi = [];
let apiHorariosFallo = false;
let errorHorariosFs = false;

function escucharHorarios() {

    if (!idEmpleado) return;

    const q = query(
        collection(db, COL_HORARIOS),
        where("id_empleado", "==", idEmpleado)
    );

    let primera = true;

    onSnapshot(q, (snap) => {

        if (!primera) {
            snap.docChanges().forEach(cambio => {
                if (!cambio.doc.metadata.hasPendingWrites && (cambio.type === "added" || cambio.type === "modified")) {
                    mostrarMensaje("🕐 El supervisor actualizó tu horario.", "exito");
                }
            });
        }
        primera = false;

        errorHorariosFs = false;
        horariosFs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        pintarHorarios();

    }, (error) => {
        console.error("Error escuchando horarios:", error);
        errorHorariosFs = true;
        pintarHorarios();
    });
}

function pintarHorarios() {

    const tabla = $("tablaHorarios");
    const hoy = hoyISO();

    const filas = [
        ...horariosFs.map(h => ({
            fecha: h.fecha,
            inicio: h.hora_inicio,
            fin: h.hora_fin,
            turno: h.turno,
            nota: h.nota,
            estado: h.estado
        })),
        ...horariosApi.map(h => ({
            fecha: String(h.fecha || h.fecha_asignado || "").slice(0, 10),
            inicio: h.hora_inicio || h.horaInicio,
            fin: h.hora_fin || h.horaFin,
            turno: h.turno,
            nota: "",
            estado: h.estado || "Programado"
        }))
    ];

    const esISO = (f) => /^\d{4}-\d{2}-\d{2}$/.test(f || "");

    const proximos = filas.filter(f => !esISO(f.fecha) || f.fecha >= hoy)
        .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const pasados = filas.filter(f => esISO(f.fecha) && f.fecha < hoy)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

    $("totalHorarios").textContent = proximos.length;

    // Turno de hoy en el inicio
    const deHoy = filas.filter(f => f.fecha === hoy);
    $("inicioTurnoHoy").textContent = deHoy.length
        ? deHoy.map(f => `${formatearHora(f.inicio)} - ${formatearHora(f.fin)}`).join(" / ")
        : "Sin turno";

    if (filas.length === 0) {
        tabla.innerHTML = `
            <tr><td colspan="6">
                ${errorHorariosFs
                    ? "No se pudieron cargar tus horarios. Revisa las reglas de Firestore."
                    : "Aún no tienes horarios. Cuando el supervisor te asigne uno, aparecerá aquí."}
            </td></tr>`;
        return;
    }

    const pintarFila = (f, clase) => {
        const iso = esISO(f.fecha);
        const estado = !iso ? (f.estado || "Programado")
            : f.fecha === hoy ? "Hoy"
            : f.fecha < hoy ? "Finalizado" : "Programado";

        return `
            <tr class="${clase}">
                <td>${iso ? `${diaSemana(f.fecha)} ${formatearDia(f.fecha)}` : escaparHTML(f.fecha || "-")}</td>
                <td>${formatearHora(f.inicio)}</td>
                <td>${formatearHora(f.fin)}</td>
                <td>${escaparHTML(f.turno || "-")}</td>
                <td>${escaparHTML(f.nota || "-")}</td>
                <td>${escaparHTML(estado)}</td>
            </tr>`;
    };

    tabla.innerHTML =
        proximos.map(f => pintarFila(f, f.fecha === hoy ? "fila-hoy" : "")).join("") +
        pasados.map(f => pintarFila(f, "fila-pasada")).join("");
}

async function cargarHorarios() {

    try {
        const horarios = await obtenerDatos(`/horarios/empleado/${idEmpleado}`);
        horariosApi = Array.isArray(horarios) ? horarios : [];
        apiHorariosFallo = false;
    } catch (error) {
        horariosApi = [];
        apiHorariosFallo = true;
    }

    pintarHorarios();
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

async function cerrarSesion() {

    try {
        if (sesion.id) {
            await update(ref(rtdb, "usuarios/" + sesion.id), { online: false });
        }
    } catch (e) {
        console.warn("No se pudo marcar offline:", e);
    }

    [
        "usuarioLogueado",
        "usuario",
        "cargo",
        "id_empleado",
        "nombre_empleado",
        "nombreEmpleado"
    ].forEach(k => localStorage.removeItem(k));

    window.location.href = "../inicio de sistema/login.html";
}


// =====================================================
// INICIO
// =====================================================

mostrarDatosEmpleado();
configurarMenu();
configurarFormulario();

// Perfil: foto, datos personales y contraseña (FIREBASE/perfil.js)
montarPerfil({
    alGuardar: (nueva) => {
        nombreEmpleado =
            nueva.nombre_empleado || nueva.nombre_completo || nueva.nombre || nombreEmpleado;
        mostrarDatosEmpleado();
        mostrarMensaje("Perfil actualizado.", "exito");
    }
});

escucharNovedades();
escucharNotificaciones();

// Lo que pone el supervisor (en vivo)
configurarPedidos();
escucharAsignaciones();
escucharInventario();
escucharPedidos();
escucharHorarios();

// Datos extra del servidor Spring Boot (si está encendido)
if (idEmpleado) {
    cargarServicios();
    cargarHorarios();
}

$("btnActualizarServicios").addEventListener("click", cargarServicios);
$("btnActualizarHorarios").addEventListener("click", cargarHorarios);
$("cerrarSesion").addEventListener("click", cerrarSesion);

$("listaServicios").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-estado][data-id]");
    if (btn) cambiarEstadoServicio(btn.dataset.id, btn.dataset.estado);
});
