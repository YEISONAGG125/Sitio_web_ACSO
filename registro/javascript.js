// =====================================================
// REGISTRO ACSO
// Permite crear cuentas de: empleado, supervisor y cliente
// - Los usuarios se guardan en Realtime Database ("usuarios")
// - Para empleados, si el servidor Spring Boot está encendido,
//   también se registra allí (si está apagado, el registro
//   continúa solo en Firebase).
// =====================================================

import {
    rtdb as db,
    ref,
    get,
    push
} from "../FIREBASE/firebase.js";


const API_BASE = "http://localhost:8080/api";

const CARGOS = ["empleado", "supervisor", "cliente"];

const NOMBRE_CARGO = {
    empleado: "Empleado",
    supervisor: "Supervisor",
    cliente: "Cliente"
};


// =====================================================
// ELEMENTOS
// =====================================================

const formulario = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");
const btnRegistro = document.getElementById("btnRegistro");
const btnText = document.getElementById("btnText");
const btnArrow = document.getElementById("btnArrow");
const passwordInput = document.getElementById("password");
const mostrarPassword = document.getElementById("mostrarPassword");


// =====================================================
// MENSAJES EN PANTALLA
// =====================================================

function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje " + tipo;
    mensaje.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "mensaje";
}

function cargando(activo) {
    btnRegistro.disabled = activo;
    btnText.textContent = activo ? "Creando cuenta..." : "Crear cuenta";
    btnArrow.textContent = activo ? "⏳" : "→";
}


// =====================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// =====================================================

if (mostrarPassword) {
    mostrarPassword.addEventListener("click", () => {
        const visible = passwordInput.type === "text";
        passwordInput.type = visible ? "password" : "text";
        mostrarPassword.textContent = visible ? "👁" : "🙈";
    });
}


// =====================================================
// REGISTRO EN SPRING BOOT (SOLO EMPLEADOS, OPCIONAL)
// Devuelve:  { estado: "ok", datos }  |  { estado: "offline" }
//            { estado: "error", mensaje }
// =====================================================

async function registrarEmpleadoEnServidor(datos) {

    let respuesta;

    try {
        respuesta = await fetch(`${API_BASE}/usuarios/registro-empleado`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(datos)
        });
    } catch (error) {
        // Servidor apagado o sin conexión: se continúa solo con Firebase
        console.warn("Servidor Spring Boot no disponible:", error);
        return { estado: "offline" };
    }

    const texto = await respuesta.text();
    let json = {};

    try {
        json = texto.trim() ? JSON.parse(texto) : {};
    } catch {
        json = {};
    }

    if (!respuesta.ok) {
        return {
            estado: "error",
            mensaje:
                json.message ||
                json.mensaje ||
                (respuesta.status === 401 || respuesta.status === 403
                    ? "El servidor no permitió el registro (permisos)."
                    : `El servidor rechazó el registro (código ${respuesta.status}).`)
        };
    }

    return { estado: "ok", datos: json };
}


// =====================================================
// REGISTRAR
// =====================================================

formulario.addEventListener("submit", async (e) => {

    e.preventDefault();
    limpiarMensaje();

    const nombre = document.getElementById("nombre").value.trim();
    const cargo = document.getElementById("cargo").value.trim().toLowerCase();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const usuario = document.getElementById("usuario").value.trim();
    const password = passwordInput.value;

    // ---------- VALIDACIONES ----------

    if (!nombre || !cargo || !correo || !usuario || !password) {
        mostrarMensaje("Todos los campos son obligatorios.", "error");
        return;
    }

    if (!CARGOS.includes(cargo)) {
        mostrarMensaje("Selecciona un cargo válido: empleado, supervisor o cliente.", "error");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
        mostrarMensaje("Escribe un correo electrónico válido.", "error");
        return;
    }

    if (usuario.length < 3 || /\s/.test(usuario)) {
        mostrarMensaje("El usuario debe tener mínimo 3 caracteres y sin espacios.", "error");
        return;
    }

    if (password.length < 8) {
        mostrarMensaje("La contraseña debe tener mínimo 8 caracteres.", "error");
        return;
    }

    cargando(true);

    try {

        // ---------- ¿YA EXISTE? ----------

        const usuariosRef = ref(db, "usuarios");
        const snapshot = await get(usuariosRef);

        if (snapshot.exists()) {

            const existentes = Object.values(snapshot.val()).filter(Boolean);

            if (existentes.some(u => String(u.usuario || "").toLowerCase() === usuario.toLowerCase())) {
                mostrarMensaje("Ese nombre de usuario ya está registrado.", "error");
                cargando(false);
                return;
            }

            if (existentes.some(u => String(u.correo || "").toLowerCase() === correo)) {
                mostrarMensaje("Ese correo ya está registrado.", "error");
                cargando(false);
                return;
            }
        }

        // ---------- DATOS BASE ----------

        const registro = {
            nombre: nombre,
            cargo: cargo,
            correo: correo,
            usuario: usuario,
            password: password,
            online: false,
            ultimoAcceso: null
        };

        // ---------- EMPLEADO: SPRING BOOT (SI ESTÁ ENCENDIDO) ----------

        if (cargo === "empleado") {

            const resultado = await registrarEmpleadoEnServidor({
                nombre, cargo, correo, usuario, password
            });

            if (resultado.estado === "error") {
                mostrarMensaje(resultado.mensaje, "error");
                cargando(false);
                return;
            }

            if (resultado.estado === "ok") {
                const d = resultado.datos || {};
                if (d.id_empleado != null) registro.id_empleado = d.id_empleado;
                if (d.id_persona != null) registro.id_persona = d.id_persona;
                if (d.id_usuario != null) registro.id_usuario = d.id_usuario;
            }
        }

        // ---------- GUARDAR EN FIREBASE ----------

        await push(usuariosRef, registro);

        mostrarMensaje(
            `Cuenta de ${NOMBRE_CARGO[cargo].toLowerCase()} creada correctamente. Redirigiendo al inicio de sesión...`,
            "success"
        );

        formulario.reset();
        btnText.textContent = "Cuenta creada";
        btnArrow.textContent = "✓";

        setTimeout(() => {
            window.location.href = "../inicio de sistema/login.html";
        }, 1800);

    } catch (error) {

        console.error("Error en el registro:", error);

        mostrarMensaje(
            "No se pudo completar el registro. Revisa tu conexión e inténtalo de nuevo.",
            "error"
        );

        cargando(false);
    }
});
