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
    COL_NOTIFICACIONES
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

    ponerBadge("badgeNovedades", pendientes);
    ponerBadge("badgeNotificaciones", pendientes);
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
    const enfoque = activo && activo.classList?.contains("comentario-input")
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

    const recientes = novedades
        .slice()
        .sort((a, b) => ms(b.fecha_envio) - ms(a.fecha_envio))
        .slice(0, 25);

    if (recientes.length === 0) {
        lista.innerHTML = `<div class="vacio">No hay notificaciones por ahora.</div>`;
        return;
    }

    lista.innerHTML = recientes.map(n => `
        <div class="notificacion ${n.estado === "Pendiente" ? "nueva" : ""}">
            <div class="icono-notificacion">${n.es_incapacidad ? "🩺" : "🔔"}</div>
            <div class="notificacion-texto">
                <strong>
                    ${n.es_incapacidad ? "Incapacidad" : "Novedad"} de ${esc(n.nombre_empleado || "empleado")}
                    <span class="badge-estado ${claseEstado(n.estado)}">${esc(n.estado)}</span>
                </strong>
                <p>${esc(n.tipo_novedad)}${n.es_incapacidad && n.dias_incapacidad ? ` · ${n.dias_incapacidad} día(s)` : ""}: ${esc((n.descripcion || "").slice(0, 140))}${(n.descripcion || "").length > 140 ? "…" : ""}</p>
                <small>${formatearFecha(n.fecha_envio)}</small>
            </div>
            <button type="button" class="btn-ver" data-ir="1">Ver</button>
        </div>
    `).join("");
}

function configurarNotificaciones() {
    $("listaNotificaciones").addEventListener("click", (e) => {
        if (!e.target.closest(".btn-ver")) return;
        const tab = document.querySelectorAll(".tab")[2];     // Novedad laboral
        window.mostrar("NovedadLaboral", tab);
    });
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
escucharNovedades();

cargarPersonal();
cargarContratos();
cargarClientes();
cargarProductos();

$("btnCerrarSesion").addEventListener("click", cerrarSesion);
