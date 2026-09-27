
import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    child,
    update,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


// ======================================
// FIREBASE
// ======================================

const firebaseConfig = {
    apiKey: "AIzaSyDTujbcDDXoN3a-L5p4cEUXD-8llmtD_A",
    authDomain: "sitio-web-acso.firebaseapp.com",
    databaseURL: "https://sitio-web-acso-default-rtdb.firebaseio.com",
    projectId: "sitio-web-acso",
    storageBucket: "sitio-web-acso.firebasestorage.app",
    messagingSenderId: "916869190856",
    appId: "1:916869190856:web:13a6a0f9926139c8f481fd",
    measurementId: "G-3CFS0H850L"
};


// ======================================
// INICIALIZAR FIREBASE
// ======================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


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


// ======================================
// MENSAJES
// ======================================

function mostrarMensaje(texto, tipo) {
    if (!mensaje) return;

    mensaje.textContent = texto;
    mensaje.className = "mensaje " + tipo;
}


function limpiarMensaje() {
    if (!mensaje) return;

    mensaje.textContent = "";
    mensaje.className = "mensaje";
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
// LOGIN
// ======================================

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
                passwordFirebase === passwordIngresada
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


        // ======================================
        // OBTENER DATOS DEL USUARIO
        // ======================================

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
        // ESTA ES LA PARTE IMPORTANTE
        // PARA clientes.js

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

        mostrarMensaje(
            "Inicio de sesión correcto. Redirigiendo...",
            "success"
        );


        btnText.textContent = "Bienvenido";
        btnArrow.textContent = "✓";


        // ======================================
        // REDIRECCIÓN SEGÚN CARGO
        // ======================================

        setTimeout(() => {

            // ==================================
            // EMPLEADO
            // ==================================

            if (cargo === "empleado") {

                window.location.href =
                    "../empleado/empleado.html";

                return;
            }


            // ==================================
            // SUPERVISOR
            // ==================================

            if (cargo === "supervisor") {

                window.location.href =
                    "../supervisor/supervisor.html";

                return;
            }


            // ==================================
            // CLIENTE
            // ==================================

            if (cargo === "cliente") {

                window.location.href =
                    "../cliente/cliente.html";

                return;
            }


            // ==================================
            // CARGO NO VÁLIDO
            // ==================================

            mostrarMensaje(
                "El usuario inició sesión, pero no tiene un cargo válido.",
                "error"
            );

            restaurarBoton();

        }, 1000);


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
// RESTAURAR BOTÓN
// ======================================

function restaurarBoton() {

    btnLogin.disabled = false;

    btnText.textContent = "Entrar";

    btnArrow.textContent = "→";
}


// ======================================
// OLVIDÉ CONTRASEÑA
// ======================================

const forgotPassword =
    document.getElementById("forgotPassword");


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            mostrarMensaje(
                "Para recuperar tu contraseña, comunícate con el administrador del sistema.",
                "error"
            );
        }
    );
}

