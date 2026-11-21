// =====================================================
// ACSO · Configuración del supervisor
// Las preferencias se guardan en este navegador y las usa el panel
// principal (supervisor.html) para decidir qué avisos mostrar.
// =====================================================
import { iniciarSubpagina } from "../../FIREBASE/subpagina.js";

const CLAVE = "configuracion_supervisor";
const POR_DEFECTO = {
    notificacionesNovedades: true,
    notificacionesIncapacidades: true,
    notificacionesServicios: true
};
const $ = (id) => document.getElementById(id);

const acceso = await iniciarSubpagina();

// ---------- Cuenta ----------
const u = acceso.usuario || {};
const nombre = u.nombre || u.nombre_completo || u.usuario || "Supervisor";
$("nombreSupervisor").textContent = nombre;
$("correoSupervisor").textContent = u.correo || "No registrado";
$("avatarSupervisor").textContent = nombre.trim().charAt(0).toUpperCase() || "S";

// ---------- Preferencias ----------
function leer() {
    try {
        return { ...POR_DEFECTO, ...JSON.parse(localStorage.getItem(CLAVE) || "{}") };
    } catch {
        return { ...POR_DEFECTO };
    }
}

function pintar(c) {
    Object.keys(POR_DEFECTO).forEach(k => { $(k).checked = c[k] !== false; });
}

function mostrarAviso(texto) {
    const t = $("toast");
    t.textContent = texto;
    t.classList.add("mostrar");
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(() => t.classList.remove("mostrar"), 3500);
}

pintar(leer());

$("formConfig").addEventListener("submit", (e) => {
    e.preventDefault();
    const c = {};
    Object.keys(POR_DEFECTO).forEach(k => { c[k] = $(k).checked; });
    try {
        localStorage.setItem(CLAVE, JSON.stringify(c));
        mostrarAviso("✅ Preferencias guardadas.");
    } catch {
        mostrarAviso("❌ No se pudo guardar en este navegador.");
    }
});

$("btnRestaurar").addEventListener("click", async () => {
    const si = await window.ACSO.confirmar({
        titulo: "Restaurar valores",
        mensaje: "Todos los avisos volverán a activarse.",
        aceptar: "Sí, restaurar",
        peligro: false
    });
    if (!si) return;
    try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
    pintar(POR_DEFECTO);
    mostrarAviso("↩ Valores restaurados.");
});

// Se abre después del clic actual para que no lo cierre el «clic fuera» del panel
$("abrirA11y").addEventListener("click", () => setTimeout(() => $("acsoBtnA11y")?.click(), 0));
