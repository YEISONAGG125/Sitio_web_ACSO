import { db, rtdb, ref, onValue, update, push, collection, doc, addDoc, updateDoc, onSnapshot } from "../FIREBASE/firebase.js";
import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { protegerAdmin, cerrarSesionSupervisor, vigilarInactividad } from "../FIREBASE/seguridad.js";
import { crearHashClave, validarClaveSupervisor } from "../FIREBASE/cripto.js";
import { hashPassword } from "../FIREBASE/passwords.js";

const API = "http://localhost:8080/api";
const LOGIN = "../inicio de sistema/login.html";
const ROLES = ["administrador", "supervisor", "empleado", "cliente"];
const acceso = await protegerAdmin();
const yo = acceso.id;
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const aviso = (t) => { const e = $("toast"); e.textContent = t; e.classList.add("on"); clearTimeout(aviso.t); aviso.t = setTimeout(() => e.classList.remove("on"), 3500); };
$("yo").textContent = acceso.usuario.nombre || acceso.usuario.usuario;

const salir = async () => { await cerrarSesionSupervisor(); location.replace(LOGIN); };
$("salir").onclick = salir;
vigilarInactividad(salir);

$("nav").onclick = (e) => {
    const b = e.target.closest("[data-v]"); if (!b) return;
    document.querySelectorAll("#nav button").forEach((x) => x.classList.toggle("on", x === b));
    document.querySelectorAll("main > section").forEach((s) => s.hidden = s.id !== "v-" + b.dataset.v);
    if (b.dataset.v === "datos") cargarDatos();
};

function dialogo(titulo, html, ok) {
    $("dT").textContent = titulo; $("dB").innerHTML = html; $("dlg").showModal();
    $("fDlg").onsubmit = async (e) => {
        if (e.submitter?.value !== "ok") return;
        e.preventDefault();
        try { await ok(); $("dlg").close(); } catch (x) { aviso(x.message || "No se pudo guardar."); }
    };
}
let users = {}, recs = {}, pend = { nov: 0, sol: 0 };
onValue(ref(rtdb, "usuarios"), (s) => { users = s.val() || {}; pintaUsers(); kpis(); });
onValue(ref(rtdb, "recuperaciones"), (s) => { recs = s.val() || {}; pintaRecup(); kpis(); });
[["nov", "novedades_laborales"], ["sol", "solicitudes"]].forEach(([k, c]) =>
    onSnapshot(collection(db, c), (s) => { pend[k] = s.docs.filter((d) => d.data().estado === "Pendiente").length; kpis(); }, () => { }));
function kpis() {
    const l = Object.values(users).filter(Boolean), c = (r) => l.filter((u) => u.cargo === r).length;
    const k = [["Administradores", c("administrador")], ["Supervisores", c("supervisor")], ["Empleados", c("empleado")], ["Clientes", c("cliente")],
        ["En línea", l.filter((u) => u.online).length], ["Novedades pendientes", pend.nov], ["Solicitudes pendientes", pend.sol],
        ["Recuperaciones pendientes", Object.values(recs).filter((r) => r.estado === "pendiente").length]];
    $("kpis").innerHTML = k.map(([t, n]) => `<div class="kpi"><b>${n}</b><span>${t}</span></div>`).join("");
}
function pintaUsers() {
    const q = $("q").value.toLowerCase(), f = $("fRol").value;
    const rows = Object.entries(users).filter(([, u]) => u && (!f || u.cargo === f) && `${u.nombre} ${u.usuario} ${u.correo}`.toLowerCase().includes(q));
    $("tUsers").innerHTML = "<tr><th>Nombre</th><th>Usuario</th><th>Correo</th><th>Cargo</th><th>Estado</th><th></th></tr>" +
        (rows.map(([id, u]) => `<tr data-id="${esc(id)}"><td>${esc(u.nombre)}</td><td>${esc(u.usuario)}</td><td>${esc(u.correo)}</td>
        <td><select data-a="rol" aria-label="Cargo">${ROLES.map((r) => `<option ${r === u.cargo ? "selected" : ""}>${r}</option>`).join("")}</select></td>
        <td>${u.activo === false ? '<span class="tag no">Desactivado</span>' : u.online ? '<span class="tag ok">En línea</span>' : '<span class="tag">Fuera de línea</span>'}</td>
        <td class="acc"><button data-a="pass">Nueva contraseña</button><button data-a="act">${u.activo === false ? "Activar" : "Desactivar"}</button><button data-a="del" class="peligro">Eliminar</button></td></tr>`).join("")
        || '<tr><td colspan="6" class="vacio">No hay usuarios con ese filtro.</td></tr>');
}
$("q").oninput = $("fRol").onchange = pintaUsers;

$("tUsers").onchange = async (e) => {
    if (e.target.dataset.a !== "rol") return;
    const id = e.target.closest("tr").dataset.id;
    if (id === yo) { aviso("No puedes cambiar tu propio cargo."); return pintaUsers(); }
    await update(ref(rtdb, "usuarios/" + id), { cargo: e.target.value, sesion_hash: null, sesion_expira: null });
    aviso("Cargo actualizado.");
};

$("tUsers").onclick = async (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const id = b.closest("tr").dataset.id, u = users[id], a = b.dataset.a, r = ref(rtdb, "usuarios/" + id);
    if (id === yo && a !== "pass") return aviso("No puedes hacer esto con tu propia cuenta.");
    if (a === "pass") {
        const p = prompt(`Nueva contraseña para ${u.usuario} (mínimo 8 caracteres):`);
        if (!p) return;
        if (p.length < 8) return aviso("La contraseña necesita mínimo 8 caracteres.");
        await update(r, { ...(await hashPassword(p)), sesion_hash: null, sesion_expira: null, intentos_fallidos: 0, bloqueado_hasta: null });
        aviso("Contraseña actualizada.");
    }
    if (a === "act") await update(r, { activo: u.activo === false, sesion_hash: null, sesion_expira: null, online: false });
    if (a === "del" && confirm(`¿Eliminar a ${u.usuario}? No se puede deshacer.`)) {
        await update(ref(rtdb, "usuarios"), { [id]: null }); aviso("Usuario eliminado.");
    }
};

$("nuevo").onclick = () => {
    dialogo("Nuevo usuario", `<label>Nombre y apellido<input id="nN" required></label><label>Correo<input id="nC" type="email" required></label>
        <label>Usuario<input id="nU" required></label><label>Cargo<select id="nR">${ROLES.map((r) => `<option>${r}</option>`).join("")}</select></label>
        <label>Contraseña inicial<input id="nP" type="password" minlength="8" required></label>
        <label id="nKw" hidden>Clave de acceso del administrador<input id="nK" type="password"></label>`, async () => {
        const v = (id) => $(id).value.trim(), n = v("nN"), c = v("nC").toLowerCase(), u = v("nU"), r = $("nR").value, p = $("nP").value;
        if (u.length < 3 || /\s/.test(u)) throw new Error("El usuario necesita 3 caracteres o más, sin espacios.");
        if (p.length < 8) throw new Error("La contraseña necesita mínimo 8 caracteres.");
        const l = Object.values(users).filter(Boolean);
        if (l.some((x) => String(x.usuario).toLowerCase() === u.toLowerCase())) throw new Error("Ese usuario ya existe.");
        if (l.some((x) => String(x.correo).toLowerCase() === c)) throw new Error("Ese correo ya existe.");
        const d = { nombre: n, correo: c, usuario: u, cargo: r, online: false, ultimoAcceso: null, ...(await hashPassword(p)) };
        if (r === "administrador") {
            const k = $("nK").value, e = validarClaveSupervisor(k, { usuario: u });
            if (e) throw new Error(e);
            const h = await crearHashClave(k);
            Object.assign(d, { clave_hash: h.hash, clave_salt: h.salt, clave_iter: h.iter });
        }
        await push(ref(rtdb, "usuarios"), d);
        aviso("Usuario creado.");
    });
    $("nR").onchange = () => $("nKw").hidden = $("nR").value !== "administrador";
};
const AB = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function pintaRecup() {
    const rows = Object.entries(recs).sort((a, b) => b[1].creado - a[1].creado);
    $("tRecup").innerHTML = "<tr><th>Usuario</th><th>Correo</th><th>Estado</th><th>Fecha</th><th></th></tr>" +
        (rows.map(([id, r]) => `<tr data-id="${esc(id)}"><td>${esc(r.usuario)}</td><td>${esc(r.correo)}</td><td><span class="tag">${esc(r.estado)}</span></td>
        <td>${new Date(r.creado).toLocaleString("es-CO")}</td><td class="acc">${["pendiente", "aprobada"].includes(r.estado)
            ? '<button data-a="cod" class="pri">Generar código</button><button data-a="no" class="peligro">Rechazar</button>' : ""}</td></tr>`).join("")
        || '<tr><td colspan="5" class="vacio">No hay solicitudes de recuperación.</td></tr>');
}
$("tRecup").onclick = async (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const id = b.closest("tr").dataset.id, r = recs[id];
    if (b.dataset.a === "no") { await update(ref(rtdb, "recuperaciones/" + id), { estado: "rechazada", codigo_hash: null, codigo_salt: null }); return aviso("Solicitud rechazada."); }
    const cod = Array.from(crypto.getRandomValues(new Uint8Array(8)), (x) => AB[x % AB.length]).join("");
    const h = await crearHashClave(cod);
    await update(ref(rtdb, "recuperaciones/" + id), { estado: "aprobada", codigo_hash: h.hash, codigo_salt: h.salt, codigo_iter: h.iter, expira: Date.now() + 30 * 60000, intentos: 0, aprobado_por: yo });
    alert(`Código para ${r.usuario}: ${cod}\n\nVence en 30 minutos. Entrégaselo a la persona; no se volverá a mostrar.`);
};


let stop = null, fila = [];
const vista = (v) => v == null ? "" : v.toDate ? v.toDate().toLocaleString("es-CO") : typeof v === "object" ? JSON.stringify(v).slice(0, 60) : String(v).slice(0, 60);
const idKey = (d) => Object.keys(d).find((k) => /^id/i.test(k)) || Object.keys(d)[0];

function tabla(rows) {
    fila = rows;
    const keys = [...new Set(rows.slice(0, 20).flatMap((r) => Object.keys(r.d)))].filter((k) => !/password|hash|salt/i.test(k)).slice(0, 6);
    $("tDatos").innerHTML = `<tr>${keys.map((k) => `<th>${esc(k)}</th>`).join("")}<th></th></tr>` +
        (rows.map((r, i) => `<tr data-i="${i}">${keys.map((k) => `<td>${esc(vista(r.d[k]))}</td>`).join("")}
        <td class="acc"><button data-a="ed">Editar</button><button data-a="rm" class="peligro">Eliminar</button></td></tr>`).join("")
        || '<tr><td class="vacio">Sin registros.</td></tr>');
}

async function cargarDatos() {
    if (stop) stop(); stop = null;
    const [t, n] = $("fuente").value.split(":");
    if (t === "fs") { stop = onSnapshot(collection(db, n), (s) => tabla(s.docs.map((d) => ({ id: d.id, d: d.data() }))), (e) => aviso("Firebase no permitió leer: " + e.code)); return; }
    try {
        const r = await fetch(`${API}/${n}`); if (!r.ok) throw 0;
        const j = await r.json();
        tabla((Array.isArray(j) ? j : [j]).map((d) => ({ id: d[idKey(d)], d })));
    } catch {
        fila = [];
        $("tDatos").innerHTML = '<tr><td class="vacio">No hay conexión con la API de Spring Boot (localhost:8080). Enciéndela y vuelve a elegir la lista.</td></tr>';
    }
}
$("fuente").onchange = cargarDatos;

function editar(r) {
    const [t, n] = $("fuente").value.split(":"), f0 = fila[0];
    const base = r ? Object.fromEntries(Object.entries(r.d).filter(([, v]) => !(v && v.toDate)))
        : f0 ? Object.fromEntries(Object.keys(f0.d).filter((k) => !f0.d[k]?.toDate && k !== idKey(f0.d)).map((k) => [k, null])) : {};
    dialogo(r ? "Editar registro" : "Nuevo registro", `<label>Datos (JSON)<textarea id="jj" rows="12">${esc(JSON.stringify(base, null, 2))}</textarea></label>`, async () => {
        let d; try { d = JSON.parse($("jj").value); } catch { throw new Error("El JSON no es válido."); }
        if (t === "fs") { r ? await updateDoc(doc(db, n, r.id), d) : await addDoc(collection(db, n), d); }
        else {
            const x = await fetch(r ? `${API}/${n}/${r.id}` : `${API}/${n}`, { method: r ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
            if (!x.ok) throw new Error("La API respondió " + x.status);
            cargarDatos();
        }
        aviso("Guardado.");
    });
}
$("nuevoDato").onclick = () => editar(null);
$("tDatos").onclick = async (e) => {
    const b = e.target.closest("button[data-a]"); if (!b) return;
    const r = fila[b.closest("tr").dataset.i];
    if (b.dataset.a === "ed") return editar(r);
    if (!confirm("¿Eliminar este registro? No se puede deshacer.")) return;
    const [t, n] = $("fuente").value.split(":");
    try {
        if (t === "fs") await deleteDoc(doc(db, n, r.id));
        else { const x = await fetch(`${API}/${n}/${r.id}`, { method: "DELETE" }); if (!x.ok) throw 0; cargarDatos(); }
        aviso("Eliminado.");
    } catch { aviso("No se pudo eliminar."); }
};
