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

if (cargo !== "supervisor") {
    alert("Acceso denegado");
    window.location.href = "../inicio de sistema/login.html";
}

window.mostrar = function(id, elemento) {
    document.querySelectorAll(".contenido").forEach(seccion => {
        seccion.classList.remove("active");
    });

    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.remove("active");
    });

    const seccion = document.getElementById(id);

    if (seccion) {
        seccion.classList.add("active");
    }

    if (elemento) {
        elemento.classList.add("active");
    }
};

const lista = document.getElementById("listaUsuarios");

if (lista) {
    onValue(ref(db, "usuarios"), (snapshot) => {
        lista.innerHTML = "";

        if (!snapshot.exists()) {
            lista.innerHTML = `
                <div class="fila">
                    <div>No hay usuarios registrados</div>
                </div>
            `;
            return;
        }

        const usuarios = snapshot.val();

        for (let id in usuarios) {
            const u = usuarios[id];

            lista.innerHTML += `
                <div class="fila">
                    <div>${u.nombre ?? ""}</div>
                    <div>${u.cargo ?? ""}</div>
                    <div>${u.correo ?? ""}</div>
                    <div>
                        ${u.online ? "🟢 Online" : "🔴 Offline"}
                    </div>
                </div>
            `;
        }
    });
}

async function cargarContratos() {
    const tabla = document.getElementById("tablaContratos");

    if (!tabla) return;

    try {
        const respuesta = await fetch(
            "http://localhost:8080/api/reportes/contratos"
        );

        if (!respuesta.ok) {
            throw new Error("Error al consultar contratos");
        }

        const contratos = await respuesta.json();

        tabla.innerHTML = "";

        if (contratos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay contratos registrados
                    </td>
                </tr>
            `;
            return;
        }

        contratos.forEach(contrato => {
            tabla.innerHTML += `
                <tr>
                    <td>${contrato.id_contrato ?? ""}</td>
                    <td>${contrato.id_cliente ?? ""}</td>
                    <td>${contrato.numero_contrato ?? ""}</td>
                    <td>${contrato.fecha_inicio ?? ""}</td>
                    <td>${contrato.fecha_fin ?? ""}</td>
                    <td>${contrato.valor_total ?? ""}</td>
                    <td>${contrato.ubicacion ?? ""}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error contratos:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    ❌ Error al cargar los contratos
                </td>
            </tr>
        `;
    }
}

async function cargarClientes() {
    const tabla = document.getElementById("tablaClientes");

    if (!tabla) return;

    try {
        const respuesta = await fetch(
            "http://localhost:8080/api/reportes/clientes"
        );

        if (!respuesta.ok) {
            throw new Error("Error al consultar clientes");
        }

        const clientes = await respuesta.json();

        tabla.innerHTML = "";

        if (clientes.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="4">
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }

        clientes.forEach(cliente => {
            tabla.innerHTML += `
                <tr>
                    <td>${cliente.id_cliente ?? ""}</td>
                    <td>${cliente.id_persona ?? ""}</td>
                    <td>${cliente.razon_social ?? ""}</td>
                    <td>${cliente.tipo_persona ?? ""}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error clientes:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    ❌ Error al cargar los clientes
                </td>
            </tr>
        `;
    }
}

async function cargarNovedades() {
    const tabla = document.getElementById("tablaNovedades");

    if (!tabla) return;

    try {
        const respuesta = await fetch(
            "http://localhost:8080/api/reportes/novedad_laboral"
        );

        if (!respuesta.ok) {
            throw new Error("Error al consultar novedades");
        }

        const novedades = await respuesta.json();

        tabla.innerHTML = "";

        if (novedades.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="3">
                        No hay novedades laborales
                    </td>
                </tr>
            `;
            return;
        }

        novedades.forEach(novedad => {
            tabla.innerHTML += `
                <tr>
                    <td>${novedad.id_novedad ?? ""}</td>
                    <td>${novedad.id_empleado ?? ""}</td>
                    <td>${novedad.tipo_novedad ?? ""}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error novedades:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="3">
                    ❌ Error al cargar novedades
                </td>
            </tr>
        `;
    }
}

function mostrarNotificacion(titulo, mensaje) {
    const lista = document.getElementById("listaNotificaciones");

    if (!lista) return;

    const notificacion = document.createElement("div");

    notificacion.className = "notificacion";

    notificacion.innerHTML = `
        <div class="icono-notificacion">
            🔔
        </div>

        <div>
            <strong>${titulo}</strong>
            <p>${mensaje}</p>
        </div>
    `;

    lista.prepend(notificacion);
}

async function cargarProductos() {
    const tabla = document.getElementById("tablaProductos");

    if (!tabla) return;

    try {
        const respuesta = await fetch(
            "http://localhost:8080/api/reportes/productos"
        );

        if (!respuesta.ok) {
            throw new Error("Error al consultar productos");
        }

        const productos = await respuesta.json();

        tabla.innerHTML = "";

        if (productos.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay productos registrados
                    </td>
                </tr>
            `;
            return;
        }

        productos.forEach(producto => {
            tabla.innerHTML += `
                <tr>
                    <td>${producto.id_producto ?? ""}</td>
                    <td>${producto.id_proveedor ?? ""}</td>
                    <td>${producto.nombre_producto ?? ""}</td>
                    <td>${producto.descripcion ?? ""}</td>
                    <td>${producto.cantidad ?? ""}</td>
                    <td>${producto.stock ?? ""}</td>
                    <td>${producto.precio ?? ""}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error productos:", error);

        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    ❌ Error al cargar los productos
                </td>
            </tr>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    cargarContratos();
    cargarClientes();
    cargarNovedades();
    cargarProductos();
});

