import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    get,
    child
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

document.getElementById("formRegistro").addEventListener("submit", async function(e){

    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const cargo = document.getElementById("cargo").value;
    const correo = document.getElementById("correo").value;
    const usuario = document.getElementById("usuario").value;
    const password = document.getElementById("password").value;

    try{

        const snapshot = await get(child(ref(db),"usuarios"));

        if(snapshot.exists()){

            const usuarios = snapshot.val();

            for(let id in usuarios){

                if(usuarios[id].usuario === usuario){

                    alert("Ese usuario ya existe.");
                    return;

                }

            }

        }

        await push(ref(db,"usuarios"),{

            nombre,
            cargo,
            correo,
            usuario,
            password,

            online:false,
            ultimoAcceso:null

        });

        alert("Usuario registrado correctamente.");

        document.getElementById("formRegistro").reset();

        window.location.href="../inicio de sistema/login.html";

    }catch(error){

        console.error(error);

        alert("Error al registrar el usuario.");

    }

});