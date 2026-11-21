// =====================================================
// ACSO · Páginas del supervisor fuera del panel principal
// (Configuración y Reportes)
//
// Comprueba la sesión, pinta el nombre en la barra superior y deja
// funcionando "Cerrar sesión" y el cierre por inactividad.
// =====================================================
import { protegerSupervisor, cerrarSesionSupervisor, vigilarInactividad } from "./seguridad.js";

const LOGIN = new URL("../inicio de sistema/login.html", import.meta.url).href;

export async function iniciarSubpagina() {

    const acceso = await protegerSupervisor();
    const usuario = acceso.usuario || {};
    const nombre = usuario.nombre || usuario.nombre_completo || usuario.usuario || "Supervisor";

    const nombreEl = document.getElementById("usuarioNombre");
    const avatarEl = document.getElementById("usuarioAvatar");
    if (nombreEl) nombreEl.textContent = nombre;
    if (avatarEl) avatarEl.textContent = nombre.trim().slice(0, 2).toUpperCase() || "S";

    async function salir() {
        const quiere = window.ACSO?.confirmar
            ? await window.ACSO.confirmar({
                titulo: "Cerrar sesión",
                mensaje: "¿Deseas cerrar tu sesión?",
                aceptar: "Sí, cerrar sesión",
                peligro: false
            })
            : confirm("¿Deseas cerrar tu sesión?");
        if (!quiere) return;
        await cerrarSesionSupervisor();
        window.location.replace(LOGIN);
    }

    document.querySelectorAll("#btnCerrarSesion, #btnCerrarSesion2")
        .forEach(b => b.addEventListener("click", salir));

    vigilarInactividad(async () => {
        await cerrarSesionSupervisor();
        alert("Tu sesión se cerró por inactividad.");
        window.location.replace(LOGIN);
    });

    return acceso;
}
