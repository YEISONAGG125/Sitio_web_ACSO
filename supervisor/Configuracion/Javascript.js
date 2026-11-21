
// =====================================================
// CONFIGURACIÓN
// =====================================================

// =====================================================
// DATOS DEL SUPERVISOR (salen de la sesión guardada al iniciar sesión)
// =====================================================

function leerSesion() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogueado")) || {};
    } catch {
        return {};
    }
}

const sesion = leerSesion();

const idSupervisor =
    sesion.id ||
    localStorage.getItem("id_usuario") ||
    localStorage.getItem("id_supervisor") ||
    "";

const nombreSupervisor =
    sesion.nombre_completo ||
    sesion.nombre ||
    sesion.usuario ||
    localStorage.getItem("nombre_usuario") ||
    "Supervisor";

const correoSupervisor =
    sesion.correo ||
    localStorage.getItem("correo") ||
    localStorage.getItem("correo_usuario") ||
    "No registrado";


// =====================================================
// INICIO
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    cargarDatosPerfil();

    cargarConfiguracionLocal();

    configurarEventos();

});


// =====================================================
// PERFIL
// =====================================================

function cargarDatosPerfil() {

    document.getElementById(
        "nombreSupervisor"
    ).textContent = nombreSupervisor;

    document.getElementById(
        "idSupervisor"
    ).textContent =
        idSupervisor || "-";

    document.getElementById(
        "correoSupervisor"
    ).textContent =
        correoSupervisor;

    const inicial =
        nombreSupervisor
            .trim()
            .charAt(0)
            .toUpperCase();

    document.getElementById(
        "avatarSupervisor"
    ).textContent =
        inicial || "S";
}


// =====================================================
// EVENTOS
// =====================================================

// Editar el perfil y cambiar la contraseña se hacen en «Mi perfil» del panel
function irAlPerfil() {
    window.location.href = "../supervisor.html#perfil";
}


function configurarEventos() {

    document.getElementById(
        "btnGuardar"
    ).addEventListener(
        "click",
        guardarConfiguracion
    );


    document.getElementById(
        "btnRestaurar"
    ).addEventListener(
        "click",
        restaurarConfiguracion
    );


    document.getElementById("btnEditarPerfil").addEventListener("click", irAlPerfil);


    document.getElementById("btnCambiarPassword").addEventListener("click", irAlPerfil);


    document.getElementById(
        "btnCerrarSesion"
    ).addEventListener(
        "click",
        cerrarSesion
    );


    document.getElementById(
        "modoOscuro"
    ).addEventListener(
        "change",
        cambiarModo
    );
}


// =====================================================
// GUARDAR CONFIGURACIÓN
// =====================================================

function guardarConfiguracion() {

    const configuracion = {

        notificacionesNovedades:
            document.getElementById(
                "notificacionesNovedades"
            ).checked,

        notificacionesIncapacidades:
            document.getElementById(
                "notificacionesIncapacidades"
            ).checked,

        notificacionesServicios:
            document.getElementById(
                "notificacionesServicios"
            ).checked,

        notificacionesInventario:
            document.getElementById(
                "notificacionesInventario"
            ).checked,

        actualizacionAutomatica:
            document.getElementById(
                "actualizacionAutomatica"
            ).checked,

        mostrarCompletados:
            document.getElementById(
                "mostrarCompletados"
            ).checked,

        modoOscuro:
            document.getElementById(
                "modoOscuro"
            ).checked,

        intervaloActualizacion:
            document.getElementById(
                "intervaloActualizacion"
            ).value

    };


    localStorage.setItem(
        "configuracion_supervisor",
        JSON.stringify(configuracion)
    );


    mostrarMensaje(
        "✅ Configuración guardada correctamente."
    );


    console.log(
        "Configuración:",
        configuracion
    );
}


// =====================================================
// CARGAR CONFIGURACIÓN
// =====================================================

function cargarConfiguracionLocal() {

    const guardada =
        localStorage.getItem(
            "configuracion_supervisor"
        );

    if (!guardada) {
        return;
    }

    try {

        const configuracion =
            JSON.parse(guardada);


        document.getElementById(
            "notificacionesNovedades"
        ).checked =
            configuracion.notificacionesNovedades;


        document.getElementById(
            "notificacionesIncapacidades"
        ).checked =
            configuracion.notificacionesIncapacidades;


        document.getElementById(
            "notificacionesServicios"
        ).checked =
            configuracion.notificacionesServicios;


        document.getElementById(
            "notificacionesInventario"
        ).checked =
            configuracion.notificacionesInventario;


        document.getElementById(
            "actualizacionAutomatica"
        ).checked =
            configuracion.actualizacionAutomatica;


        document.getElementById(
            "mostrarCompletados"
        ).checked =
            configuracion.mostrarCompletados;


        document.getElementById(
            "modoOscuro"
        ).checked =
            configuracion.modoOscuro;


        document.getElementById(
            "intervaloActualizacion"
        ).value =
            configuracion.intervaloActualizacion;


        aplicarModo();

    } catch (error) {

        console.error(
            "Error leyendo configuración:",
            error
        );

    }
}


// =====================================================
// RESTAURAR
// =====================================================

function restaurarConfiguracion() {

    const confirmar =
        confirm(
            "¿Quieres restaurar la configuración original?"
        );

    if (!confirmar) {
        return;
    }


    localStorage.removeItem(
        "configuracion_supervisor"
    );


    document.getElementById(
        "notificacionesNovedades"
    ).checked = true;

    document.getElementById(
        "notificacionesIncapacidades"
    ).checked = true;

    document.getElementById(
        "notificacionesServicios"
    ).checked = true;

    document.getElementById(
        "notificacionesInventario"
    ).checked = false;

    document.getElementById(
        "actualizacionAutomatica"
    ).checked = true;

    document.getElementById(
        "mostrarCompletados"
    ).checked = false;

    document.getElementById(
        "modoOscuro"
    ).checked = false;

    document.getElementById(
        "intervaloActualizacion"
    ).value = "60";


    aplicarModo();


    mostrarMensaje(
        "↩ Configuración restaurada."
    );
}


// =====================================================
// MODO
// =====================================================

function cambiarModo() {

    aplicarModo();

}


function aplicarModo() {

    const oscuro =
        document.getElementById(
            "modoOscuro"
        ).checked;

    if (oscuro) {

        document.body.classList.remove(
            "modo-claro"
        );

    } else {

        document.body.classList.add(
            "modo-claro"
        );

    }
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

async function cerrarSesion() {

    if (!confirm("¿Seguro que deseas cerrar sesión?")) {
        return;
    }

    try {
        // Invalida el token en el servidor y borra la sesión local
        const seguridad = await import("../../FIREBASE/seguridad.js");
        await seguridad.cerrarSesionSupervisor();
    } catch (error) {
        console.warn("No se pudo cerrar la sesión en el servidor:", error);
    }


    ["usuarioLogueado", "usuario", "cargo"].forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem("acso_sesion_supervisor");

    localStorage.removeItem(
        "id_usuario"
    );

    localStorage.removeItem(
        "id_supervisor"
    );

    localStorage.removeItem(
        "nombre_usuario"
    );

    localStorage.removeItem(
        "nombreSupervisor"
    );

    localStorage.removeItem(
        "correo"
    );

    localStorage.removeItem(
        "correo_usuario"
    );


    window.location.href =
        "../../inicio%20de%20sistema/login.html";
}


// =====================================================
// MENSAJE
// =====================================================

function mostrarMensaje(texto) {

    const mensaje =
        document.getElementById(
            "mensaje"
        );

    mensaje.textContent =
        texto;

    mensaje.classList.add(
        "mostrar"
    );


    setTimeout(() => {

        mensaje.classList.remove(
            "mostrar"
        );

    }, 3000);
}
