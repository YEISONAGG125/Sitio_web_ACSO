
import { rtdb, ref, get, update } from "./firebase.js";
import {
    crearHashClave,
    verificarHashClave,
    sha256,
    nuevoToken,
    compararSeguro
} from "./cripto.js";
 
export { crearHashClave, validarClaveSupervisor } from "./cripto.js";
 
 
export const MAX_INTENTOS = 3;
export const BLOQUEO_MINUTOS = 15;
export const SESION_HORAS = 8;
export const INACTIVIDAD_MINUTOS = 15;
 
const CLAVE_SESION = "acso_sesion_supervisor";
// Se resuelve respecto a ESTE archivo, así funciona desde cualquier carpeta
const LOGIN_URL = new URL("../inicio de sistema/login.html", import.meta.url).href;
 
 
// =====================================================
// CÓDIGO DE AUTORIZACIÓN
// =====================================================
 
// Devuelve: "ok" | "incorrecto" | "no_configurado"
export async function verificarCodigoAutorizacion(codigo) {
 
    const snap = await get(ref(rtdb, "config/seguridad"));
 
    if (!snap.exists()) return "no_configurado";
 
    const c = snap.val() || {};
 
    if (!c.codigo_hash || !c.codigo_salt) return "no_configurado";
 
    const ok = await verificarHashClave(codigo, {
        hash: c.codigo_hash,
        salt: c.codigo_salt,
        iter: c.codigo_iter
    });
 
    return ok ? "ok" : "incorrecto";
}
 
 
// =====================================================
// BLOQUEO POR INTENTOS FALLIDOS
// =====================================================
 
// Devuelve los minutos que faltan (0 si no está bloqueado)
export async function minutosBloqueado(idUsuario) {
 
    const snap = await get(ref(rtdb, `usuarios/${idUsuario}/bloqueado_hasta`));
    const hasta = Number(snap.val() || 0);
    const falta = hasta - Date.now();
 
    return falta > 0 ? Math.ceil(falta / 60000) : 0;
}
 
// Suma un fallo. Devuelve los intentos que quedan (0 = bloqueado ahora)
export async function registrarFallo(idUsuario) {
 
    const refUsuario = ref(rtdb, `usuarios/${idUsuario}`);
    const snap = await get(ref(rtdb, `usuarios/${idUsuario}/intentos_fallidos`));
    const intentos = Number(snap.val() || 0) + 1;
 
    if (intentos >= MAX_INTENTOS) {
        await update(refUsuario, {
            intentos_fallidos: 0,
            bloqueado_hasta: Date.now() + BLOQUEO_MINUTOS * 60000
        });
        return 0;
    }
 
    await update(refUsuario, { intentos_fallidos: intentos });
    return MAX_INTENTOS - intentos;
}
 
export async function limpiarFallos(idUsuario) {
    await update(ref(rtdb, `usuarios/${idUsuario}`), {
        intentos_fallidos: 0,
        bloqueado_hasta: null
    });
}
 
 
// =====================================================
// CLAVE DE SUPERVISOR (segundo paso)
// =====================================================
 
export function tieneClave(usuario) {
    return Boolean(usuario && usuario.clave_hash && usuario.clave_salt);
}
 
export async function verificarClaveDeUsuario(usuario, clave) {
    return verificarHashClave(clave, {
        hash: usuario.clave_hash,
        salt: usuario.clave_salt,
        iter: usuario.clave_iter
    });
}
 
// Guarda la clave (solo el hash) de un supervisor existente
export async function guardarClaveSupervisor(idUsuario, clave) {
 
    const { hash, salt, iter } = await crearHashClave(clave);
 
    await update(ref(rtdb, `usuarios/${idUsuario}`), {
        clave_hash: hash,
        clave_salt: salt,
        clave_iter: iter
    });
}
 
 
 
// Se llama SOLO cuando el segundo paso salió bien.
export async function abrirSesionSupervisor(idUsuario) {
 
    const token = nuevoToken();
    const tokenHash = await sha256(token);
    const expira = Date.now() + SESION_HORAS * 3600000;
 
    // En la base de datos solo queda el hash del token
    await update(ref(rtdb, `usuarios/${idUsuario}`), {
        sesion_hash: tokenHash,
        sesion_expira: expira
    });
 
    // El token vive solo en esta pestaña (se borra al cerrarla)
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({
        id: idUsuario,
        token
    }));
}
 
function leerSesionLocal() {
    try {
        return JSON.parse(sessionStorage.getItem(CLAVE_SESION));
    } catch {
        return null;
    }
}
 
export async function cerrarSesionSupervisor() {
 
    const s = leerSesionLocal();
 
    try {
        if (s && s.id) {
            await update(ref(rtdb, `usuarios/${s.id}`), {
                sesion_hash: null,
                sesion_expira: null,
                online: false
            });
        }
    } catch (e) {
        console.warn("No se pudo cerrar la sesión en el servidor:", e);
    }
 
    sessionStorage.removeItem(CLAVE_SESION);
    ["usuarioLogueado", "usuario", "cargo", "id_empleado", "nombre_empleado"]
        .forEach(k => localStorage.removeItem(k));
}
 
 
 
function expulsar(motivo) {
 
    sessionStorage.removeItem(CLAVE_SESION);
    ["usuarioLogueado", "cargo"].forEach(k => localStorage.removeItem(k));
 
    if (motivo) alert(motivo);
 
    window.location.replace(LOGIN_URL);
 
    // Congela este módulo para que nada más se ejecute
    return new Promise(() => { });
}
 
export const protegerSupervisor = () => protegerRol("supervisor");
export const protegerAdmin = () => protegerRol("administrador");
 
async function protegerRol(rol) {
 
    const s = leerSesionLocal();
 
    if (!s || !s.id || !s.token) {
        return expulsar("Acceso denegado. Inicia sesión como supervisor.");
    }
 
    let usuario;
 
    try {
        const snap = await get(ref(rtdb, `usuarios/${s.id}`));
        usuario = snap.val();
    } catch (e) {
        console.error("No se pudo verificar la sesión:", e);
        return expulsar("No se pudo verificar tu sesión. Inicia sesión de nuevo.");
    }
 
    if (!usuario || String(usuario.cargo || "").toLowerCase() !== rol) {
        return expulsar("Acceso denegado.");
    }
 
    const hashLocal = await sha256(s.token);
 
    if (!usuario.sesion_hash || !compararSeguro(hashLocal, usuario.sesion_hash)) {
        return expulsar("Tu sesión no es válida. Inicia sesión de nuevo.");
    }
 
    if (Number(usuario.sesion_expira || 0) < Date.now()) {
        return expulsar("Tu sesión expiró. Inicia sesión de nuevo.");
    }
 
    // Todo en orden: mostrar la página
    const estilo = document.getElementById("guard-style");
    if (estilo) estilo.remove();
 
    return { id: s.id, usuario };
}
 
 
 
export function vigilarInactividad(alExpirar) {
 
    const limite = INACTIVIDAD_MINUTOS * 60000;
    let temporizador;
 
    const reiniciar = () => {
        clearTimeout(temporizador);
        temporizador = setTimeout(alExpirar, limite);
    };
 
    ["click", "keydown", "mousemove", "scroll", "touchstart"]
        .forEach(ev => window.addEventListener(ev, reiniciar, { passive: true }));
 
    reiniciar();
}
 