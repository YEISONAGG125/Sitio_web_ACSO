

import {
    db,
    rtdb,
    ref,
    onValue,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    writeBatch,
    doc,
    onSnapshot,
    serverTimestamp,
    COL_INVENTARIO,
    COL_PEDIDOS,
    COL_ASIGNACIONES,
    COL_HORARIOS,
    COL_NOTIFICACIONES,
    COL_SOLICITUDES
} from "../FIREBASE/firebase.js";


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

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatearDia(iso) {
    if (!iso) return "-";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function diaSemana(iso) {
    const [a, m, d] = iso.split("-").map(Number);
    return DIAS[new Date(a, m - 1, d).getDay()];
}

function hoyISO() {
    const h = new Date();
    h.setMinutes(h.getMinutes() - h.getTimezoneOffset());
    return h.toISOString().slice(0, 10);
}

function aISO(fecha) {
    const f = new Date(fecha);
    f.setMinutes(f.getMinutes() - f.getTimezoneOffset());
    return f.toISOString().slice(0, 10);
}

function formatearHora(hhmm) {
    if (!hhmm) return "-";
    const [h, m] = hhmm.split(":").map(Number);
    const sufijo = h >= 12 ? "p. m." : "a. m.";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

function dinero(n) {
    return "$ " + Number(n || 0).toLocaleString("es-CO");
}

const COLOR_ESTADO = {
    "Pendiente": "aviso",
    "Aprobado": "azul",
    "Entregado": "ok",
    "Rechazado": "rojo",
    "Asignado": "azul",
    "En curso": "aviso",
    "Completado": "ok",
    "Cancelado": "rojo"
};

function badge(estado) {
    return `<span class="gx-badge gx-b-${COLOR_ESTADO[estado] || "gris"}">${esc(estado)}</span>`;
}

function botonesEstado(lista, actual, id) {
    return lista.map(e => `
        <button type="button" class="gx-estado-btn ${actual === e ? "actual" : ""}"
            data-id="${id}" data-estado="${e}">${e}</button>`).join("");
}


// ---------- contexto que entrega script.js ----------

let ctx = {
    nombreSupervisor: () => "Supervisor",
    toast: () => {},
    irA: () => {},
    alCambiarPedidos: () => {},
    alCambiarAsignaciones: () => {}
};

let empleados = [];
let inventario = [];
let pedidos = [];
let asignaciones = [];
let horarios = [];


// =====================================================
// EMPLEADOS (para los desplegables)
// =====================================================

function escucharEmpleados() {

    onValue(ref(rtdb, "usuarios"), (snap) => {

        empleados = [];

        if (snap.exists()) {
            const usuarios = snap.val();

            for (const key in usuarios) {
                const u = usuarios[key];
                if (!u) continue;
                if (String(u.cargo || "").toLowerCase().trim() !== "empleado") continue;
                if (u.activo === false) continue;

                // Mismo ID que usa el panel del empleado para identificarse
                empleados.push({
                    id: String(u.id_empleado || u.id_usuario || key),
                    nombre: u.nombre_empleado || u.nombre_completo || u.nombre || u.usuario || "Empleado"
                });
            }
        }

        empleados.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

        llenarSelectsEmpleados();
        pintarAsignaciones();
        pintarHorarios();

    }, (error) => {
        console.error("No se pudo leer la lista de empleados:", error);
    });
}

function nombreEmpleado(id, respaldo) {
    return empleados.find(e => e.id === String(id))?.nombre || respaldo || `Empleado ${id}`;
}

function llenarSelectsEmpleados() {

    const config = [
        { id: "asigEmpleado", vacio: "Selecciona un empleado..." },
        { id: "horEmpleado", vacio: "Selecciona un empleado..." },
        { id: "filtroAsigEmpleado", vacio: "Todos los empleados" },
        { id: "filtroHorEmpleado", vacio: "Todos los empleados" }
    ];

    config.forEach(({ id, vacio }) => {
        const sel = $(id);
        if (!sel) return;
        const actual = sel.value;

        sel.innerHTML = `<option value="">${vacio}</option>` +
            empleados.map(e => `<option value="${esc(e.id)}">${esc(e.nombre)} (ID ${esc(e.id)})</option>`).join("");

        if (actual && empleados.some(e => e.id === actual)) sel.value = actual;
    });
}

async function avisarEmpleado(idEmpleado, titulo, mensaje) {
    try {
        await addDoc(collection(db, COL_NOTIFICACIONES), {
            id_empleado: String(idEmpleado),
            titulo,
            mensaje,
            leida: false,
            fecha: serverTimestamp()
        });
    } catch (error) {
        console.error("No se pudo notificar al empleado:", error);
    }
}


// =====================================================
// INVENTARIO
// =====================================================

let editandoProducto = null;

function estadoStock(p) {
    const cant = Number(p.cantidad || 0);
    const min = Number(p.stock_minimo || 0);
    if (cant <= 0) return { texto: "Agotado", color: "rojo" };
    if (min > 0 && cant <= min) return { texto: "Stock bajo", color: "aviso" };
    return { texto: "Disponible", color: "ok" };
}

function escucharInventario() {

    onSnapshot(collection(db, COL_INVENTARIO), (snap) => {

        inventario = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es"));

        const total = $("totalProductos");
        if (total) total.textContent = inventario.length;

        pintarKpisInventario();
        pintarInventario();
        pintarPedidos();

    }, (error) => {
        console.error("Error Firestore (inventario):", error);
        $("tablaInventario").innerHTML = `
            <tr><td colspan="8">❌ No se pudo cargar el inventario. Revisa las reglas de Firestore
            (debe permitir la colección "${COL_INVENTARIO}").</td></tr>`;
    });
}

function pintarKpisInventario() {

    const bajos = inventario.filter(p => estadoStock(p).texto === "Stock bajo").length;
    const agotados = inventario.filter(p => estadoStock(p).texto === "Agotado").length;
    const unidades = inventario.reduce((t, p) => t + Number(p.cantidad || 0), 0);
    const valor = inventario.reduce((t, p) => t + Number(p.cantidad || 0) * Number(p.precio || 0), 0);

    $("kpiInvProductos").textContent = inventario.length;
    $("kpiInvUnidades").textContent = unidades.toLocaleString("es-CO");
    $("kpiInvBajos").textContent = bajos;
    $("kpiInvAgotados").textContent = agotados;
    $("kpiInvValor").textContent = dinero(valor);

    $("kpiInvBajosBox").classList.toggle("alerta", bajos > 0);
    $("kpiInvAgotadosBox").classList.toggle("alerta", agotados > 0);
}

function pintarInventario() {

    const tabla = $("tablaInventario");
    const texto = $("buscarProducto").value.trim().toLowerCase();
    const categoria = $("filtroCategoria").value;
    const estado = $("filtroStock").value;

    const filtrados = inventario.filter(p => {
        if (categoria && p.categoria !== categoria) return false;
        if (estado && estadoStock(p).texto !== estado) return false;
        if (texto) {
            const pajar = `${p.nombre} ${p.descripcion} ${p.proveedor} ${p.categoria}`.toLowerCase();
            if (!pajar.includes(texto)) return false;
        }
        return true;
    });

    if (inventario.length === 0) {
        tabla.innerHTML = `<tr><td colspan="8">Aún no hay productos. Usa «＋ Nuevo producto» para registrar el primero.</td></tr>`;
        return;
    }

    if (filtrados.length === 0) {
        tabla.innerHTML = `<tr><td colspan="8">Ningún producto coincide con los filtros.</td></tr>`;
        return;
    }

    tabla.innerHTML = filtrados.map(p => {
        const st = estadoStock(p);
        return `
            <tr>
                <td>
                    <strong>${esc(p.nombre)}</strong>
                    ${p.descripcion ? `<br><small style="color:#627570">${esc(p.descripcion)}</small>` : ""}
                </td>
                <td>${esc(p.categoria || "-")}</td>
                <td><strong>${esc(p.cantidad ?? 0)}</strong> ${esc(p.unidad || "")}</td>
                <td>${p.stock_minimo ? esc(p.stock_minimo) : "-"}</td>
                <td>${p.precio ? dinero(p.precio) : "-"}</td>
                <td>${esc(p.proveedor || "-")}</td>
                <td><span class="gx-badge gx-b-${st.color}">${st.texto}</span></td>
                <td>
                    <div class="gx-celda-acc">
                        <button type="button" class="gx-btn gx-btn-mini" data-accion="entrada" data-id="${p.id}" title="Sumar unidades al stock">＋ Stock</button>
                        <button type="button" class="gx-btn gx-btn-mini" data-accion="editar" data-id="${p.id}">Editar</button>
                        <button type="button" class="gx-btn gx-btn-mini gx-btn-peligro" data-accion="eliminar" data-id="${p.id}">Eliminar</button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

function abrirFormProducto(producto) {

    editandoProducto = producto?.id || null;

    $("invFormTitulo").textContent = producto ? "✏️ Editar producto" : "➕ Nuevo producto";
    $("prodNombre").value = producto?.nombre || "";
    $("prodCategoria").value = producto?.categoria || "Químicos de limpieza";
    $("prodUnidad").value = producto?.unidad || "unidades";
    $("prodCantidad").value = producto?.cantidad ?? "";
    $("prodMinimo").value = producto?.stock_minimo ?? "";
    $("prodPrecio").value = producto?.precio ?? "";
    $("prodProveedor").value = producto?.proveedor || "";
    $("prodDescripcion").value = producto?.descripcion || "";

    $("invForm").classList.remove("gx-oculto");
    $("prodNombre").focus();
    $("invForm").scrollIntoView({ behavior: "smooth", block: "center" });
}

function cerrarFormProducto() {
    editandoProducto = null;
    $("invForm").reset();
    $("invForm").classList.add("gx-oculto");
}

async function guardarProducto(e) {

    e.preventDefault();

    const nombre = $("prodNombre").value.trim();
    const cantidad = Number($("prodCantidad").value);

    if (!nombre) {
        ctx.toast("❌ Escribe el nombre del producto");
        return;
    }
    if ($("prodCantidad").value === "" || isNaN(cantidad) || cantidad < 0) {
        ctx.toast("❌ La cantidad debe ser un número (0 o más)");
        return;
    }

    const datos = {
        nombre,
        descripcion: $("prodDescripcion").value.trim(),
        categoria: $("prodCategoria").value,
        unidad: $("prodUnidad").value,
        cantidad,
        stock_minimo: Number($("prodMinimo").value) || 0,
        precio: Number($("prodPrecio").value) || 0,
        proveedor: $("prodProveedor").value.trim(),
        actualizado_por: ctx.nombreSupervisor(),
        fecha_actualizacion: serverTimestamp()
    };

    const boton = $("btnGuardarProducto");
    boton.disabled = true;

    try {
        if (editandoProducto) {
            await updateDoc(doc(db, COL_INVENTARIO, editandoProducto), datos);
            ctx.toast("✅ Producto actualizado");
        } else {
            await addDoc(collection(db, COL_INVENTARIO), { ...datos, fecha_creacion: serverTimestamp() });
            ctx.toast("✅ Producto agregado al inventario");
        }
        cerrarFormProducto();
    } catch (error) {
        console.error("Error guardando producto:", error);
        ctx.toast("❌ No se pudo guardar. Revisa las reglas de Firestore.");
    } finally {
        boton.disabled = false;
    }
}

async function accionProducto(accion, id) {

    const p = inventario.find(x => x.id === id);
    if (!p) return;

    if (accion === "editar") {
        abrirFormProducto(p);
        return;
    }

    if (accion === "eliminar") {
        if (!confirm(`¿Eliminar «${p.nombre}» del inventario?`)) return;
        try {
            await deleteDoc(doc(db, COL_INVENTARIO, id));
            ctx.toast("🗑️ Producto eliminado");
        } catch (error) {
            console.error(error);
            ctx.toast("❌ No se pudo eliminar");
        }
        return;
    }

    if (accion === "entrada") {
        const texto = prompt(`¿Cuántas unidades de «${p.nombre}» llegaron?`, "1");
        if (texto === null) return;
        const n = Number(texto);
        if (isNaN(n) || n <= 0) {
            ctx.toast("❌ Escribe un número mayor a 0");
            return;
        }
        try {
            await updateDoc(doc(db, COL_INVENTARIO, id), {
                cantidad: Number(p.cantidad || 0) + n,
                actualizado_por: ctx.nombreSupervisor(),
                fecha_actualizacion: serverTimestamp()
            });
            ctx.toast(`✅ Se sumaron ${n} ${p.unidad || "unidades"}`);
        } catch (error) {
            console.error(error);
            ctx.toast("❌ No se pudo actualizar el stock");
        }
    }
}

function configurarInventario() {

    $("btnNuevoProducto").addEventListener("click", () => abrirFormProducto(null));
    $("btnCancelarProducto").addEventListener("click", cerrarFormProducto);
    $("invForm").addEventListener("submit", guardarProducto);

    $("tablaInventario").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-accion]");
        if (btn) accionProducto(btn.dataset.accion, btn.dataset.id);
    });

    $("buscarProducto").addEventListener("input", pintarInventario);
    $("filtroCategoria").addEventListener("change", pintarInventario);
    $("filtroStock").addEventListener("change", pintarInventario);
}


// =====================================================
// PEDIDOS DE PRODUCTOS (los hacen los empleados)
// =====================================================

const ESTADOS_PEDIDO = ["Pendiente", "Aprobado", "Entregado", "Rechazado"];

let filtroPedido = "";
let primeraCargaPedidos = true;
const borradoresPedido = {};

function escucharPedidos() {

    onSnapshot(collection(db, COL_PEDIDOS), (snap) => {

        if (!primeraCargaPedidos) {
            snap.docChanges().forEach(cambio => {
                if (cambio.type === "added" && !cambio.doc.metadata.hasPendingWrites) {
                    const p = cambio.doc.data();
                    ctx.toast(`🧰 ${p.nombre_empleado || "Un empleado"} pidió productos`);
                }
            });
        }
        primeraCargaPedidos = false;

        pedidos = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => ms(b.fecha_envio) - ms(a.fecha_envio));

        pintarContadoresPedidos();
        pintarPedidos();
        ctx.alCambiarPedidos(pedidos);

    }, (error) => {
        console.error("Error Firestore (pedidos):", error);
        $("listaPedidosSup").innerHTML = `
            <div class="vacio error">❌ No se pudieron cargar los pedidos.
            Revisa las reglas de Firestore (colección "${COL_PEDIDOS}").</div>`;
    });
}

function pintarContadoresPedidos() {

    const cuenta = (e) => pedidos.filter(p => p.estado === e).length;

    $("cntPedTodos").textContent = pedidos.length;
    $("cntPedPendiente").textContent = cuenta("Pendiente");
    $("cntPedAprobado").textContent = cuenta("Aprobado");
    $("cntPedEntregado").textContent = cuenta("Entregado");
    $("cntPedRechazado").textContent = cuenta("Rechazado");

    const badgeMenu = $("badgePedidos");
    if (badgeMenu) {
        const pend = cuenta("Pendiente");
        badgeMenu.textContent = pend;
        badgeMenu.classList.toggle("oculto", pend === 0);
    }
}

function pintarPedidos() {

    const lista = $("listaPedidosSup");
    if (!lista) return;

    const texto = $("buscarPedido").value.trim().toLowerCase();

    const filtrados = pedidos.filter(p => {
        if (filtroPedido && p.estado !== filtroPedido) return false;
        if (texto) {
            const pajar = `${p.nombre_empleado} ${p.servicio} ${(p.items || []).map(i => i.nombre).join(" ")}`.toLowerCase();
            if (!pajar.includes(texto)) return false;
        }
        return true;
    });

    const activo = document.activeElement;
    const enfoque = activo?.classList?.contains("comentario-input") && lista.contains(activo)
        ? { id: activo.dataset.id, pos: activo.selectionStart }
        : null;

    if (filtrados.length === 0) {
        lista.innerHTML = `<div class="gx-vacio">No hay pedidos de productos con esos filtros.</div>`;
        return;
    }

    lista.innerHTML = filtrados.map(p => {

        const items = (p.items || []).map(i => {
            const prod = i.id_producto ? inventario.find(x => x.id === i.id_producto) : null;
            const disp = prod
                ? `<small>En bodega: ${esc(prod.cantidad ?? 0)} ${esc(prod.unidad || "")}</small>`
                : `<small>${i.id_producto ? "Producto ya no está en el inventario" : "Producto fuera del inventario"}</small>`;
            return `<li><span><strong>${esc(i.cantidad)}</strong> ${esc(i.unidad || "")} · ${esc(i.nombre)}</span>${disp}</li>`;
        }).join("");

        const comentario = borradoresPedido[p.id] ?? p.comentario_supervisor ?? "";

        return `
            <article class="gx-item ${p.estado === "Pendiente" ? "nuevo" : ""}">
                <div class="gx-item-cab">
                    <div>
                        <h3>🧰 ${esc(p.nombre_empleado || "Empleado")}</h3>
                        <small>ID ${esc(p.id_empleado)} · ${formatearFecha(p.fecha_envio)}</small>
                    </div>
                    ${badge(p.estado)}
                </div>

                <div class="gx-datos">
                    <span>🧹 Servicio: <b>${esc(p.servicio || "Sin servicio específico")}</b></span>
                    ${p.descontado ? `<span>📦 Stock ya descontado</span>` : ""}
                </div>

                <ul class="gx-productos">${items}</ul>

                ${p.nota ? `<p class="gx-texto">💬 ${esc(p.nota)}</p>` : ""}

                <textarea class="comentario-input" data-id="${p.id}" rows="2"
                    placeholder="Respuesta para el empleado (cuándo se lo entregas, motivo...)">${esc(comentario)}</textarea>

                <div class="gx-estados">
                    <span class="gx-label">Marcar como:</span>
                    ${botonesEstado(ESTADOS_PEDIDO, p.estado, p.id)}
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

async function cambiarEstadoPedido(id, nuevo) {

    const p = pedidos.find(x => x.id === id);
    if (!p) return;

    const comentario = (borradoresPedido[id] ?? p.comentario_supervisor ?? "").trim();

    if (p.estado === nuevo && comentario === (p.comentario_supervisor || "")) return;

    const cambios = {
        estado: nuevo,
        comentario_supervisor: comentario,
        revisado_por: ctx.nombreSupervisor(),
        fecha_actualizacion: serverTimestamp()
    };

    const batch = writeBatch(db);
    let avisoStock = "";

    // Al entregar, se descuenta del inventario (una sola vez por pedido)
    if (nuevo === "Entregado" && !p.descontado) {

        const porProducto = new Map();
        (p.items || []).forEach(i => {
            if (!i.id_producto) return;
            porProducto.set(i.id_producto, (porProducto.get(i.id_producto) || 0) + Number(i.cantidad || 0));
        });

        const faltantes = [];

        porProducto.forEach((cantidad, idProducto) => {
            const prod = inventario.find(x => x.id === idProducto);
            if (!prod) return;

            const actual = Number(prod.cantidad || 0);
            if (cantidad > actual) faltantes.push(prod.nombre);

            batch.update(doc(db, COL_INVENTARIO, idProducto), {
                cantidad: Math.max(0, actual - cantidad),
                actualizado_por: ctx.nombreSupervisor(),
                fecha_actualizacion: serverTimestamp()
            });
        });

        if (faltantes.length) {
            const seguir = confirm(
                `No hay suficiente stock de: ${faltantes.join(", ")}.\n` +
                `Si continúas, quedará en 0. ¿Marcar como entregado igualmente?`
            );
            if (!seguir) return;
            avisoStock = " (stock en 0 para algunos productos)";
        }

        cambios.descontado = true;
    }

    batch.update(doc(db, COL_PEDIDOS, id), cambios);

    try {
        await batch.commit();
        delete borradoresPedido[id];

        if (p.estado !== nuevo || comentario) {
            await avisarEmpleado(
                p.id_empleado,
                `Tu pedido de productos está: ${nuevo}`,
                comentario || `El supervisor marcó tu pedido como ${nuevo}.`
            );
        }

        ctx.toast(`✅ Pedido marcado como ${nuevo}${avisoStock}`);

    } catch (error) {
        console.error("Error cambiando estado del pedido:", error);
        ctx.toast("❌ No se pudo actualizar el pedido. Revisa las reglas de Firestore.");
    }
}

function configurarPedidos() {

    const lista = $("listaPedidosSup");

    lista.addEventListener("click", (e) => {
        const btn = e.target.closest(".gx-estado-btn");
        if (btn) cambiarEstadoPedido(btn.dataset.id, btn.dataset.estado);
    });

    lista.addEventListener("input", (e) => {
        if (e.target.classList.contains("comentario-input")) {
            borradoresPedido[e.target.dataset.id] = e.target.value;
        }
    });

    $("chipsPedidos").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        document.querySelectorAll("#chipsPedidos .chip").forEach(c => c.classList.remove("activo"));
        chip.classList.add("activo");
        filtroPedido = chip.dataset.estado;
        pintarPedidos();
    });

    $("buscarPedido").addEventListener("input", pintarPedidos);
}


// =====================================================
// SERVICIOS ASIGNADOS A EMPLEADOS
// =====================================================

const ESTADOS_ASIGNACION = ["Asignado", "En curso", "Completado", "Cancelado"];

let filtroAsignacion = "";
let origenSolicitud = null;     // solicitud de cliente desde la que se está asignando

function escucharAsignaciones() {

    onSnapshot(collection(db, COL_ASIGNACIONES), (snap) => {

        asignaciones = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
                // Primero los que no están terminados, por fecha
                const fa = `${a.fecha || "9999"} ${a.hora || ""}`;
                const fb = `${b.fecha || "9999"} ${b.hora || ""}`;
                return fa.localeCompare(fb);
            });

        pintarContadoresAsignaciones();
        pintarAsignaciones();
        ctx.alCambiarAsignaciones(asignaciones);

    }, (error) => {
        console.error("Error Firestore (asignaciones):", error);
        $("listaAsignaciones").innerHTML = `
            <div class="vacio error">❌ No se pudieron cargar los servicios asignados.
            Revisa las reglas de Firestore (colección "${COL_ASIGNACIONES}").</div>`;
    });
}

function pintarContadoresAsignaciones() {

    const cuenta = (e) => asignaciones.filter(a => a.estado === e).length;

    $("cntAsigTodas").textContent = asignaciones.length;
    $("cntAsigAsignado").textContent = cuenta("Asignado");
    $("cntAsigCurso").textContent = cuenta("En curso");
    $("cntAsigCompletado").textContent = cuenta("Completado");
    $("cntAsigCancelado").textContent = cuenta("Cancelado");
}

function pintarAsignaciones() {

    const lista = $("listaAsignaciones");
    if (!lista) return;

    const empFiltro = $("filtroAsigEmpleado").value;

    const filtradas = asignaciones.filter(a => {
        if (filtroAsignacion && a.estado !== filtroAsignacion) return false;
        if (empFiltro && String(a.id_empleado) !== empFiltro) return false;
        return true;
    });

    if (filtradas.length === 0) {
        lista.innerHTML = `<div class="gx-vacio">No hay servicios asignados con esos filtros.</div>`;
        return;
    }

    lista.innerHTML = filtradas.map(a => {

        const opciones = empleados
            .filter(e => e.id !== String(a.id_empleado))
            .map(e => `<option value="${esc(e.id)}">${esc(e.nombre)}</option>`).join("");

        const clase = a.estado === "Completado" ? "ok" : (a.estado === "Asignado" ? "azul" : "");

        return `
            <article class="gx-item ${clase}">
                <div class="gx-item-cab">
                    <div>
                        <h3>🧹 ${esc(a.servicio)}</h3>
                        <small>Asignado a <b>${esc(nombreEmpleado(a.id_empleado, a.nombre_empleado))}</b>
                        · ${formatearFecha(a.fecha_envio)}</small>
                    </div>
                    ${badge(a.estado)}
                </div>

                <div class="gx-datos">
                    <span>📅 ${formatearDia(a.fecha)} ${a.hora ? "· 🕐 " + formatearHora(a.hora) : ""}</span>
                    ${a.direccion ? `<span>📍 ${esc(a.direccion)}</span>` : ""}
                    ${a.cliente ? `<span>🤝 ${esc(a.cliente)}</span>` : ""}
                    ${a.origen === "solicitud" ? `<span>📑 Viene de una solicitud de cliente</span>` : ""}
                </div>

                ${a.descripcion ? `<p class="gx-texto">${esc(a.descripcion)}</p>` : ""}

                <div class="gx-estados">
                    <span class="gx-label">Estado:</span>
                    ${botonesEstado(ESTADOS_ASIGNACION, a.estado, a.id)}
                </div>

                <div class="gx-estados">
                    <span class="gx-label">Reasignar a:</span>
                    <select class="reasignar-select" data-id="${a.id}" style="min-height:32px;border:1px solid #d5e3df;border-radius:9px;padding:4px 8px;font-size:11px;">
                        <option value="">Elegir empleado...</option>
                        ${opciones}
                    </select>
                    <button type="button" class="gx-btn gx-btn-mini" data-reasignar="${a.id}">Reasignar</button>
                    <button type="button" class="gx-btn gx-btn-mini gx-btn-peligro" data-borrar="${a.id}">Eliminar</button>
                </div>
            </article>`;
    }).join("");
}

function limpiarOrigenSolicitud() {
    origenSolicitud = null;
    $("asigOrigen").classList.add("gx-oculto");
}

// La llama script.js cuando el supervisor pulsa «Asignar a empleado» en una solicitud
function prepararAsignacion(sol) {

    origenSolicitud = sol.id;

    $("asigServicio").value = sol.servicio || "";
    $("asigCliente").value = sol.nombre_cliente || "";
    $("asigDireccion").value = sol.direccion || "";
    $("asigFecha").value = sol.fecha_deseada || sol.fecha_inicio || "";
    $("asigHora").value = "";

    const extra = [];
    if (sol.tipo === "Contrato") {
        if (sol.frecuencia) extra.push(`Frecuencia: ${sol.frecuencia}`);
        if (sol.duracion_meses) extra.push(`Duración: ${sol.duracion_meses} meses`);
        if (sol.area_m2) extra.push(`Área: ${sol.area_m2} m²`);
    } else if (sol.jornada) {
        extra.push(`Jornada: ${sol.jornada}`);
    }
    if (sol.descripcion) extra.push(sol.descripcion);
    $("asigDescripcion").value = extra.join(" · ");

    $("asigOrigenTexto").textContent =
        `Asignando la solicitud de ${sol.tipo === "Contrato" ? "contrato" : "servicio"} de ${sol.nombre_cliente || "un cliente"}`;
    $("asigOrigen").classList.remove("gx-oculto");

    ctx.irA("Servicios", $("tabServicios"));
    $("asigEmpleado").focus();
}

async function guardarAsignacion(e) {

    e.preventDefault();

    const idEmpleado = $("asigEmpleado").value;
    const servicio = $("asigServicio").value.trim();
    const fecha = $("asigFecha").value;

    if (!idEmpleado) { ctx.toast("❌ Elige el empleado"); return; }
    if (!servicio) { ctx.toast("❌ Escribe qué servicio es"); return; }
    if (!fecha) { ctx.toast("❌ Elige la fecha del servicio"); return; }

    const nombre = nombreEmpleado(idEmpleado);
    const hora = $("asigHora").value;
    const direccion = $("asigDireccion").value.trim();

    const boton = $("btnAsignar");
    boton.disabled = true;

    try {
        await addDoc(collection(db, COL_ASIGNACIONES), {
            id_empleado: idEmpleado,
            nombre_empleado: nombre,
            servicio,
            cliente: $("asigCliente").value.trim(),
            direccion,
            fecha,
            hora,
            descripcion: $("asigDescripcion").value.trim(),
            estado: "Asignado",
            origen: origenSolicitud ? "solicitud" : "manual",
            id_solicitud: origenSolicitud || null,
            asignado_por: ctx.nombreSupervisor(),
            fecha_envio: serverTimestamp(),
            fecha_actualizacion: serverTimestamp()
        });

        // Si viene de una solicitud, se deja marcado quién la atiende
        if (origenSolicitud) {
            try {
                await updateDoc(doc(db, COL_SOLICITUDES, origenSolicitud), {
                    id_empleado_asignado: idEmpleado,
                    empleado_asignado: nombre,
                    fecha_actualizacion: serverTimestamp()
                });
            } catch (error) {
                console.warn("No se pudo marcar la solicitud como asignada:", error);
            }
        }

        await avisarEmpleado(
            idEmpleado,
            "Tienes un servicio nuevo",
            `${servicio} · ${formatearDia(fecha)}${hora ? " " + formatearHora(hora) : ""}${direccion ? " · " + direccion : ""}`
        );

        ctx.toast(`✅ Servicio asignado a ${nombre}`);
        $("asigForm").reset();
        limpiarOrigenSolicitud();

    } catch (error) {
        console.error("Error asignando servicio:", error);
        ctx.toast("❌ No se pudo asignar. Revisa las reglas de Firestore.");
    } finally {
        boton.disabled = false;
    }
}

async function cambiarEstadoAsignacion(id, nuevo) {

    const a = asignaciones.find(x => x.id === id);
    if (!a || a.estado === nuevo) return;

    try {
        await updateDoc(doc(db, COL_ASIGNACIONES, id), {
            estado: nuevo,
            fecha_actualizacion: serverTimestamp()
        });

        if (nuevo === "Cancelado") {
            await avisarEmpleado(a.id_empleado, "Servicio cancelado", `Se canceló: ${a.servicio} (${formatearDia(a.fecha)}).`);
        }

        ctx.toast(`✅ Servicio marcado como ${nuevo}`);
    } catch (error) {
        console.error(error);
        ctx.toast("❌ No se pudo cambiar el estado");
    }
}

async function reasignar(id) {

    const a = asignaciones.find(x => x.id === id);
    const select = document.querySelector(`.reasignar-select[data-id="${id}"]`);
    if (!a || !select) return;

    const nuevoId = select.value;
    if (!nuevoId) { ctx.toast("❌ Elige a qué empleado reasignar"); return; }

    const nuevoNombre = nombreEmpleado(nuevoId);

    try {
        await updateDoc(doc(db, COL_ASIGNACIONES, id), {
            id_empleado: nuevoId,
            nombre_empleado: nuevoNombre,
            estado: "Asignado",
            fecha_actualizacion: serverTimestamp()
        });

        await avisarEmpleado(a.id_empleado, "Servicio reasignado", `Se te quitó el servicio: ${a.servicio} (${formatearDia(a.fecha)}).`);
        await avisarEmpleado(nuevoId, "Tienes un servicio nuevo", `${a.servicio} · ${formatearDia(a.fecha)}${a.hora ? " " + formatearHora(a.hora) : ""}${a.direccion ? " · " + a.direccion : ""}`);

        if (a.id_solicitud) {
            try {
                await updateDoc(doc(db, COL_SOLICITUDES, a.id_solicitud), {
                    id_empleado_asignado: nuevoId,
                    empleado_asignado: nuevoNombre
                });
            } catch { /* no es crítico */ }
        }

        ctx.toast(`✅ Servicio reasignado a ${nuevoNombre}`);
    } catch (error) {
        console.error(error);
        ctx.toast("❌ No se pudo reasignar");
    }
}

async function borrarAsignacion(id) {

    const a = asignaciones.find(x => x.id === id);
    if (!a) return;
    if (!confirm(`¿Eliminar el servicio «${a.servicio}» asignado a ${nombreEmpleado(a.id_empleado, a.nombre_empleado)}?`)) return;

    try {
        await deleteDoc(doc(db, COL_ASIGNACIONES, id));
        ctx.toast("🗑️ Servicio eliminado");
    } catch (error) {
        console.error(error);
        ctx.toast("❌ No se pudo eliminar");
    }
}

function configurarAsignaciones() {

    $("asigForm").addEventListener("submit", guardarAsignacion);
    $("btnQuitarOrigen").addEventListener("click", () => {
        limpiarOrigenSolicitud();
        $("asigForm").reset();
    });

    const lista = $("listaAsignaciones");

    lista.addEventListener("click", (e) => {
        const est = e.target.closest(".gx-estado-btn");
        if (est) return cambiarEstadoAsignacion(est.dataset.id, est.dataset.estado);

        const re = e.target.closest("[data-reasignar]");
        if (re) return reasignar(re.dataset.reasignar);

        const del = e.target.closest("[data-borrar]");
        if (del) borrarAsignacion(del.dataset.borrar);
    });

    $("chipsAsignaciones").addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        document.querySelectorAll("#chipsAsignaciones .chip").forEach(c => c.classList.remove("activo"));
        chip.classList.add("activo");
        filtroAsignacion = chip.dataset.estado;
        pintarAsignaciones();
    });

    $("filtroAsigEmpleado").addEventListener("change", pintarAsignaciones);

    $("asigFecha").min = hoyISO();
}


// =====================================================
// HORARIOS DE EMPLEADOS
// =====================================================

let editandoHorario = null;

function escucharHorarios() {

    onSnapshot(collection(db, COL_HORARIOS), (snap) => {

        horarios = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`));

        pintarHorarios();

    }, (error) => {
        console.error("Error Firestore (horarios):", error);
        $("tablaHorariosSup").innerHTML = `
            <tr><td colspan="7">❌ No se pudieron cargar los horarios.
            Revisa las reglas de Firestore (colección "${COL_HORARIOS}").</td></tr>`;
    });
}

function turnoAutomatico(horaInicio) {
    const h = Number((horaInicio || "0:0").split(":")[0]);
    if (h < 12) return "Mañana";
    if (h < 18) return "Tarde";
    return "Noche";
}

function pintarHorarios() {

    const tabla = $("tablaHorariosSup");
    if (!tabla) return;

    const empFiltro = $("filtroHorEmpleado").value;
    const verPasados = $("verHorariosPasados").checked;
    const hoy = hoyISO();

    const filtrados = horarios.filter(h => {
        if (empFiltro && String(h.id_empleado) !== empFiltro) return false;
        if (!verPasados && h.fecha < hoy) return false;
        return true;
    });

    if (filtrados.length === 0) {
        tabla.innerHTML = `<tr><td colspan="7">No hay horarios para mostrar. Crea uno con el formulario de arriba.</td></tr>`;
        return;
    }

    tabla.innerHTML = filtrados.map(h => `
        <tr class="${h.fecha === hoy ? "hoy" : (h.fecha < hoy ? "pasado" : "")}">
            <td>${esc(nombreEmpleado(h.id_empleado, h.nombre_empleado))}</td>
            <td>${diaSemana(h.fecha)} ${formatearDia(h.fecha)}${h.fecha === hoy ? " · <b>Hoy</b>" : ""}</td>
            <td>${formatearHora(h.hora_inicio)}</td>
            <td>${formatearHora(h.hora_fin)}</td>
            <td>${esc(h.turno || "-")}</td>
            <td>${esc(h.nota || "-")}</td>
            <td>
                <div class="gx-celda-acc">
                    <button type="button" class="gx-btn gx-btn-mini" data-editar="${h.id}">Editar</button>
                    <button type="button" class="gx-btn gx-btn-mini gx-btn-peligro" data-borrar="${h.id}">Eliminar</button>
                </div>
            </td>
        </tr>`).join("");
}

function resumenHorarioParaAviso(inicio, fin) {
    return `${formatearHora(inicio)} a ${formatearHora(fin)}`;
}

function fechasDelHorario(desde, hasta, diasMarcados) {

    if (!hasta) return [desde];

    const fechas = [];
    const [a, m, d] = desde.split("-").map(Number);
    const cursor = new Date(a, m - 1, d);
    const [a2, m2, d2] = hasta.split("-").map(Number);
    const fin = new Date(a2, m2 - 1, d2);

    while (cursor <= fin && fechas.length < 92) {
        if (diasMarcados.includes(cursor.getDay())) fechas.push(aISO(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return fechas;
}

function cerrarEdicionHorario() {
    editandoHorario = null;
    $("horForm").reset();
    $("horFormTitulo").textContent = "🕐 Poner horario a un empleado";
    $("btnGuardarHorario").textContent = "💾 Guardar horario";
    $("btnCancelarHorario").classList.add("gx-oculto");
    $("horDesde").min = hoyISO();
    document.querySelectorAll("#horDias input").forEach(c => { c.checked = c.dataset.dia !== "0"; });
}

function editarHorario(id) {

    const h = horarios.find(x => x.id === id);
    if (!h) return;

    editandoHorario = id;

    $("horFormTitulo").textContent = "✏️ Editar horario";
    $("horEmpleado").value = String(h.id_empleado);
    $("horDesde").value = h.fecha;
    $("horDesde").removeAttribute("min");
    $("horHasta").value = "";
    $("horInicio").value = h.hora_inicio || "";
    $("horFin").value = h.hora_fin || "";
    $("horTurno").value = h.turno_manual ? h.turno : "";
    $("horNota").value = h.nota || "";

    $("btnGuardarHorario").textContent = "💾 Guardar cambios";
    $("btnCancelarHorario").classList.remove("gx-oculto");
    $("horForm").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function guardarHorario(e) {

    e.preventDefault();

    const idEmpleado = $("horEmpleado").value;
    const desde = $("horDesde").value;
    const hasta = $("horHasta").value;
    const inicio = $("horInicio").value;
    const fin = $("horFin").value;
    const turnoManual = $("horTurno").value;
    const nota = $("horNota").value.trim();

    if (!idEmpleado) { ctx.toast("❌ Elige el empleado"); return; }
    if (!desde) { ctx.toast("❌ Elige la fecha"); return; }
    if (!inicio || !fin) { ctx.toast("❌ Pon la hora de inicio y la de fin"); return; }
    if (inicio === fin) { ctx.toast("❌ La hora de inicio y fin no pueden ser iguales"); return; }
    if (hasta && hasta < desde) { ctx.toast("❌ La fecha final es anterior a la inicial"); return; }

    const nombre = nombreEmpleado(idEmpleado);
    const datos = {
        id_empleado: idEmpleado,
        nombre_empleado: nombre,
        hora_inicio: inicio,
        hora_fin: fin,
        turno: turnoManual || turnoAutomatico(inicio),
        turno_manual: Boolean(turnoManual),
        nota,
        estado: "Programado",
        asignado_por: ctx.nombreSupervisor(),
        fecha_actualizacion: serverTimestamp()
    };

    const boton = $("btnGuardarHorario");
    boton.disabled = true;

    try {

        // ----- Edición de un día -----
        if (editandoHorario) {
            await updateDoc(doc(db, COL_HORARIOS, editandoHorario), { ...datos, fecha: desde });
            await avisarEmpleado(
                idEmpleado,
                "Tu horario cambió",
                `${diaSemana(desde)} ${formatearDia(desde)}: ${resumenHorarioParaAviso(inicio, fin)}`
            );
            ctx.toast("✅ Horario actualizado");
            cerrarEdicionHorario();
            return;
        }

        // ----- Horario nuevo (un día o varios) -----
        const diasMarcados = [...document.querySelectorAll("#horDias input:checked")].map(c => Number(c.dataset.dia));

        if (hasta && diasMarcados.length === 0) {
            ctx.toast("❌ Marca al menos un día de la semana");
            return;
        }

        const fechas = fechasDelHorario(desde, hasta, diasMarcados);

        if (fechas.length === 0) {
            ctx.toast("❌ Ningún día del rango coincide con los días marcados");
            return;
        }

        const batch = writeBatch(db);

        fechas.forEach(fecha => {
            // Si ese día ya tenía horario, se reemplaza para no duplicar
            const existente = horarios.find(h => String(h.id_empleado) === idEmpleado && h.fecha === fecha);
            if (existente) {
                batch.update(doc(db, COL_HORARIOS, existente.id), { ...datos, fecha });
            } else {
                batch.set(doc(collection(db, COL_HORARIOS)), {
                    ...datos,
                    fecha,
                    fecha_envio: serverTimestamp()
                });
            }
        });

        await batch.commit();

        const rango = fechas.length === 1
            ? `${diaSemana(fechas[0])} ${formatearDia(fechas[0])}`
            : `${formatearDia(fechas[0])} al ${formatearDia(fechas[fechas.length - 1])} (${fechas.length} días)`;

        await avisarEmpleado(
            idEmpleado,
            "Tienes un horario nuevo",
            `${rango}: ${resumenHorarioParaAviso(inicio, fin)}`
        );

        ctx.toast(`✅ Horario guardado para ${nombre} (${fechas.length} ${fechas.length === 1 ? "día" : "días"})`);
        cerrarEdicionHorario();

    } catch (error) {
        console.error("Error guardando horario:", error);
        ctx.toast("❌ No se pudo guardar el horario. Revisa las reglas de Firestore.");
    } finally {
        boton.disabled = false;
    }
}

async function borrarHorario(id) {

    const h = horarios.find(x => x.id === id);
    if (!h) return;

    if (!confirm(`¿Eliminar el horario de ${nombreEmpleado(h.id_empleado, h.nombre_empleado)} del ${formatearDia(h.fecha)}?`)) return;

    try {
        await deleteDoc(doc(db, COL_HORARIOS, id));
        await avisarEmpleado(h.id_empleado, "Horario eliminado", `Se quitó tu horario del ${diaSemana(h.fecha)} ${formatearDia(h.fecha)}.`);
        ctx.toast("🗑️ Horario eliminado");
    } catch (error) {
        console.error(error);
        ctx.toast("❌ No se pudo eliminar");
    }
}

function configurarHorarios() {

    $("horForm").addEventListener("submit", guardarHorario);
    $("btnCancelarHorario").addEventListener("click", cerrarEdicionHorario);

    $("tablaHorariosSup").addEventListener("click", (e) => {
        const ed = e.target.closest("[data-editar]");
        if (ed) return editarHorario(ed.dataset.editar);

        const del = e.target.closest("[data-borrar]");
        if (del) borrarHorario(del.dataset.borrar);
    });

    $("filtroHorEmpleado").addEventListener("change", pintarHorarios);
    $("verHorariosPasados").addEventListener("change", pintarHorarios);

    cerrarEdicionHorario();
}


// =====================================================
// ARRANQUE
// =====================================================

export function iniciarGestion(contexto) {

    ctx = { ...ctx, ...contexto };

    configurarInventario();
    configurarPedidos();
    configurarAsignaciones();
    configurarHorarios();

    escucharEmpleados();
    escucharInventario();
    escucharPedidos();
    escucharAsignaciones();
    escucharHorarios();

    return { prepararAsignacion };
}
