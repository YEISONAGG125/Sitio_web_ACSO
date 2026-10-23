// =====================================================
// PERFIL DEL CLIENTE
// =====================================================
// clientes.js ya muestra y edita el formulario del perfil y lo
// guarda en el navegador. Este archivo completa lo que faltaba:
//
//   1. Valida nombre, teléfono y correo antes de guardar.
//   2. Guarda los cambios en Firebase (usuarios/{id}) para que
//      sigan ahí la próxima vez que el cliente inicie sesión.
//   3. Foto de perfil y cambio de contraseña (FIREBASE/perfil.js).
// =====================================================

import { montarPerfil, guardarDatos, validarDatos, pintarIdentidad } from "../FIREBASE/perfil.js";

function avisar(titulo, mensaje) {
    // mostrarToast está definida en clientes.js
    if (typeof window.mostrarToast === "function") {
        window.mostrarToast(titulo, mensaje);
    }
}

const valor = (id) => (document.getElementById(id)?.value || "").trim();


// 1. Validar ANTES de que clientes.js guarde.
//    Se escucha en la ventana y en fase de captura para correr primero.
window.addEventListener("submit", (e) => {

    if (!e.target || e.target.id !== "formPerfil") return;

    const error = validarDatos({
        nombre: valor("perfilNombre"),
        telefono: valor("perfilTelefono"),
        correo: valor("perfilCorreo"),
        direccion: valor("perfilDireccion")
    });

    if (error) {
        e.preventDefault();
        e.stopImmediatePropagation();
        avisar("Revisa tus datos", error);
    }

}, true);


// 2. Guardar en Firebase cuando clientes.js termina de guardar.
window.addEventListener("perfil-guardado", async (e) => {

    const usuario = e.detail || {};

    try {
        const nueva = await guardarDatos(usuario, {
            nombre: (usuario.nombre || "").trim(),
            telefono: (usuario.telefono || "").trim(),
            correo: (usuario.correo || "").trim(),
            direccion: (usuario.direccion || "").trim()
        });

        pintarIdentidad(nueva);
    } catch (error) {
        console.error("No se pudo guardar el perfil en Firebase:", error);
        avisar(
            "No se pudo sincronizar",
            "Tus cambios se guardaron en este navegador pero no en el servidor. Revisa tu conexión."
        );
    }
});


// 3. Foto y contraseña
montarPerfil();
