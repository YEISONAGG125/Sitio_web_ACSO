// =====================================================
// PANEL DEL SUPERVISOR
// - Novedades / incapacidades -> Cloud Firestore (tiempo real)
// - Personal                  -> Realtime Database (usuarios)
// - Contratos, clientes y productos -> API Spring Boot (opcional)
// =====================================================

import {
    db,
    rtdb,
    ref,
    onValue,
    update,
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    COL_NOVEDADES,
    COL_NOTIFICACIONES,
    COL_SOLICITUDES
} from "../FIREBASE/firebase.js";


const API_BASE = "http://localhost:8080/api";


// =====================================================
// SESIÓN
// =====================================================

function leerSesion() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogueado")) || {};
    } catch {
        return {};
    }
}

const sesion = leerSesion();

if (String(localStorage.getItem("cargo") || "").toLowerCase() !== "supervisor") {
    alert("Acceso denegado");
    window.location.href = "../inicio de sistema/login.html";
}

const nombreSupervisor =
    sesion.nombre_completo || sesion.nombre || sesion.usuario || "Supervisor";


// =====================================================
// UTILIDADES
// =====================================================

const $ = (id) => document.getElementById(id);

function esc(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
}

function ms(valor) {
    if (!valor) return 0;
    return valor.toMillis ? valor.toMillis() : new Date(valor).getTime();
}

function formatearFecha(valor) {
    if (!valor) return "ahora";
    const f = valor.toDate ? valor.toDate() : new Date(valor);
    if (isNaN(f)) return "";
    return f.toLocaleString("es-CO", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function formatearDia(iso) {
    if (!iso) return "-";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function claseEstado(estado) {
    return "estado-" + String(estado || "Pendiente")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

function actualizarContador(id, valor) {
    const el = $(id);
    if (el) el.textContent = valor;
}

function mostrarToast(texto) {
    const t = $("toast");
    t.textContent = texto;
    t.classList.add("mostrar");
    clearTimeout(mostrarToast.t);
    mostrarToast.t = setTimeout(() => t.classList.remove("mostrar"), 4500);
}

function ponerBadge(id, cantidad) {
    const b = $(id);
    if (!b) return;
    b.textContent = cantidad;
    b.classList.toggle("oculto", cantidad === 0);
}


// =====================================================
// CAMBIAR DE SECCIÓN
// =====================================================

window.mostrar = function (id, elemento) {

    document.querySelectorAll(".contenido").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    $(id)?.classList.add("active");
    elemento?.classList.add("active");

    if (id === "Personal") cargarPersonal();
    if (id === "Inventario") cargarProductos();
    if (id === "Contratos") cargarContratos();
    if (id === "Clientes") cargarClientes();
};


// =====================================================
// NOVEDADES E INCAPACIDADES (FIRESTORE EN TIEMPO REAL)
// =====================================================

const ESTADOS = ["Pendiente", "Visto", "En revisión", "Aprobada", "Rechazada"];

let novedades = [];
let primeraCarga = true;
const borradores = {};               // comentarios a medio escribir
let filtroEstado = "";

function escucharNovedades() {

    const q = query(
        collection(db, COL_NOVEDADES),
        orderBy("fecha_envio", "desc")
    );

    onSnapshot(q, (snap) => {

        // Aviso en vivo cuando llega una nueva (no en la primera carga)
        if (!primeraCarga) {
            snap.docChanges().forEach(cambio => {
                if (cambio.type === "added" && !cambio.doc.metadata.hasPendingWrites) {
                    const n = cambio.doc.data();
                    mostrarToast(
                        `🔔 Nueva ${n.es_incapacidad ? "incapacidad" : "novedad"} de ${n.nombre_empleado || "un empleado"}`
                    );
                }
            });
        }
        primeraCarga = false;

        novedades = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        pintarContadores();
        pintarNovedades();
        pintarNotificaciones();

    }, (error) => {
        console.error("Error Firestore:", error);
        $("listaNovedadesSup").innerHTML = `
            <div class="vacio error">
                ❌ No se pudieron cargar las novedades.
                Revisa las reglas de Firestore (archivo firestore.rules).
            </div>`;
    });
}

function pintarContadores() {

    const cuenta = (e) => novedades.filter(n => n.estado === e).length;
    const pendientes = cuenta("Pendiente");

    actualizarContador("cntTodas", novedades.length);
    actualizarContador("cntPendiente", pendientes);
    actualizarContador("cntVisto", cuenta("Visto"));
    actualizarContador("cntRevision", cuenta("En revisión"));
    actualizarContador("cntAprobada", cuenta("Aprobada"));
    actualizarContador("cntRechazada", cuenta("Rechazada"));

    actualizarContador("totalNovedades", novedades.length);

    actualizarBadges();
}

// Contadores rojos del menú (novedades + solicitudes pendientes)
function actualizarBadges() {

    const pendNov = novedades.filter(n => n.estado === "Pendiente").length;
    const pendSol = solicitudes.filter(s => s.estado === "Pendiente").length;

    ponerBadge("badgeNovedades", pendNov);
    ponerBadge("badgeSolicitudes", pendSol);
    ponerBadge("badgeNotificaciones", pendNov + pendSol);
}

function pintarNovedades() {

    const lista = $("listaNovedadesSup");

    const texto = $("buscarNovedad").value.trim().toLowerCase();
    const tipo = $("filtroTipo").value;

    const filtradas = novedades.filter(n => {
        if (filtroEstado && n.estado !== filtroEstado) return false;
        if (tipo && n.tipo_novedad !== tipo) return false;
        if (texto) {
            const pajar = `${n.nombre_empleado} ${n.descripcion} ${n.tipo_novedad} ${n.id_empleado}`.toLowerCase();
            if (!pajar.includes(texto)) return false;
        }
        return true;
    });

    // Conservar foco / cursor si el supervisor está escribiendo
    const activo = document.activeElement;
    const enfoque = activo && activo.classList?.contains("comentario-input") && lista.contains(activo)
        ? { id: activo.dataset.id, pos: activo.selectionStart }
        : null;

    if (filtradas.length === 0) {
        lista.innerHTML = `<div class="vacio">No hay novedades con esos filtros.</div>`;
        return;
    }

    lista.innerHTML = filtradas.map(n => {

        const incapacidad = n.es_incapacidad
            ? `<div class="datos-incapacidad">
                   <span>📅 ${formatearDia(n.fecha_inicio)} → ${formatearDia(n.fecha_fin)}</span>
                   <span><b>${n.dias_incapacidad ?? "-"}</b> ${n.dias_incapacidad === 1 ? "día" : "días"}</span>
                   ${n.entidad ? `<span>🏥 ${esc(n.entidad)}</span>` : ""}
               </div>`
            : "";

        const comentario = borradores[n.id] ?? n.comentario_supervisor ?? "";

        const botones = ESTADOS.map(e => `
            <button type="button"
                class="btn-estado ${claseEstado(e)} ${n.estado === e ? "actual" : ""}"
                data-id="${n.id}" data-estado="${e}">
                ${e}
            </button>`).join("");

        return `
            <article class="novedad-card ${n.es_incapacidad ? "es-incapacidad" : ""} ${n.estado === "Pendiente" ? "sin-revisar" : ""}">

                <div class="novedad-cabecera">
                    <div class="novedad-quien">
                        <div class="avatar-mini">${esc((n.nombre_empleado || "?").charAt(0).toUpperCase())}</div>
                        <div>
                            <strong>${esc(n.nombre_empleado || "Empleado")}</strong>
                            <small>ID ${esc(n.id_empleado)} · ${formatearFecha(n.fecha_envio)}</small>
                        </div>
                    </div>

                    <div class="novedad-etiquetas">
                        <span class="tipo-pill">${n.es_incapacidad ? "🩺" : "📝"} ${esc(n.tipo_novedad)}</span>
                        <span class="badge-estado ${claseEstado(n.estado)}">${esc(n.estado)}</span>
                    </div>
                </div>

                ${incapacidad}

                <p class="novedad-texto">${esc(n.descripcion)}</p>

                <textarea class="comentario-input"
                    data-id="${n.id}"
                    rows="2"
                    placeholder="Respuesta o comentario para el empleado (opcional)...">${esc(comentario)}</textarea>

                <div class="acciones-estado">
                    <span class="acciones-label">Marcar como:</span>
                    ${botones}
                </div>

            </article>`;
    }).join("");

    if (enfoque) {
        const el = lista.querySelector(`.comentario-input[data-id="${enfoque.id}"]`);
        if (el) {
            el.focus();
            el.setSelectionRange(enfoque.pos, enfoque.pos);
        }
    }
}

// Cambiar estado (delegación de eventos)
async function cambiarEstado(idDoc, nuevoEstado) {

    const n = novedades.find(x => x.id === idDoc);
    if (!n) return;

    const comentario = (borradores[idDoc] ?? n.comentario_supervisor ?? "").trim();

    if (n.estado === nuevoEstado && comentario === (n.comentario_supervisor || "")) {
        return;
    }

    try {
        await updateDoc(doc(db, COL_NOVEDADES, idDoc), {
            estado: nuevoEstado,
            comentario_supervisor: comentario,
            revisado_por: nombreSupervisor,
            fecha_actualizacion: serverTimestamp()
        });

        delete borradores[idDoc];

        // Notificar al empleado
        if (n.estado !== nuevoEstado) {
            await addDoc(collection(db, COL_NOTIFICACIONES), {
                id_empleado: String(n.id_empleado),
                id_novedad: idDoc,
                titulo: `Tu ${n.es_incapacidad ? "incapacidad" : "novedad"} está: ${nuevoEstado}`,
                mensaje: comentario
                    ? `${n.tipo_novedad}: ${comentario}`
                    : `El supervisor marcó tu novedad "${n.tipo_novedad}" como ${nuevoEstado}.`,
                leida: false,
                fecha: serverTimestamp()
            });
        }

        mostrarToast(`✅ Marcada como ${nuevoEstado}`);

    } catch (error) {
        console.error("Error cambiando estado:", error);
        mostrarToast("❌ No se pudo actualizar. Revisa las reglas de Firestore.");
    }
}

function configurarNovedades() {

    const lista = $("listaNovedadesSup");

    lista.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-estado");
        if (btn) cambiarEstado(btn.dataset.id, btn.dataset.estado);
    });

    lista.addEventListener("input", (e) => {
        if (e.target.classList.contains("comentario-input")) {
            borradores[e.target.dataset.id] = e.target.value;
        }
    });

    $("chipsEstado").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        document.querySelectorAll("#chipsEstado .chip").forEach(c => c.classList.remove("activo"));
        chip.classList.add("activo");
        filtroEstado = chip.dataset.estado;
        pintarNovedades();
    });

    $("buscarNovedad").addEventListener("input", pintarNovedades);
    $("filtroTipo").addEventListener("change", pintarNovedades);
}


// =====================================================
// NOTIFICACIONES DEL SUPERVISOR
// =====================================================

function pintarNotificaciones() {

    const lista = $("listaNotificaciones");

    const items = [
        ...novedades.map(n => ({ ...n, kind: "novedad" })),
        ...solicitudes.map(s => ({ ...s, kind: "solicitud" }))
    ]
        .sort((a, b) => ms(b.fecha_envio) - ms(a.fecha_envio))
        .slice(0, 30);

    if (items.length === 0) {
        lista.innerHTML = `<div class="vacio">No hay notificaciones por ahora.</div>`;
        return;
    }

    lista.innerHTML = items.map(n => {

        let icono, titulo, detalle, quien;

        if (n.kind === "novedad") {
            icono = n.es_incapacidad ? "🩺" : "🔔";
            quien = n.nombre_empleado || "empleado";
            titulo = `${n.es_incapacidad ? "Incapacidad" : "Novedad"} de ${esc(quien)}`;
            detalle = `${esc(n.tipo_novedad)}${n.es_incapacidad && n.dias_incapacidad ? ` · ${n.dias_incapacidad} día(s)` : ""}: ${esc((n.descripcion || "").slice(0, 140))}${(n.descripcion || "").length > 140 ? "…" : ""}`;
        } else {
            icono = n.tipo === "Contrato" ? "📄" : "🧹";
            quien = n.nombre_cliente || "cliente";
            titulo = `Solicitud de ${n.tipo === "Contrato" ? "contrato" : "servicio"} de ${esc(quien)}`;
            detalle = `${esc(n.servicio)} · ${esc(n.direccion)}`;
        }

        return `
            <div class="notificacion ${n.estado === "Pendiente" ? "nueva" : ""}">
                <div class="icono-notificacion">${icono}</div>
                <div class="notificacion-texto">
                    <strong>
                        ${titulo}
                        <span class="badge-estado ${claseEstado(n.estado)}">${esc(n.estado)}</span>
                    </strong>
                    <p>${detalle}</p>
                    <small>${formatearFecha(n.fecha_envio)}</small>
                </div>
                <button type="button" class="btn-ver" data-ir="${n.kind}">Ver</button>
            </div>`;
    }).join("");
}

function configurarNotificaciones() {
    $("listaNotificaciones").addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-ver");
        if (!btn) return;

        if (btn.dataset.ir === "solicitud") {
            window.mostrar("Solicitudes", $("tabSolicitudes"));
        } else {
            window.mostrar("NovedadLaboral", $("tabNovedades"));
        }
    });
}


// =====================================================
// SOLICITUDES DE CLIENTES (CONTRATOS Y SERVICIOS)
// =====================================================

let solicitudes = [];
let primeraCargaSol = true;
let filtroEstadoSol = "";
const valoresBorrador = {};          // valores de contrato a medio escribir

function escucharSolicitudes() {

    const q = query(
        collection(db, COL_SOLICITUDES),
        orderBy("fecha_envio", "desc")
    );

    onSnapshot(q, (snap) => {

        if (!primeraCargaSol) {
            snap.docChanges().forEach(cambio => {
                if (cambio.type === "added" && !cambio.doc.metadata.hasPendingWrites) {
                    const s = cambio.doc.data();
                    mostrarToast(
                        `📑 Nueva solicitud de ${s.tipo === "Contrato" ? "contrato" : "servicio"} de ${s.nombre_cliente || "un cliente"}`
                    );
                }
            });
        }
        primeraCargaSol = false;

        solicitudes = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        pintarContadoresSol();
        pintarSolicitudes();
        pintarNotificaciones();

    }, (error) => {
        console.error("Error Firestore (solicitudes):", error);
        $("listaSolicitudesSup").innerHTML = `
            <div class="vacio error">
                ❌ No se pudieron cargar las solicitudes.
                Revisa las reglas de Firestore (archivo firestore.rules).
            </div>`;
    });
}

function pintarContadoresSol() {

    const cuenta = (e) => solicitudes.filter(s => s.estado === e).length;

    actualizarContador("cntSolTodas", solicitudes.length);
    actualizarContador("cntSolPendiente", cuenta("Pendiente"));
    actualizarContador("cntSolVisto", cuenta("Visto"));
    actualizarContador("cntSolRevision", cuenta("En revisión"));
    actualizarContador("cntSolAprobada", cuenta("Aprobada"));
    actualizarContador("cntSolRechazada", cuenta("Rechazada"));

    actualizarContador("totalSolicitudes", solicitudes.length);

    actualizarBadges();
}

function pintarSolicitudes() {

    const lista = $("listaSolicitudesSup");

    const texto = $("buscarSolicitud").value.trim().toLowerCase();
    const tipo = $("filtroTipoSol").value;

    const filtradas = solicitudes.filter(s => {
        if (filtroEstadoSol && s.estado !== filtroEstadoSol) return false;
        if (tipo && s.tipo !== tipo) return false;
        if (texto) {
            const pajar = `${s.nombre_cliente} ${s.direccion} ${s.servicio} ${s.descripcion} ${s.id_cliente}`.toLowerCase();
            if (!pajar.includes(texto)) return false;
        }
        return true;
    });

    const activo = document.activeElement;
    const enfoque = activo && activo.classList?.contains("comentario-input") && lista.contains(activo)
        ? { id: activo.dataset.id, pos: activo.selectionStart }
        : null;

    const enfoqueValor = activo && activo.classList?.contains("valor-input") && lista.contains(activo)
        ? activo.dataset.id
        : null;

    if (filtradas.length === 0) {
        lista.innerHTML = `<div class="vacio">No hay solicitudes con esos filtros.</div>`;
        return;
    }

    lista.innerHTML = filtradas.map(s => {

        const esContrato = s.tipo === "Contrato";

        const datos = esContrato
            ? `<div class="datos-incapacidad">
                   <span>🧹 ${esc(s.servicio)}</span>
                   <span>🔁 ${esc(s.frecuencia)}</span>
                   <span>📅 Inicio: ${formatearDia(s.fecha_inicio)}</span>
                   <span>⏳ <b>${esc(s.duracion_meses)}</b> meses</span>
                   ${s.area_m2 ? `<span>📐 ${esc(s.area_m2)} m²</span>` : ""}
               </div>`
            : `<div class="datos-incapacidad">
                   <span>🧹 ${esc(s.servicio)}</span>
                   <span>📅 ${formatearDia(s.fecha_deseada)}</span>
                   <span>🕐 ${esc(s.jornada)}</span>
               </div>`;

        const comentario = borradores[s.id] ?? s.comentario_supervisor ?? "";

        const botones = ESTADOS.map(e => `
            <button type="button"
                class="btn-estado ${claseEstado(e)} ${s.estado === e ? "actual" : ""}"
                data-id="${s.id}" data-estado="${e}">
                ${e}
            </button>`).join("");

        return `
            <article class="novedad-card ${esContrato ? "es-contrato" : ""} ${s.estado === "Pendiente" ? "sin-revisar" : ""}">

                <div class="novedad-cabecera">
                    <div class="novedad-quien">
                        <div class="avatar-mini">${esc((s.nombre_cliente || "?").charAt(0).toUpperCase())}</div>
                        <div>
                            <strong>${esc(s.nombre_cliente || "Cliente")}</strong>
                            <small>ID ${esc(s.id_cliente)} · ${formatearFecha(s.fecha_envio)}</small>
                        </div>
                    </div>

                    <div class="novedad-etiquetas">
                        <span class="tipo-pill">${esContrato ? "📄 Contrato" : "🧹 Servicio"}</span>
                        <span class="badge-estado ${claseEstado(s.estado)}">${esc(s.estado)}</span>
                    </div>
                </div>

                ${datos}

                <div class="contacto-sol">
                    <span>📍 ${esc(s.direccion)}</span>
                    ${s.telefono ? `<span>📞 ${esc(s.telefono)}</span>` : ""}
                    ${s.correo ? `<span>✉️ ${esc(s.correo)}</span>` : ""}
                </div>

                ${s.descripcion ? `<p class="novedad-texto">${esc(s.descripcion)}</p>` : ""}

                ${esContrato ? `
                <div class="valor-contrato">
                    <label>💰 Valor total del contrato (COP)</label>
                    <input type="number" class="valor-input" data-id="${s.id}" min="0" step="1000"
                        placeholder="Ej: 2500000"
                        value="${esc(valoresBorrador[s.id] ?? s.valor_total ?? "")}">
                </div>` : ""}

                <textarea class="comentario-input"
                    data-id="${s.id}"
                    rows="2"
                    placeholder="Respuesta para el cliente (precio, fecha confirmada, motivo...)">${esc(comentario)}</textarea>

                <div class="acciones-estado">
                    <span class="acciones-label">Marcar como:</span>
                    ${botones}
                </div>

            </article>`;
    }).join("");

    if (enfoque) {
        const el = lista.querySelector(`.comentario-input[data-id="${enfoque.id}"]`);
        if (el) {
            el.focus();
            el.setSelectionRange(enfoque.pos, enfoque.pos);
        }
    }

    if (enfoqueValor) {
        lista.querySelector(`.valor-input[data-id="${enfoqueValor}"]`)?.focus();
    }
}

async function cambiarEstadoSolicitud(idDoc, nuevoEstado) {

    const s = solicitudes.find(x => x.id === idDoc);
    if (!s) return;

    const comentario = (borradores[idDoc] ?? s.comentario_supervisor ?? "").trim();

    const valorPendiente = valoresBorrador[idDoc] !== undefined && valoresBorrador[idDoc] !== ""
        && Number(valoresBorrador[idDoc]) !== Number(s.valor_total || 0);

    if (s.estado === nuevoEstado && comentario === (s.comentario_supervisor || "") && !valorPendiente) {
        return;
    }

    const queEs = s.tipo === "Contrato" ? "contrato" : "servicio";

    const cambios = {
        estado: nuevoEstado,
        comentario_supervisor: comentario,
        revisado_por: nombreSupervisor,
        fecha_actualizacion: serverTimestamp()
    };

    // Valor del contrato (solo contratos y si el supervisor lo escribió)
    const valorTexto = valoresBorrador[idDoc];
    if (s.tipo === "Contrato" && valorTexto !== undefined && valorTexto !== "") {
        const valor = Number(valorTexto);
        if (isNaN(valor) || valor < 0) {
            mostrarToast("❌ El valor del contrato no es válido");
            return;
        }
        cambios.valor_total = valor;
    }

    try {
        await updateDoc(doc(db, COL_SOLICITUDES, idDoc), cambios);

        delete valoresBorrador[idDoc];

        delete borradores[idDoc];

        // Notificar al cliente
        if (s.estado !== nuevoEstado || comentario) {
            await addDoc(collection(db, COL_NOTIFICACIONES), {
                id_cliente: String(s.id_cliente),
                id_solicitud: idDoc,
                titulo: `Tu solicitud de ${queEs} está: ${nuevoEstado}`,
                mensaje: comentario
                    ? `${s.servicio}: ${comentario}`
                    : `El supervisor marcó tu solicitud de ${queEs} (${s.servicio}) como ${nuevoEstado}.`,
                leida: false,
                fecha: serverTimestamp()
            });
        }

        mostrarToast(`✅ Solicitud marcada como ${nuevoEstado}`);

    } catch (error) {
        console.error("Error cambiando estado de solicitud:", error);
        mostrarToast("❌ No se pudo actualizar. Revisa las reglas de Firestore.");
    }
}

function configurarSolicitudes() {

    const lista = $("listaSolicitudesSup");

    lista.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-estado");
        if (btn) cambiarEstadoSolicitud(btn.dataset.id, btn.dataset.estado);
    });

    lista.addEventListener("input", (e) => {
        if (e.target.classList.contains("comentario-input")) {
            borradores[e.target.dataset.id] = e.target.value;
        }
        if (e.target.classList.contains("valor-input")) {
            valoresBorrador[e.target.dataset.id] = e.target.value;
        }
    });

    $("chipsEstadoSol").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        document.querySelectorAll("#chipsEstadoSol .chip").forEach(c => c.classList.remove("activo"));
        chip.classList.add("activo");
        filtroEstadoSol = chip.dataset.estado;
        pintarSolicitudes();
    });

    $("buscarSolicitud").addEventListener("input", pintarSolicitudes);
    $("filtroTipoSol").addEventListener("change", pintarSolicitudes);
}


// =====================================================
// PERSONAL (REALTIME DATABASE)
// =====================================================

let escuchandoPersonal = false;

function cargarPersonal() {

    if (escuchandoPersonal) return;
    escuchandoPersonal = true;

    const lista = $("listaUsuarios");
    if (!lista) return;

    onValue(ref(rtdb, "usuarios"), (snapshot) => {

        if (!snapshot.exists()) {
            lista.innerHTML = `<tr><td colspan="4">No hay usuarios registrados</td></tr>`;
            actualizarContador("totalPersonal", 0);
            return;
        }

        const usuarios = snapshot.val();
        let cantidad = 0;

        lista.innerHTML = "";

        for (const id in usuarios) {
            const u = usuarios[id];
            if (!u) continue;
            cantidad++;

            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${esc(u.nombre ?? u.nombre_completo ?? u.usuario ?? "Sin nombre")}</td>
                <td>${esc(u.cargo ?? "Sin cargo")}</td>
                <td>${esc(u.correo ?? "Sin correo")}</td>
                <td>${u.online
                    ? '<span class="estado-online">🟢 Online</span>'
                    : '<span class="estado-offline">⚪ Offline</span>'}</td>
            `;
            lista.appendChild(fila);
        }

        actualizarContador("totalPersonal", cantidad);

    }, (error) => {
        console.error("Error Firebase:", error);
        escuchandoPersonal = false;
        lista.innerHTML = `<tr><td colspan="4">❌ No se pudo cargar el personal</td></tr>`;
    });
}


// =====================================================
// CONTRATOS / CLIENTES / PRODUCTOS (API SPRING BOOT)
// =====================================================

async function cargarTabla({ endpoint, tablaId, columnas, filaHTML, contadorId, nombre }) {

    const tabla = $(tablaId);
    if (!tabla) return;

    try {
        const resp = await fetch(`${API_BASE}${endpoint}`);
        if (!resp.ok) throw new Error("HTTP " + resp.status);

        const datos = await resp.json();

        if (!Array.isArray(datos) || datos.length === 0) {
            tabla.innerHTML = `<tr><td colspan="${columnas}">No hay ${nombre} registrados</td></tr>`;
            if (contadorId) actualizarContador(contadorId, 0);
            return;
        }

        tabla.innerHTML = datos.map(filaHTML).join("");
        if (contadorId) actualizarContador(contadorId, datos.length);

    } catch (error) {
        console.warn(`API de ${nombre} no disponible:`, error);
        tabla.innerHTML = `
            <tr><td colspan="${columnas}">
                No se pudo conectar con el servidor (Spring Boot) para cargar ${nombre}.
            </td></tr>`;
        if (contadorId) actualizarContador(contadorId, 0);
    }
}

function cargarContratos() {
    return cargarTabla({
        endpoint: "/reportes/contratos",
        tablaId: "tablaContratos",
        columnas: 7,
        contadorId: "totalContratos",
        nombre: "contratos",
        filaHTML: c => `
            <tr>
                <td>${esc(c.id_contrato ?? "-")}</td>
                <td>${esc(c.id_cliente ?? "-")}</td>
                <td>${esc(c.numero_contrato ?? "-")}</td>
                <td>${esc(c.fecha_inicio ?? "-")}</td>
                <td>${esc(c.fecha_fin ?? "-")}</td>
                <td>$ ${esc(c.valor_total ?? "0")}</td>
                <td>${esc(c.ubicacion ?? "-")}</td>
            </tr>`
    });
}

function cargarClientes() {
    return cargarTabla({
        endpoint: "/reportes/clientes",
        tablaId: "tablaClientes",
        columnas: 4,
        nombre: "clientes",
        filaHTML: c => `
            <tr>
                <td>${esc(c.id_cliente ?? "-")}</td>
                <td>${esc(c.id_persona ?? "-")}</td>
                <td>${esc(c.razon_social ?? "-")}</td>
                <td>${esc(c.tipo_persona ?? "-")}</td>
            </tr>`
    });
}

function cargarProductos() {
    return cargarTabla({
        endpoint: "/reportes/productos",
        tablaId: "tablaProductos",
        columnas: 6,
        contadorId: "totalProductos",
        nombre: "productos",
        filaHTML: p => `
            <tr>
                <td>${esc(p.id_producto ?? "-")}</td>
                <td>${esc(p.id_proveedor ?? "-")}</td>
                <td>${esc(p.nombre_producto ?? "-")}</td>
                <td>${esc(p.descripcion ?? "-")}</td>
                <td>${esc(p.cantidad_stock ?? p.cantidad ?? p.stock ?? "-")}</td>
                <td>$ ${esc(p.precio ?? "0")}</td>
            </tr>`
    });
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

    ["usuarioLogueado", "usuario", "cargo", "id_empleado", "nombre_empleado"]
        .forEach(k => localStorage.removeItem(k));

    window.location.href = "../inicio de sistema/login.html";
}


// =====================================================
// INICIO
// =====================================================

configurarNovedades();
configurarNotificaciones();
configurarSolicitudes();
escucharNovedades();
escucharSolicitudes();

cargarPersonal();
cargarContratos();
cargarClientes();
cargarProductos();

$("btnCerrarSesion").addEventListener("click", cerrarSesion);


const btnMenu = document.getElementById("btnMenu");

if (btnMenu) {
    btnMenu.addEventListener("click", () => {
        document.body.classList.toggle("menu-cerrado");

        btnMenu.setAttribute(
            "aria-expanded",
            String(!document.body.classList.contains("menu-cerrado"))
        );
    });
}