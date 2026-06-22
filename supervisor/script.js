import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
getDatabase,
ref,
onValue
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

let cargo = localStorage.getItem("cargo");

if(cargo !== "supervisor"){

alert("Acceso denegado");

window.location.href="../inicio de sistema/login.html";

}

window.mostrar=function(id,elemento){

document.querySelectorAll(".contenido").forEach(seccion=>{

seccion.classList.remove("active");

});

document.querySelectorAll(".tab").forEach(tab=>{

tab.classList.remove("active");

});

document.getElementById(id).classList.add("active");

elemento.classList.add("active");

}

const lista=document.getElementById("listaUsuarios");

onValue(ref(db,"usuarios"),(snapshot)=>{

lista.innerHTML="";

if(!snapshot.exists()) return;

const usuarios=snapshot.val();

for(let id in usuarios){

const u=usuarios[id];

lista.innerHTML+=`

<div class="fila">

<div>${u.nombre}</div>

<div>${u.cargo}</div>

<div>${u.correo}</div>

<div>${u.online ? "🟢 Online" : "🔴 Offline"}</div>

</div>

`;

}

});