import {
    rtdb as db,
    ref,
    get,
    push
} from "../FIREBASE/firebase.js";
import {
    verificarCodigoAutorizacion,
    crearHashClave,
    validarClaveSupervisor
} from "../FIREBASE/seguridad.js";
const API_BASE = "http://localhost:8080/api";

const CARGOS = ["empleado", "supervisor", "cliente"];

const NOMBRE_CARGO = {
    empleado: "Empleado",
    supervisor: "Supervisor",
    cliente: "Cliente"
};
const bloqueSupervisor = document.getElementById("bloqueSupervisor");
const selectCargo = document.getElementById("cargo");

selectCargo.addEventListener("change", () => {
    bloqueSupervisor.hidden = selectCargo.value !== "supervisor";
});

const formulario = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");
const btnRegistro = document.getElementById("btnRegistro");
const btnText = document.getElementById("btnText");
const btnArrow = document.getElementById("btnArrow");
const passwordInput = document.getElementById("password");
const mostrarPassword = document.getElementById("mostrarPassword");
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
    btnArrow.textContent = activo ? "" : "";
}

if (mostrarPassword) {
    mostrarPassword.addEventListener("click", () => {
        const visible = passwordInput.type === "text";
        passwordInput.type = visible ? "password" : "text";
        mostrarPassword.textContent = visible ? "Mostrar" : "Ocultar";
    });
}
// Sincroniza al empleado con el servidor Spring Boot (opcional).
// Nunca debe impedir el registro: si el servidor está apagado, tarda o
// responde con error, la cuenta se crea igual en Firebase.
async function registrarEmpleadoEnServidor(datos) {

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 5000);

    try {
        const respuesta = await fetch(`${API_BASE}/usuarios/registro-empleado`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(datos),
            signal: controlador.signal
        });

        if (!respuesta.ok) {
            console.warn(`Servidor Spring Boot respondió ${respuesta.status}; se registra solo en Firebase.`);
            return { estado: "error" };
        }

        const texto = await respuesta.text();
        let json = {};

        try {
            json = texto.trim() ? JSON.parse(texto) : {};
        } catch {
            json = {};
        }

        return { estado: "ok", datos: json };

    } catch (error) {
        console.warn("Servidor Spring Boot no disponible; se registra solo en Firebase:", error);
        return { estado: "offline" };

    } finally {
        clearTimeout(temporizador);
    }
}
formulario.addEventListener("submit", async (e) => {

    e.preventDefault();
    limpiarMensaje();

    const nombre = document.getElementById("nombre").value.trim();
    const cargo = document.getElementById("cargo").value.trim().toLowerCase();
    const correo = document.getElementById("correo").value.trim().toLowerCase();
    const usuario = correo; // el ingreso es con correo
    const password = passwordInput.value;
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
    let claveSupervisor = null;

    if (cargo === "supervisor") {

        const codigo = document.getElementById("codigoAut").value;
        const claveSup = document.getElementById("claveSup").value;
        const claveSupConf = document.getElementById("claveSupConfirmar").value;

        if (!codigo || !claveSup || !claveSupConf) {
            mostrarMensaje("Para registrarte como supervisor completa el código y la clave de supervisor.", "error");
            return;
        }

        const errorClave = validarClaveSupervisor(claveSup, { password, usuario });

        if (errorClave) {
            mostrarMensaje(errorClave, "error");
            return;
        }

        if (claveSup !== claveSupConf) {
            mostrarMensaje("Las claves de supervisor no coinciden.", "error");
            return;
        }

        claveSupervisor = claveSup;
    }

    cargando(true);

    try {
        if (cargo === "supervisor") {

            const estado = await verificarCodigoAutorizacion(document.getElementById("codigoAut").value);

            if (estado === "no_configurado") {
                mostrarMensaje("El registro de supervisores no está habilitado todavía. Contacta al administrador.", "error");
                cargando(false);
                return;
            }

            if (estado !== "ok") {
                mostrarMensaje("Código de autorización incorrecto.", "error");
                cargando(false);
                return;
            }
        }
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
        const registro = {
            nombre: nombre,
            cargo: cargo,
            correo: correo,
            usuario: usuario,
            password: password,
            online: false,
            ultimoAcceso: null
        };
        if (claveSupervisor) {
            const h = await crearHashClave(claveSupervisor);
            registro.clave_hash = h.hash;
            registro.clave_salt = h.salt;
            registro.clave_iter = h.iter;
        }
        if (cargo === "empleado") {

            const resultado = await registrarEmpleadoEnServidor({
                nombre, cargo, correo, usuario, password
            });

            if (resultado.estado === "ok") {
                const d = resultado.datos || {};
                if (d.id_empleado != null) registro.id_empleado = d.id_empleado;
                if (d.id_persona != null) registro.id_persona = d.id_persona;
                if (d.id_usuario != null) registro.id_usuario = d.id_usuario;
            }
        }
        await push(usuariosRef, registro);

        mostrarMensaje(
            `Cuenta de ${NOMBRE_CARGO[cargo].toLowerCase()} creada correctamente. Redirigiendo al inicio de sesión...`,
            "success"
        );

        formulario.reset();
        bloqueSupervisor.hidden = true;
        btnText.textContent = "Cuenta creada";
        btnArrow.textContent = "";

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