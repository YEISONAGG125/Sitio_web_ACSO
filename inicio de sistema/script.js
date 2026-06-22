import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    child,
    update,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTujbcDDXo3N2a-L5p4cEUXD-8llmtD_A",
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

document.getElementById("loginForm").addEventListener("submit", async (e) => {

    e.preventDefault();

    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    try {

        const snapshot = await get(child(ref(db), "usuarios"));

        if (!snapshot.exists()) {
            alert("No existen usuarios.");
            return;
        }

        const usuarios = snapshot.val();

        let encontrado = null;
        let uid = null;

        for (const key in usuarios) {

            if (
                usuarios[key].usuario === usuario &&
                usuarios[key].password === password
            ) {
                encontrado = usuarios[key];
                uid = key;
                break;
            }

        }

        if (!encontrado) {
            alert("Usuario o contraseña incorrectos.");
            return;
        }

        localStorage.setItem("usuario", encontrado.usuario);
        localStorage.setItem("cargo", encontrado.cargo);

        const estadoRef = ref(db, "usuarios/" + uid);


        await update(estadoRef, {
            online: true,
            ultimoAcceso: Date.now()
        });

        const desconexion = onDisconnect(estadoRef);

        await desconexion.update({
            online: false,
            ultimoAcceso: Date.now()
        });

        alert("Bienvenido a ACSO");

        if (encontrado.cargo === "empleado") {

            window.location.href = "../empleado/empleado.html";

        } else if (encontrado.cargo === "supervisor") {

            window.location.href = "../supervisor/supervisor.html";

        } else if (encontrado.cargo === "cliente") {

            window.location.href = "../cliente/cliente.html";

        }

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});