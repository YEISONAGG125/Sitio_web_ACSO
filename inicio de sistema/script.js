
import {
    rtdb as db,
    ref,
    get,
    child,
    update,
    onDisconnect
} from "../FIREBASE/firebase.js";

import { passwordCorrecta } from "../FIREBASE/passwords.js";

import {
    verificarCodigoAutorizacion,
    minutosBloqueado,
    registrarFallo,
    limpiarFallos,
    tieneClave,
    verificarClaveDeUsuario,
    guardarClaveSupervisor,
    abrirSesionSupervisor,
    validarClaveSupervisor,
    MAX_INTENTOS
} from "../FIREBASE/seguridad.js";


// ======================================
// ELEMENTOS
// ======================================

const loginForm = document.getElementById("loginForm");
const usuarioInput = document.getElementById("usuario");
const passwordInput = document.getElementById("password");
const recordarme = document.getElementById("recordarme");
const mensaje = document.getElementById("mensaje");

const btnLogin = document.getElementById("btnLogin");
const btnText = document.getElementById("btnText");
const btnArrow = document.getElementById("btnArrow");

// Segundo paso (supervisor)
const supervisorForm = document.getElementById("supervisorForm");
const mensajeSup = document.getElementById("mensajeSup");
const supTitulo = document.getElementById("supTitulo");
const supSubtitulo = document.getElementById("supSubtitulo");
const grupoCodigo = document.getElementById("grupoCodigo");
const grupoClaveConfirmar = document.getElementById("grupoClaveConfirmar");
const ayudaClave = document.getElementById("ayudaClave");
const labelClaveSup = document.getElementById("labelClaveSup");
const codigoAut = document.getElementById("codigoAut");
const claveSup = document.getElementById("claveSup");
const claveSupConfirmar = document.getElementById("claveSupConfirmar");
const btnSup = document.getElementById("btnSup");
const btnSupText = document.getElementById("btnSupText");
const btnSupArrow = document.getElementById("btnSupArrow");
const btnCancelarSup = document.getElementById("btnCancelarSup");


// ======================================
// MENSAJES
// ======================================

function mostrarMensaje(texto, tipo, destino = mensaje) {
    if (!destino) return;

    destino.textContent = texto;
    destino.className = "mensaje " + tipo;
}


function limpiarMensaje() {
    [mensaje, mensajeSup].forEach((m) => {
        if (!m) return;
        m.textContent = "";
        m.className = "mensaje";
    });
}


// ======================================
// RECORDAR USUARIO
// ======================================

const usuarioGuardado = localStorage.getItem("usuarioRecordado");

if (usuarioGuardado) {
    usuarioInput.value = usuarioGuardado;
    recordarme.checked = true;
}


// ======================================
// LOGIN - PASO 1: USUARIO Y CONTRASEÑA
// ======================================

// Usuario que pasó el paso 1 y espera el paso 2 (solo supervisores)
let supervisorPendiente = null;

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    limpiarMensaje();

    const usuarioIngresado = usuarioInput.value.trim();
    const passwordIngresada = passwordInput.value;


    // ======================================
    // VALIDACIÓN
    // ======================================

    if (usuarioIngresado === "" || passwordIngresada === "") {

        mostrarMensaje(
            "Completa todos los campos.",
            "error"
        );

        return;
    }


    // ======================================
    // BOTÓN CARGANDO
    // ======================================

    btnLogin.disabled = true;
    btnText.textContent = "Verificando...";
    btnArrow.textContent = "⏳";


    try {

        // ======================================
        // OBTENER USUARIOS
        // ======================================

        const snapshot = await get(
            child(
                ref(db),
                "usuarios"
            )
        );


        if (!snapshot.exists()) {

            mostrarMensaje(
                "No hay usuarios registrados en Firebase.",
                "error"
            );

            restaurarBoton();
            return;
        }


        const usuarios = snapshot.val();

        let usuarioEncontrado = null;


        // ======================================
        // BUSCAR USUARIO
        // ======================================

        for (const id in usuarios) {

            const datos = usuarios[id];

            if (!datos) continue;


            const usuarioFirebase =
                String(datos.usuario || "").trim();

            const passwordFirebase =
                String(datos.password || "");


            if (
                usuarioFirebase === usuarioIngresado &&
                await passwordCorrecta(datos, passwordIngresada)
            ) {

                usuarioEncontrado = {
                    id: id,
                    ...datos
                };

                break;
            }
        }


        // ======================================
        // USUARIO NO ENCONTRADO
        // ======================================

        if (usuarioEncontrado && usuarioEncontrado.activo === false) {
            mostrarMensaje("Tu cuenta está desactivada. Contacta al administrador.", "error");
            restaurarBoton();
            return;
        }

        if (!usuarioEncontrado) {

            mostrarMensaje(
                "Usuario o contraseña incorrectos.",
                "error"
            );

            restaurarBoton();
            return;
        }


        // ======================================
        // RECORDAR USUARIO
        // ======================================

        if (recordarme.checked) {

            localStorage.setItem(
                "usuarioRecordado",
                usuarioIngresado
            );

        } else {

            localStorage.removeItem(
                "usuarioRecordado"
            );
        }


        const cargo = String(
            usuarioEncontrado.cargo || ""
        )
            .toLowerCase()
            .trim();


        // ======================================
        // SUPERVISOR -> NECESITA SEGUNDO PASO
        // ======================================
        // Todavía NO se guarda ninguna sesión.

        if (cargo === "supervisor" || cargo === "administrador") {

            await iniciarSegundoPaso(usuarioEncontrado);
            return;
        }


        // ======================================
        // EMPLEADO / CLIENTE -> ENTRA DIRECTO
        // ======================================

        await completarLogin(usuarioEncontrado);


    } catch (error) {

        console.error(
            "Error de inicio de sesión:",
            error
        );


        mostrarMensaje(
            "No se pudo conectar con Firebase. Revisa tu conexión.",
            "error"
        );


        restaurarBoton();
    }

});


// ======================================
// LOGIN - PASO 2: SUPERVISOR
// ======================================

async function iniciarSegundoPaso(usuario) {

    // ¿Está bloqueado por intentos fallidos?

    const minutos = await minutosBloqueado(usuario.id);

    if (minutos > 0) {

        mostrarMensaje(
            `Cuenta bloqueada por seguridad. Intenta de nuevo en ${minutos} min.`,
            "error"
        );

        restaurarBoton();
        return;
    }


    supervisorPendiente = usuario;

    const primeraVez = !tieneClave(usuario);

    // Preparar el formulario según el caso
    grupoCodigo.hidden = !primeraVez;
    grupoClaveConfirmar.hidden = !primeraVez;
    ayudaClave.hidden = !primeraVez;

    if (primeraVez) {

        supTitulo.textContent = "Activa tu acceso de supervisor";
        supSubtitulo.textContent =
            "Tu cuenta aún no tiene clave de supervisor. Necesitas el código de autorización.";
        labelClaveSup.textContent = "Crea tu clave de supervisor";
        btnSupText.textContent = "Activar y entrar";

    } else {

        supTitulo.textContent = "Verificación de supervisor";
        supSubtitulo.textContent =
            "Ingresa tu clave de supervisor para continuar";
        labelClaveSup.textContent = "Clave de supervisor";
        btnSupText.textContent = "Verificar";
    }

    codigoAut.value = "";
    claveSup.value = "";
    claveSupConfirmar.value = "";

    loginForm.hidden = true;
    supervisorForm.hidden = false;

    (primeraVez ? codigoAut : claveSup).focus();

    restaurarBoton();
}


supervisorForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    limpiarMensaje();

    const usuario = supervisorPendiente;

    if (!usuario) {
        volverAlPaso1();
        return;
    }

    const clave = claveSup.value;

    btnSup.disabled = true;
    btnSupText.textContent = "Verificando...";
    btnSupArrow.textContent = "⏳";

    try {

        // El bloqueo se revisa otra vez en cada intento
        const minutos = await minutosBloqueado(usuario.id);

        if (minutos > 0) {

            mostrarMensaje(
                `Cuenta bloqueada por seguridad. Intenta de nuevo en ${minutos} min.`,
                "error",
                mensajeSup
            );

            restaurarBotonSup();
            return;
        }


        // ----------------------------------
        // PRIMERA VEZ: ACTIVAR CLAVE
        // ----------------------------------

        if (!tieneClave(usuario)) {

            if (!codigoAut.value || !clave || !claveSupConfirmar.value) {

                mostrarMensaje("Completa todos los campos.", "error", mensajeSup);
                restaurarBotonSup();
                return;
            }

            const estado = await verificarCodigoAutorizacion(codigoAut.value);

            if (estado === "no_configurado") {

                mostrarMensaje(
                    "El acceso de supervisores aún no está habilitado. Contacta al administrador del sistema.",
                    "error",
                    mensajeSup
                );

                restaurarBotonSup();
                return;
            }

            if (estado !== "ok") {

                // Un código incorrecto también cuenta como intento fallido
                await manejarFallo(usuario, "Código de autorización incorrecto.");
                return;
            }

            const errorClave = validarClaveSupervisor(clave, {
                password: usuario.password,
                usuario: usuario.usuario
            });

            if (errorClave) {

                mostrarMensaje(errorClave, "error", mensajeSup);
                restaurarBotonSup();
                return;
            }

            if (clave !== claveSupConfirmar.value) {

                mostrarMensaje("Las claves no coinciden.", "error", mensajeSup);
                restaurarBotonSup();
                return;
            }

            await guardarClaveSupervisor(usuario.id, clave);

        } else {

            // ----------------------------------
            // CASO NORMAL: VERIFICAR CLAVE
            // ----------------------------------

            if (!clave) {

                mostrarMensaje("Escribe tu clave de supervisor.", "error", mensajeSup);
                restaurarBotonSup();
                return;
            }

            const correcta = await verificarClaveDeUsuario(usuario, clave);

            if (!correcta) {

                await manejarFallo(usuario, "Clave de supervisor incorrecta.");
                return;
            }
        }


        // ----------------------------------
        // TODO CORRECTO: ABRIR SESIÓN
        // ----------------------------------

        await limpiarFallos(usuario.id);
        await abrirSesionSupervisor(usuario.id);

        mostrarMensaje(
            "Verificación correcta. Redirigiendo...",
            "success",
            mensajeSup
        );

        btnSupText.textContent = "Bienvenido";
        btnSupArrow.textContent = "✓";

        await completarLogin(usuario, mensajeSup);

    } catch (error) {

        console.error("Error en la verificación de supervisor:", error);

        mostrarMensaje(
            "No se pudo verificar. Revisa tu conexión e inténtalo de nuevo.",
            "error",
            mensajeSup
        );

        restaurarBotonSup();
    }
});


async function manejarFallo(usuario, textoBase) {

    const quedan = await registrarFallo(usuario.id);

    if (quedan === 0) {

        mostrarMensaje(
            "Demasiados intentos fallidos. La cuenta quedó bloqueada por seguridad.",
            "error",
            mensajeSup
        );

        // Se devuelve al inicio: ya no puede seguir intentando
        setTimeout(volverAlPaso1, 2500);
        restaurarBotonSup();
        return;
    }

    mostrarMensaje(
        `${textoBase} Te quedan ${quedan} de ${MAX_INTENTOS} intentos.`,
        "error",
        mensajeSup
    );

    claveSup.value = "";
    restaurarBotonSup();
}


function volverAlPaso1() {

    supervisorPendiente = null;

    supervisorForm.hidden = true;
    loginForm.hidden = false;

    passwordInput.value = "";
    codigoAut.value = "";
    claveSup.value = "";
    claveSupConfirmar.value = "";

    limpiarMensaje();
    restaurarBoton();
    restaurarBotonSup();
}


btnCancelarSup.addEventListener("click", volverAlPaso1);


// ======================================
// COMPLETAR LOGIN (guarda sesión y redirige)
// ======================================

async function completarLogin(usuarioEncontrado, destinoMensaje = mensaje) {

    const cargo = String(
        usuarioEncontrado.cargo || ""
    )
        .toLowerCase()
        .trim();


    const nombre =
        usuarioEncontrado.nombre ||
        usuarioEncontrado.nombre_completo ||
        usuarioEncontrado.nombre_cliente ||
        usuarioEncontrado.nombre_empleado ||
        usuarioEncontrado.usuario ||
        "Usuario";


    // ======================================
    // GUARDAR USUARIO INDIVIDUAL
    // ======================================

    localStorage.setItem(
        "usuario",
        usuarioEncontrado.usuario || ""
    );


    // ======================================
    // GUARDAR CARGO
    // ======================================

    localStorage.setItem(
        "cargo",
        cargo
    );


    // ======================================
    // GUARDAR ID EMPLEADO
    // ======================================

    if (usuarioEncontrado.id_empleado) {

        localStorage.setItem(
            "id_empleado",
            String(usuarioEncontrado.id_empleado)
        );

    } else {

        localStorage.removeItem("id_empleado");
    }


    // ======================================
    // GUARDAR NOMBRE EMPLEADO
    // ======================================

    if (usuarioEncontrado.nombre_empleado) {

        localStorage.setItem(
            "nombre_empleado",
            usuarioEncontrado.nombre_empleado
        );
    }


    // ======================================
    // GUARDAR SESIÓN COMPLETA
    // ======================================
    // (solo datos de perfil: nunca contraseñas ni hashes)

    const usuarioSesion = {

        id: usuarioEncontrado.id,

        usuario:
            usuarioEncontrado.usuario || "",

        cargo:
            cargo,

        nombre:
            nombre,

        nombre_completo:
            usuarioEncontrado.nombre_completo || nombre,

        nombre_empleado:
            usuarioEncontrado.nombre_empleado || "",

        nombre_cliente:
            usuarioEncontrado.nombre_cliente || "",

        id_empleado:
            usuarioEncontrado.id_empleado || null,

        id_cliente:
            usuarioEncontrado.id_cliente || null,

        id_usuario:
            usuarioEncontrado.id_usuario || null,

        correo:
            usuarioEncontrado.correo || "",

        telefono:
            usuarioEncontrado.telefono || "",

        direccion:
            usuarioEncontrado.direccion || ""
    };


    localStorage.setItem(
        "usuarioLogueado",
        JSON.stringify(usuarioSesion)
    );


    // ======================================
    // USUARIO ONLINE
    // ======================================

    const usuarioRef = ref(
        db,
        "usuarios/" + usuarioEncontrado.id
    );


    await update(
        usuarioRef,
        {
            online: true,
            ultimoAcceso: new Date().toISOString()
        }
    );


    // ======================================
    // DESCONEXIÓN
    // ======================================

    await onDisconnect(usuarioRef).update({
        online: false
    });


    // ======================================
    // LOGIN CORRECTO
    // ======================================

    if (cargo !== "supervisor" && cargo !== "administrador") {

        mostrarMensaje(
            "Inicio de sesión correcto. Redirigiendo...",
            "success",
            destinoMensaje
        );

        btnText.textContent = "Bienvenido";
        btnArrow.textContent = "✓";
    }


    // ======================================
    // REDIRECCIÓN SEGÚN CARGO
    // ======================================

    setTimeout(() => {

        if (cargo === "empleado") {
            window.location.href = "../empleado/empleado.html";
            return;
        }

        if (cargo === "supervisor") {
            window.location.href = "../supervisor/supervisor.html";
            return;
        }

        if (cargo === "administrador") {
            window.location.href = "../admin/admin.html";
            return;
        }

        if (cargo === "cliente") {
            window.location.href = "../cliente/Cliente.html";
            return;
        }

        // ==================================
        // CARGO NO VÁLIDO
        // ==================================

        localStorage.removeItem("usuarioLogueado");
        localStorage.removeItem("cargo");

        mostrarMensaje(
            "El usuario inició sesión, pero no tiene un cargo válido.",
            "error"
        );

        restaurarBoton();

    }, 1000);
}


// ======================================
// RESTAURAR BOTONES
// ======================================

function restaurarBoton() {

    btnLogin.disabled = false;

    btnText.textContent = "Entrar";

    btnArrow.textContent = "→";
}


function restaurarBotonSup() {

    btnSup.disabled = false;

    btnSupText.textContent =
        supervisorPendiente && !tieneClave(supervisorPendiente)
            ? "Activar y entrar"
            : "Verificar";

    btnSupArrow.textContent = "→";
}
