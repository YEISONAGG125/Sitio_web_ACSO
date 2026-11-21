import { db, rtdb, ref, onValue, update, push, collection, doc, addDoc, updateDoc, onSnapshot } from "../FIREBASE/firebase.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { protegerAdmin, cerrarSesionSupervisor, vigilarInactividad } from "../FIREBASE/seguridad.js";
import { crearHashClave, validarClaveSupervisor } from "../FIREBASE/cripto.js";
import { hashPassword } from "../FIREBASE/passwords.js";

const API = "http://localhost:8080/api";
const LOGIN = "../inicio de sistema/login.html";
const ROLES = ["administrador", "supervisor", "empleado", "cliente"];
const ROL_TXT = { administrador: "Administrador", supervisor: "Supervisor", empleado: "Empleado", cliente: "Cliente" };
const ROL_PLURAL = { administrador: "Administradores", supervisor: "Supervisores", empleado: "Empleados", cliente: "Clientes" };
const ROL_COLOR = { administrador: "c-admin", supervisor: "c-sup", empleado: "c-emp", cliente: "c-cli" };

const acceso = await protegerAdmin();
const yo = acceso.id;

const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// =====================================================
// UTILIDADES
// =====================================================

function aviso(texto) {
    const e = $("toast");
    e.textContent = texto;
    e.classList.add("on");
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => e.classList.remove("on"), 3500);
}

function iniciales(nombre) {
    const p = String(nombre || "").trim().split(/\s+/).filter(Boolean);
    if (!p.length) return "?";
    return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

function hace(iso) {
    if (!iso) return "Nunca";
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return "—";
    const m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 1) return "Ahora mismo";
    if (m < 60) return `Hace ${m} min`;
    const h = Math.round(m / 60);
    if (h < 24) return `Hace ${h} h`;
    const d = Math.round(h / 24);
    if (d < 30) return `Hace ${d} d`;
    return new Date(t).toLocaleDateString("es-CO");
}

const bloqueado = (u) => Number(u?.bloqueado_hasta || 0) > Date.now();

function saludo() {
    const h = new Date().getHours();
    const s = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
    const n = String(acceso.usuario.nombre || acceso.usuario.usuario || "").trim().split(/\s+/)[0];
    return n ? `${s}, ${n}` : s;
}

const nombreYo = acceso.usuario.nombre || acceso.usuario.usuario || "Administrador";
$("yo").textContent = nombreYo;
$("yoAvatar").textContent = iniciales(nombreYo);
$("saludo").textContent = saludo();

// Diálogo reutilizable. Devuelve una promesa: true si se confirmó, false si se cerró.
function dialogo({ titulo, html, ok = "Guardar", cancelar = "Cancelar", peligro = false, onOk }) {
    return new Promise((resolver) => {
        $("dT").textContent = titulo;
        $("dB").innerHTML = html;

        const si = $("dSi"), no = $("dNo");
        si.textContent = ok;
        si.className = peligro ? "btn btn-peligro" : "btn btn-primario";
        no.textContent = cancelar || "Cancelar";
        no.hidden = cancelar === null;

        let hecho = false;
        $("dlg").addEventListener("close", () => resolver(hecho), { once: true });

        $("fDlg").onsubmit = async (e) => {
            if (e.submitter?.value !== "ok") return;
            e.preventDefault();
            si.disabled = true;
            try {
                if (onOk) await onOk();
                hecho = true;
                $("dlg").close();
            } catch (x) {
                aviso(x.message || "No se pudo guardar.");
            } finally {
                si.disabled = false;
            }
        };

        $("dlg").showModal();
    });
}

const confirmar = (titulo, texto, boton = "Eliminar") =>
    dialogo({ titulo, html: `<p>${esc(texto)}</p>`, ok: boton, peligro: true });

// =====================================================
// SESIÓN Y NAVEGACIÓN
// =====================================================

const salir = async () => { await cerrarSesionSupervisor(); location.replace(LOGIN); };
$("salir").onclick = salir;
vigilarInactividad(salir);

const VISTAS = ["resumen", "usuarios", "recup", "datos"];

function ir(v) {
    if (!VISTAS.includes(v)) v = "resumen";
    document.querySelectorAll("#nav .acso-nav-item").forEach((x) => {
        if (x.dataset.v === v) x.setAttribute("aria-current", "page");
        else x.removeAttribute("aria-current");
    });
    VISTAS.forEach((n) => { $("v-" + n).hidden = n !== v; });
    if (location.hash !== "#" + v) history.replaceState(null, "", "#" + v);
    if (v === "datos") cargarDatos();
    window.scrollTo({ top: 0 });
}

$("nav").onclick = (e) => {
    const b = e.target.closest("[data-v]");
    if (b) ir(b.dataset.v);
};

document.querySelector(".acso-marca").onclick = (e) => { e.preventDefault(); ir("resumen"); };

// Atajos del resumen (tarjetas y avisos)
document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-go]");
    if (!b) return;
    const [vista, rol] = b.dataset.go.split(":");
    if (vista === "usuarios") {
        $("fRol").value = rol || "";
        $("fEstado").value = b.dataset.estado || "";
        $("q").value = "";
        pintaUsers();
    }
    ir(vista);
});

// =====================================================
// DATOS EN VIVO
// =====================================================

let users = {}, recs = {}, pend = { nov: 0, sol: 0 };

const falloLectura = (e) => aviso("Firebase no permitió leer los datos: " + (e?.code || e?.message || "error"));

onValue(ref(rtdb, "usuarios"), (s) => { users = s.val() || {}; pintaUsers(); kpis(); }, falloLectura);
onValue(ref(rtdb, "recuperaciones"), (s) => { recs = s.val() || {}; pintaRecup(); kpis(); }, falloLectura);

[["nov", "novedades_laborales"], ["sol", "solicitudes"]].forEach(([k, c]) =>
    onSnapshot(collection(db, c), (s) => {
        pend[k] = s.docs.filter((d) => d.data().estado === "Pendiente").length;
        kpis();
    }, () => { }));

const listaUsuarios = () => Object.entries(users).filter(([, u]) => u);
const recPendientes = () => Object.values(recs).filter((r) => r && r.estado === "pendiente").length;

// =====================================================
// RESUMEN
// =====================================================

function tarjeta(icono, numero, texto, { go = "", estado = "", tono = "" } = {}) {
    const attrs = go ? `type="button" data-go="${esc(go)}"${estado ? ` data-estado="${esc(estado)}"` : ""}` : "";
    const etiqueta = go ? "button" : "div";
    const color = { azul: "azul", aviso: "naranja", alerta: "rojo" }[tono] || "";
    return `<${etiqueta} class="dashboard-card" ${attrs}><div class="card-icon ${color}" aria-hidden="true">${icono}</div><div><span>${esc(texto)}</span><strong>${numero}</strong></div></${etiqueta}>`;
}

function kpis() {
    const l = listaUsuarios().map(([, u]) => u);
    const cuenta = (r) => l.filter((u) => u.cargo === r).length;
    const total = l.length;
    const enLinea = l.filter((u) => u.online).length;
    const off = l.filter((u) => u.activo === false).length;
    const bloq = l.filter(bloqueado).length;
    const rp = recPendientes();

    // Contadores del menú
    $("cUsuarios").textContent = total;
    $("cUsuarios").classList.toggle("oculto", !total);
    $("cRecup").textContent = rp;
    $("cRecup").classList.toggle("oculto", !rp);

    // Avisos que requieren atención
    const avisos = [];
    if (rp) avisos.push(`<div class="fila"><span>🔑 <b>${rp}</b> ${rp === 1 ? "solicitud" : "solicitudes"} de recuperación de contraseña por atender</span><button type="button" class="btn btn-mini btn-primario" data-go="recup">Atender</button></div>`);
    if (bloq) avisos.push(`<div class="fila"><span>⛔ <b>${bloq}</b> ${bloq === 1 ? "cuenta bloqueada" : "cuentas bloqueadas"} por intentos fallidos</span><button type="button" class="btn btn-mini" data-go="usuarios" data-estado="bloq">Ver</button></div>`);
    const caja = $("atencion");
    caja.hidden = !avisos.length;
    caja.innerHTML = avisos.length ? `<strong>Requiere tu atención</strong>${avisos.join("")}` : "";

    $("kCuentas").innerHTML = [
        tarjeta("👥", total, "Total de usuarios", { go: "usuarios" }),
        ...ROLES.map((r, i) => tarjeta(["🛡️", "🧑‍💼", "🧹", "🏢"][i], cuenta(r), ROL_PLURAL[r], { go: "usuarios:" + r, tono: r === "empleado" ? "azul" : "" }))
    ].join("");

    $("kActividad").innerHTML = [
        tarjeta("🟢", enLinea, "En línea ahora", { go: "usuarios", estado: "online" }),
        tarjeta("🚫", off, "Cuentas desactivadas", { go: "usuarios", estado: "off", tono: off ? "aviso" : "" }),
        tarjeta("📝", pend.nov, "Novedades pendientes", { tono: pend.nov ? "aviso" : "" }),
        tarjeta("📨", pend.sol, "Solicitudes pendientes", { tono: pend.sol ? "aviso" : "" }),
        tarjeta("🔑", rp, "Recuperaciones pendientes", { go: "recup", tono: rp ? "alerta" : "" })
    ].join("");

    // Distribución por cargo
    if (!total) {
        $("distribucion").innerHTML = '<p class="vacio">Aún no hay usuarios.</p>';
    } else {
        const partes = ROLES.map((r) => [r, cuenta(r)]);
        $("distribucion").innerHTML =
            `<div class="dist-barra" role="img" aria-label="Distribución de usuarios por cargo">${partes.filter(([, n]) => n).map(([r, n]) => `<i class="${ROL_COLOR[r]}" style="width:${(n / total) * 100}%"></i>`).join("")}</div>` +
            partes.map(([r, n]) => `<div class="dist-fila"><span class="punto ${ROL_COLOR[r]}"></span><span class="nombre">${ROL_PLURAL[r]}</span><span class="num">${n}</span><span class="pct">${Math.round((n / total) * 100)}%</span></div>`).join("");
    }

    // Últimos accesos
    const recientes = listaUsuarios()
        .filter(([, u]) => u.ultimoAcceso)
        .sort((a, b) => new Date(b[1].ultimoAcceso) - new Date(a[1].ultimoAcceso))
        .slice(0, 5);

    $("accesos").innerHTML = recientes.map(([, u]) =>
        `<li><span class="av">${esc(iniciales(u.nombre || u.usuario))}</span><span class="quien"><strong>${esc(u.nombre || u.usuario)}</strong><small>${esc(ROL_TXT[u.cargo] || u.cargo || "—")}</small></span><span class="cuando">${u.online ? '<span class="tag ok">En línea</span>' : esc(hace(u.ultimoAcceso))}</span></li>`
    ).join("") || '<li><span class="vacio">Todavía no hay accesos registrados.</span></li>';
}

// =====================================================
// USUARIOS
// =====================================================

function filtrarUsuarios() {
    const q = $("q").value.trim().toLowerCase(), f = $("fRol").value, e = $("fEstado").value;
    return listaUsuarios()
        .filter(([, u]) => {
            if (f && u.cargo !== f) return false;
            if (e === "online" && !(u.online && u.activo !== false)) return false;
            if (e === "offline" && (u.online || u.activo === false)) return false;
            if (e === "off" && u.activo !== false) return false;
            if (e === "bloq" && !bloqueado(u)) return false;
            return !q || `${u.nombre} ${u.usuario} ${u.correo}`.toLowerCase().includes(q);
        })
        .sort((a, b) => String(a[1].nombre || a[1].usuario).localeCompare(String(b[1].nombre || b[1].usuario), "es"));
}

function estadoTag(u) {
    if (u.activo === false) return '<span class="tag no">Desactivado</span>';
    if (bloqueado(u)) return '<span class="tag av2">Bloqueado</span>';
    return u.online ? '<span class="tag ok">En línea</span>' : '<span class="tag">Fuera de línea</span>';
}

function pintaUsers() {
    const rows = filtrarUsuarios();
    const total = listaUsuarios().length;
    $("notaUsuarios").textContent = total ? `Mostrando ${rows.length} de ${total} ${total === 1 ? "usuario" : "usuarios"}.` : "Aún no hay usuarios registrados.";

    $("tUsers").innerHTML =
        "<thead><tr><th>Persona</th><th>Usuario</th><th>Cargo</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead><tbody>" +
        (rows.map(([id, u]) => {
            const mio = id === yo;
            return `<tr data-id="${esc(id)}">
                <td class="persona"><div class="p"><span class="av">${esc(iniciales(u.nombre || u.usuario))}</span><div><strong>${esc(u.nombre || "(sin nombre)")}${mio ? ' <span class="tag ok">Tú</span>' : ""}</strong><small>${esc(u.correo)}</small></div></div></td>
                <td data-l="Usuario">${esc(u.usuario)}</td>
                <td data-l="Cargo">${mio ? esc(ROL_TXT[u.cargo] || u.cargo) : `<select data-a="rol" aria-label="Cargo de ${esc(u.usuario)}">${ROLES.map((r) => `<option value="${r}" ${r === u.cargo ? "selected" : ""}>${ROL_TXT[r]}</option>`).join("")}</select>`}</td>
                <td data-l="Estado">${estadoTag(u)}</td>
                <td data-l="Último acceso"><span class="sec">${esc(hace(u.ultimoAcceso))}</span></td>
                <td class="ac"><div class="acc"><button type="button" class="btn btn-mini" data-a="pass">Nueva contraseña</button>${mio ? "" : `${bloqueado(u) ? '<button type="button" class="btn btn-mini" data-a="desbloq">Desbloquear</button>' : ""}<button type="button" class="btn btn-mini" data-a="act">${u.activo === false ? "Activar" : "Desactivar"}</button><button type="button" class="btn btn-mini btn-peligro" data-a="del">Eliminar</button>`}</div></td></tr>`;
        }).join("") || '<tr><td colspan="6" class="vacio">No hay usuarios con ese filtro.</td></tr>') + "</tbody>";
}

$("q").oninput = $("fRol").onchange = $("fEstado").onchange = pintaUsers;

$("tUsers").onchange = async (e) => {
    if (e.target.dataset.a !== "rol") return;
    const id = e.target.closest("tr").dataset.id;
    if (id === yo) { aviso("No puedes cambiar tu propio cargo."); return pintaUsers(); }
    try {
        await update(ref(rtdb, "usuarios/" + id), { cargo: e.target.value, sesion_hash: null, sesion_expira: null });
        aviso("Cargo actualizado.");
    } catch { aviso("No se pudo cambiar el cargo."); pintaUsers(); }
};

$("tUsers").onclick = async (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    const id = b.closest("tr").dataset.id, u = users[id], a = b.dataset.a, r = ref(rtdb, "usuarios/" + id);
    if (!u) return;
    if (id === yo && a !== "pass") return aviso("No puedes hacer esto con tu propia cuenta.");

    try {
        if (a === "pass") {
            await dialogo({
                titulo: "Nueva contraseña",
                html: `<p>Cuenta de <b>${esc(u.usuario)}</b>. Se cerrará su sesión actual.</p><label>Nueva contraseña (mínimo 8 caracteres)<input id="np" type="password" minlength="8" autocomplete="new-password" required></label>`,
                ok: "Cambiar contraseña",
                onOk: async () => {
                    const p = $("np").value;
                    if (p.length < 8) throw new Error("La contraseña necesita mínimo 8 caracteres.");
                    await update(r, { ...(await hashPassword(p)), sesion_hash: null, sesion_expira: null, intentos_fallidos: 0, bloqueado_hasta: null });
                    aviso("Contraseña actualizada.");
                }
            });
        }
        if (a === "desbloq") {
            await update(r, { intentos_fallidos: 0, bloqueado_hasta: null });
            aviso("Cuenta desbloqueada.");
        }
        if (a === "act") {
            await update(r, { activo: u.activo === false, sesion_hash: null, sesion_expira: null, online: false });
            aviso(u.activo === false ? "Cuenta activada." : "Cuenta desactivada.");
        }
        if (a === "del" && await confirmar("Eliminar usuario", `¿Eliminar a ${u.usuario}? No se puede deshacer.`)) {
            await update(ref(rtdb, "usuarios"), { [id]: null });
            aviso("Usuario eliminado.");
        }
    } catch (x) {
        aviso("No se pudo completar la acción.");
    }
};

$("nuevo").onclick = () => {
    const p = dialogo({
        titulo: "Nuevo usuario",
        html: `<label>Nombre y apellido<input id="nN" required></label><label>Correo<input id="nC" type="email" required></label>
            <label>Cargo<select id="nR">${ROLES.map((r) => `<option value="${r}" ${r === "empleado" ? "selected" : ""}>${ROL_TXT[r]}</option>`).join("")}</select></label>
            <label>Contraseña inicial<input id="nP" type="password" minlength="8" autocomplete="new-password" required></label>
            <label id="nKw" hidden>Clave de acceso del administrador (mín. 10, letras y números)<input id="nK" type="password" autocomplete="new-password"></label>`,
        ok: "Crear usuario",
        onOk: async () => {
            const v = (id) => $(id).value.trim(), n = v("nN"), c = v("nC").toLowerCase(), u = c, r = $("nR").value, pw = $("nP").value;
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) throw new Error("Escribe un correo válido.");
            if (pw.length < 8) throw new Error("La contraseña necesita mínimo 8 caracteres.");
            const l = Object.values(users).filter(Boolean);
            if (l.some((x) => String(x.correo).toLowerCase() === c)) throw new Error("Ese correo ya existe.");
            const d = { nombre: n, correo: c, usuario: u, cargo: r, online: false, ultimoAcceso: null, ...(await hashPassword(pw)) };
            if (r === "administrador") {
                const k = $("nK").value, e = validarClaveSupervisor(k, { usuario: u });
                if (e) throw new Error(e);
                const h = await crearHashClave(k);
                Object.assign(d, { clave_hash: h.hash, clave_salt: h.salt, clave_iter: h.iter });
            }
            await push(ref(rtdb, "usuarios"), d);
            aviso("Usuario creado.");
        }
    });
    $("nR").onchange = () => { $("nKw").hidden = $("nR").value !== "administrador"; };
    return p;
};

// Exportar la lista filtrada a CSV (sin contraseñas ni claves)
$("csv").onclick = () => {
    const filas = filtrarUsuarios();
    if (!filas.length) return aviso("No hay usuarios para exportar.");
    const celda = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const estado = (u) => u.activo === false ? "Desactivado" : bloqueado(u) ? "Bloqueado" : u.online ? "En línea" : "Fuera de línea";
    const lineas = [["Nombre", "Usuario", "Correo", "Cargo", "Estado", "Último acceso"].map(celda).join(",")]
        .concat(filas.map(([, u]) => [u.nombre, u.usuario, u.correo, ROL_TXT[u.cargo] || u.cargo, estado(u), u.ultimoAcceso || ""].map(celda).join(",")));
    const blob = new Blob(["﻿" + lineas.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `usuarios-acso-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    aviso(`Se exportaron ${filas.length} usuarios.`);
};

// =====================================================
// RECUPERAR CONTRASEÑAS
// =====================================================

const AB = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REC_TXT = { pendiente: "Pendiente", aprobada: "Código generado", rechazada: "Rechazada", usada: "Completada" };

function pintaRecup() {
    const soloAbiertas = $("fRecup").value === "abiertas";
    const rows = Object.entries(recs)
        .filter(([, r]) => r && (!soloAbiertas || ["pendiente", "aprobada"].includes(r.estado)))
        .sort((a, b) => (b[1].creado || 0) - (a[1].creado || 0));

    $("tRecup").innerHTML =
        "<thead><tr><th>Usuario</th><th>Correo</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead><tbody>" +
        (rows.map(([id, r]) => {
            const vencida = r.estado === "aprobada" && Number(r.expira || 0) < Date.now();
            const abierta = ["pendiente", "aprobada"].includes(r.estado);
            return `<tr data-id="${esc(id)}"><td data-l="Usuario"><strong>${esc(r.usuario)}</strong></td><td data-l="Correo">${esc(r.correo)}</td>
                <td data-l="Estado"><span class="tag ${r.estado === "pendiente" ? "av2" : r.estado === "aprobada" && !vencida ? "ok" : r.estado === "rechazada" ? "no" : ""}">${esc(vencida ? "Código vencido" : REC_TXT[r.estado] || r.estado)}</span></td>
                <td data-l="Fecha"><span class="sec">${r.creado ? esc(new Date(r.creado).toLocaleString("es-CO")) : "—"}</span></td>
                <td class="ac"><div class="acc">${abierta ? `<button type="button" data-a="cod" class="btn btn-mini btn-primario">${vencida || r.estado === "aprobada" ? "Generar otro código" : "Generar código"}</button><button type="button" data-a="no" class="btn btn-mini btn-peligro">Rechazar</button>` : ""}</div></td></tr>`;
        }).join("") || `<tr><td colspan="5" class="vacio">${soloAbiertas ? "No hay solicitudes por atender." : "No hay solicitudes de recuperación."}</td></tr>`) + "</tbody>";
}

$("fRecup").onchange = pintaRecup;

$("tRecup").onclick = async (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    const id = b.closest("tr").dataset.id, r = recs[id];
    if (!r) return;

    try {
        if (b.dataset.a === "no") {
            if (!await confirmar("Rechazar solicitud", `¿Rechazar la solicitud de ${r.usuario}?`, "Rechazar")) return;
            await update(ref(rtdb, "recuperaciones/" + id), { estado: "rechazada", codigo_hash: null, codigo_salt: null });
            return aviso("Solicitud rechazada.");
        }

        const cod = Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => AB[x % AB.length]).join("");
        const h = await crearHashClave(cod);
        await update(ref(rtdb, "recuperaciones/" + id), { estado: "aprobada", codigo_hash: h.hash, codigo_salt: h.salt, codigo_iter: h.iter, expira: Date.now() + 30 * 60000, intentos: 0, aprobado_por: yo });

        const cerrado = dialogo({
            titulo: "Código de recuperación",
            html: `<p>Código para <b>${esc(r.usuario)}</b>. Vence en 30 minutos. Entrégaselo a la persona; <b>no se volverá a mostrar</b>.</p><div class="codigo" id="codTxt">${esc(cod)}</div><button type="button" class="btn btn-mini" id="cpCod">Copiar código</button>`,
            ok: "Listo",
            cancelar: null
        });
        $("cpCod").onclick = async () => {
            try { await navigator.clipboard.writeText(cod); aviso("Código copiado."); }
            catch { aviso("No se pudo copiar. Selecciónalo y cópialo a mano."); }
        };
        await cerrado;
    } catch {
        aviso("No se pudo completar la acción.");
    }
};

// =====================================================
// DATOS DEL SISTEMA
// =====================================================

let stop = null, todas = [], visibles = [];

const vista = (v) => v == null ? "" : v.toDate ? v.toDate().toLocaleString("es-CO") : typeof v === "object" ? JSON.stringify(v).slice(0, 60) : String(v).slice(0, 60);
const idKey = (d) => Object.keys(d).find((k) => /^id/i.test(k)) || Object.keys(d)[0];
const mensajeTabla = (t) => { $("tDatos").innerHTML = `<tbody><tr><td class="vacio">${t}</td></tr></tbody>`; };

function pintaDatos() {
    const q = $("qDatos").value.trim().toLowerCase();
    visibles = q ? todas.filter((r) => Object.values(r.d).some((v) => vista(v).toLowerCase().includes(q))) : todas;
    $("notaDatos").textContent = todas.length ? `${q ? `${visibles.length} de ` : ""}${todas.length} ${todas.length === 1 ? "registro" : "registros"} en esta lista.` : "Elige una lista para consultarla y editarla.";

    if (!visibles.length) return mensajeTabla(todas.length ? "Ningún registro coincide con el filtro." : "Sin registros.");

    const keys = [...new Set(todas.slice(0, 20).flatMap((r) => Object.keys(r.d)))].filter((k) => !/password|hash|salt/i.test(k)).slice(0, 6);
    $("tDatos").innerHTML = `<thead><tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}<th>Acciones</th></tr></thead><tbody>` +
        visibles.map((r, i) => `<tr data-i="${i}">${keys.map((k) => `<td data-l="${esc(k)}">${esc(vista(r.d[k]))}</td>`).join("")}
        <td class="ac"><div class="acc"><button type="button" class="btn btn-mini" data-a="ed">Editar</button><button type="button" class="btn btn-mini btn-peligro" data-a="rm">Eliminar</button></div></td></tr>`).join("") + "</tbody>";
}

function recibir(rows) {
    todas = rows;
    pintaDatos();
}

async function cargarDatos() {
    if (stop) stop();
    stop = null;
    todas = [];
    $("qDatos").value = "";
    mensajeTabla("Cargando…");

    const [t, n] = $("fuente").value.split(":");

    if (t === "fs") {
        stop = onSnapshot(collection(db, n),
            (s) => recibir(s.docs.map((d) => ({ id: d.id, d: d.data() }))),
            (e) => { mensajeTabla("Firebase no permitió leer esta lista."); aviso("Firebase no permitió leer: " + e.code); });
        return;
    }

    const control = new AbortController();
    const tiempo = setTimeout(() => control.abort(), 6000);
    try {
        const r = await fetch(`${API}/${n}`, { signal: control.signal });
        if (!r.ok) throw new Error();
        const j = await r.json();
        recibir((Array.isArray(j) ? j : [j]).map((d) => ({ id: d[idKey(d)], d })));
    } catch {
        todas = [];
        $("notaDatos").textContent = "Elige una lista para consultarla y editarla.";
        mensajeTabla("No hay conexión con la API de Spring Boot (localhost:8080). Enciéndela y vuelve a elegir la lista.");
    } finally {
        clearTimeout(tiempo);
    }
}

$("fuente").onchange = cargarDatos;
$("qDatos").oninput = pintaDatos;

function editar(r) {
    const [t, n] = $("fuente").value.split(":"), f0 = todas[0];
    const base = r ? Object.fromEntries(Object.entries(r.d).filter(([, v]) => !(v && v.toDate)))
        : f0 ? Object.fromEntries(Object.keys(f0.d).filter((k) => !f0.d[k]?.toDate && k !== idKey(f0.d)).map((k) => [k, null])) : {};
    return dialogo({
        titulo: r ? "Editar registro" : "Nuevo registro",
        html: `<label>Datos (JSON)<textarea id="jj" rows="12" spellcheck="false">${esc(JSON.stringify(base, null, 2))}</textarea></label>`,
        onOk: async () => {
            let d;
            try { d = JSON.parse($("jj").value); } catch { throw new Error("El JSON no es válido."); }
            if (t === "fs") { r ? await updateDoc(doc(db, n, r.id), d) : await addDoc(collection(db, n), d); }
            else {
                const x = await fetch(r ? `${API}/${n}/${r.id}` : `${API}/${n}`, { method: r ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
                if (!x.ok) throw new Error("La API respondió " + x.status);
                cargarDatos();
            }
            aviso("Guardado.");
        }
    });
}

$("nuevoDato").onclick = () => editar(null);

$("tDatos").onclick = async (e) => {
    const b = e.target.closest("button[data-a]");
    if (!b) return;
    const r = visibles[b.closest("tr").dataset.i];
    if (!r) return;
    if (b.dataset.a === "ed") return editar(r);
    if (!await confirmar("Eliminar registro", "¿Eliminar este registro? No se puede deshacer.")) return;
    const [t, n] = $("fuente").value.split(":");
    try {
        if (t === "fs") await deleteDoc(doc(db, n, r.id));
        else { const x = await fetch(`${API}/${n}/${r.id}`, { method: "DELETE" }); if (!x.ok) throw new Error(); cargarDatos(); }
        aviso("Eliminado.");
    } catch { aviso("No se pudo eliminar."); }
};

// Vista inicial (permite entrar con admin.html#usuarios)
ir(location.hash.replace("#", "") || "resumen");
