
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    push
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTujbcDDXoN3a-L5p4cEUXD-8llmtD_A",
    authDomain: "sitio-web-acso.firebaseapp.com",
    databaseURL: "https://sitio-web-acso-default-rtdb.firebaseio.com",
    projectId: "sitio-web-acso",
    storageBucket: "sitio-web-acso.firebasestorage.app",
    messagingSenderId: "916869190856",
    appId: "1:916869190856:web:13b6a0f9926139c8f481fd",
    measurementId: "G-3CFS0H850L"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const API_BASE = "http://localhost:8080/api";

const formulario = document.getElementById("formRegistro");

if (!formulario) {
    console.error("No se encontró el formulario con id='formRegistro'.");
} else {

    formulario.addEventListener("submit", async function (e) {

        e.preventDefault();

        const nombre =
            document.getElementById("nombre").value.trim();

        const cargo =
            document.getElementById("cargo").value.trim();

        const correo =
            document.getElementById("correo").value.trim();

        const usuario =
            document.getElementById("usuario").value.trim();

        const password =
            document.getElementById("password").value;

        if (
            !nombre ||
            !cargo ||
            !correo ||
            !usuario ||
            !password
        ) {
            alert("Todos los campos son obligatorios.");
            return;
        }

        if (cargo.toLowerCase() !== "empleado") {
            alert("Para este registro el cargo debe ser empleado.");
            return;
        }

        if (password.length < 8) {
            alert(
                "La contraseña debe tener mínimo 8 caracteres."
            );
            return;
        }

        try {

            // =====================================================
            // COMPROBAR USUARIO EN FIREBASE
            // =====================================================

            const usuariosRef = ref(db, "usuarios");

            const snapshot = await get(usuariosRef);

            if (snapshot.exists()) {

                const usuarios = snapshot.val();

                const usuarioExiste =
                    Object.values(usuarios).some(
                        item =>
                            item.usuario &&
                            item.usuario.toLowerCase() ===
                            usuario.toLowerCase()
                    );

                if (usuarioExiste) {

                    alert(
                        "El nombre de usuario ya está registrado."
                    );

                    return;
                }
            }

            // =====================================================
            // ENVIAR DATOS A SPRING BOOT
            // =====================================================

            console.log(
                "Enviando registro a:",
                `${API_BASE}/usuarios/registro-empleado`
            );

            const respuesta = await fetch(
                `${API_BASE}/usuarios/registro-empleado`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({
                        nombre: nombre,
                        cargo: cargo,
                        correo: correo,
                        usuario: usuario,
                        password: password
                    })
                }
            );

            // =====================================================
            // LEER RESPUESTA SIN ROMPER SI VIENE VACÍA
            // =====================================================

            const textoRespuesta =
                await respuesta.text();

            console.log(
                "Código HTTP:",
                respuesta.status
            );

            console.log(
                "Respuesta del servidor:",
                textoRespuesta
            );

            let resultado = {};

            if (textoRespuesta.trim() !== "") {

                try {

                    resultado =
                        JSON.parse(textoRespuesta);

                } catch (errorJSON) {

                    console.error(
                        "La respuesta del servidor no es JSON:",
                        textoRespuesta
                    );
                }
            }

            // =====================================================
            // COMPROBAR ERROR HTTP
            // =====================================================

            if (!respuesta.ok) {

                console.error(
                    "Error HTTP:",
                    respuesta.status
                );

                console.error(
                    "Respuesta:",
                    resultado
                );

                if (respuesta.status === 401) {

                    alert(
                        "Error 401: Spring Security rechazó la petición.\n\n" +
                        "La petición sí llegó al servidor, pero fue rechazada."
                    );

                } else if (respuesta.status === 403) {

                    alert(
                        "Error 403: Spring Security no permite esta operación."
                    );

                } else {

                    const mensaje =
                        resultado.message ||
                        resultado.mensaje ||
                        `No se pudo registrar el empleado. Código HTTP: ${respuesta.status}`;

                    alert(mensaje);
                }

                return;
            }

            // =====================================================
            // OBTENER IDS GENERADOS
            // =====================================================

            const idEmpleado =
                resultado.id_empleado;

            const idPersona =
                resultado.id_persona;

            const idUsuario =
                resultado.id_usuario;

            console.log(
                "Empleado creado:",
                idEmpleado
            );

            console.log(
                "Persona creada:",
                idPersona
            );

            console.log(
                "Usuario creado:",
                idUsuario
            );

            // =====================================================
            // VERIFICAR ID EMPLEADO
            // =====================================================

            if (!idEmpleado) {

                console.error(
                    "Respuesta completa del backend:",
                    resultado
                );

                alert(
                    "Spring Boot registró la información, pero no devolvió el id_empleado."
                );

                return;
            }

            // =====================================================
            // GUARDAR EN FIREBASE
            // =====================================================

            await push(
                usuariosRef,
                {
                    nombre: nombre,
                    cargo: cargo,
                    correo: correo,
                    usuario: usuario,
                    password: password,
                    id_empleado: idEmpleado,
                    id_persona: idPersona,
                    id_usuario: idUsuario,
                    online: false,
                    ultimoAcceso: null
                }
            );

            // =====================================================
            // REGISTRO TERMINADO
            // =====================================================

            alert(
                "Empleado registrado correctamente.\n\n" +
                "ID empleado: " +
                idEmpleado
            );

            formulario.reset();

            window.location.href =
                "../inicio de sistema/login.html";

        } catch (error) {

            console.error(
                "Error completo:",
                error
            );

            alert(
                "No se pudo completar el registro.\n\n" +
                "Revisa la consola del navegador y la consola de IntelliJ."
            );
        }
    });
}

