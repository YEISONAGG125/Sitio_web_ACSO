import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =====================================================
   FIREBASE
===================================================== */

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


/* =====================================================
   API SPRING BOOT
===================================================== */

const API_BASE = "http://localhost:8080/api";


/* =====================================================
   VERIFICAR CARGO
===================================================== */

const cargo = localStorage.getItem("cargo");

if (cargo !== "supervisor") {

    alert("Acceso denegado");

    window.location.href =
        "../inicio de sistema/login.html";
}


/* =====================================================
   CAMBIAR DE SECCIÓN
===================================================== */

window.mostrar = function(id, elemento) {

    // Ocultar todas las secciones
    document.querySelectorAll(".contenido").forEach(seccion => {

        seccion.classList.remove("active");

    });


    // Quitar active de todos los botones
    document.querySelectorAll(".tab").forEach(tab => {

        tab.classList.remove("active");

    });


    // Mostrar sección seleccionada
    const seccion = document.getElementById(id);

    if (seccion) {

        seccion.classList.add("active");

    }


    // Activar botón seleccionado
    if (elemento) {

        elemento.classList.add("active");

    }


    // Cargar datos dependiendo de la sección
    if (id === "Personal") {

        cargarPersonal();

    }

    if (id === "NovedadLaboral") {

        cargarNovedades();

    }

    if (id === "Inventario") {

        cargarProductos();

    }

    if (id === "Contratos") {

        cargarContratos();

    }

    if (id === "Clientes") {

        cargarClientes();

    }

};


/* =====================================================
   PERSONAL DESDE FIREBASE
===================================================== */

function cargarPersonal() {

    const lista =
        document.getElementById("listaUsuarios");

    if (!lista) return;


    onValue(
        ref(db, "usuarios"),
        snapshot => {

            lista.innerHTML = "";


            if (!snapshot.exists()) {

                lista.innerHTML = `
                    <tr>
                        <td colspan="4">
                            No hay usuarios registrados
                        </td>
                    </tr>
                `;

                actualizarContador(
                    "totalPersonal",
                    0
                );

                return;
            }


            const usuarios = snapshot.val();

            let cantidad = 0;


            for (const id in usuarios) {

                const u = usuarios[id];

                cantidad++;


                const fila =
                    document.createElement("tr");


                fila.innerHTML = `

                    <td>
                        ${u.nombre ?? "Sin nombre"}
                    </td>

                    <td>
                        ${u.cargo ?? "Sin cargo"}
                    </td>

                    <td>
                        ${u.correo ?? "Sin correo"}
                    </td>

                    <td>
                        ${
                            u.online
                                ? '<span class="estado-online">🟢 Online</span>'
                                : '<span class="estado-offline">🔴 Offline</span>'
                        }
                    </td>

                `;


                lista.appendChild(fila);

            }


            actualizarContador(
                "totalPersonal",
                cantidad
            );

        },

        error => {

            console.error(
                "Error Firebase:",
                error
            );

            lista.innerHTML = `
                <tr>
                    <td colspan="4">
                        ❌ No se pudo cargar el personal
                    </td>
                </tr>
            `;

        }
    );

}


/* =====================================================
   CONTRATOS
===================================================== */

async function cargarContratos() {

    const tabla =
        document.getElementById("tablaContratos");

    if (!tabla) return;


    try {

        const respuesta = await fetch(
            `${API_BASE}/reportes/contratos`
        );


        if (!respuesta.ok) {

            throw new Error(
                "Error al consultar contratos"
            );

        }


        const contratos =
            await respuesta.json();


        tabla.innerHTML = "";


        if (
            !Array.isArray(contratos) ||
            contratos.length === 0
        ) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="7">
                        No hay contratos registrados
                    </td>
                </tr>
            `;

            actualizarContador(
                "totalContratos",
                0
            );

            return;

        }


        contratos.forEach(contrato => {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>
                    ${contrato.id_contrato ?? "-"}
                </td>

                <td>
                    ${contrato.id_cliente ?? "-"}
                </td>

                <td>
                    ${contrato.numero_contrato ?? "-"}
                </td>

                <td>
                    ${contrato.fecha_inicio ?? "-"}
                </td>

                <td>
                    ${contrato.fecha_fin ?? "-"}
                </td>

                <td>
                    $ ${contrato.valor_total ?? "0"}
                </td>

                <td>
                    ${contrato.ubicacion ?? "-"}
                </td>

            `;


            tabla.appendChild(fila);

        });


        actualizarContador(
            "totalContratos",
            contratos.length
        );


    } catch (error) {

        console.error(
            "Error contratos:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="7">
                    ❌ Error al cargar los contratos
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   CLIENTES
===================================================== */

async function cargarClientes() {

    const tabla =
        document.getElementById("tablaClientes");

    if (!tabla) return;


    try {

        const respuesta = await fetch(
            `${API_BASE}/reportes/clientes`
        );


        if (!respuesta.ok) {

            throw new Error(
                "Error al consultar clientes"
            );

        }


        const clientes =
            await respuesta.json();


        tabla.innerHTML = "";


        if (
            !Array.isArray(clientes) ||
            clientes.length === 0
        ) {

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

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>
                    ${cliente.id_cliente ?? "-"}
                </td>

                <td>
                    ${cliente.id_persona ?? "-"}
                </td>

                <td>
                    ${cliente.razon_social ?? "-"}
                </td>

                <td>
                    ${cliente.tipo_persona ?? "-"}
                </td>

            `;


            tabla.appendChild(fila);

        });


    } catch (error) {

        console.error(
            "Error clientes:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    ❌ Error al cargar los clientes
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   NOVEDADES LABORALES
===================================================== */

async function cargarNovedades() {

    const tabla =
        document.getElementById("tablaNovedades");

    if (!tabla) return;


    try {

        const respuesta = await fetch(
            `${API_BASE}/reportes/novedad_laboral`
        );


        if (!respuesta.ok) {

            throw new Error(
                "Error al consultar novedades"
            );

        }


        const novedades =
            await respuesta.json();


        tabla.innerHTML = "";


        if (
            !Array.isArray(novedades) ||
            novedades.length === 0
        ) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="4">
                        No hay novedades laborales
                    </td>
                </tr>
            `;

            actualizarContador(
                "totalNovedades",
                0
            );

            return;

        }


        novedades.forEach(novedad => {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>
                    ${novedad.id_novedad ?? "-"}
                </td>

                <td>
                    ${novedad.id_empleado ?? "-"}
                </td>

                <td>
                    ${novedad.tipo_novedad ?? "-"}
                </td>

                <td>
                    ${novedad.descripcion ?? "-"}
                </td>

            `;


            tabla.appendChild(fila);

        });


        actualizarContador(
            "totalNovedades",
            novedades.length
        );


    } catch (error) {

        console.error(
            "Error novedades:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="4">
                    ❌ Error al cargar novedades
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   PRODUCTOS
===================================================== */

async function cargarProductos() {

    const tabla =
        document.getElementById("tablaProductos");

    if (!tabla) return;


    try {

        const respuesta = await fetch(
            `${API_BASE}/reportes/productos`
        );


        if (!respuesta.ok) {

            throw new Error(
                "Error al consultar productos"
            );

        }


        const productos =
            await respuesta.json();


        tabla.innerHTML = "";


        if (
            !Array.isArray(productos) ||
            productos.length === 0
        ) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="6">
                        No hay productos registrados
                    </td>
                </tr>
            `;

            actualizarContador(
                "totalProductos",
                0
            );

            return;

        }


        productos.forEach(producto => {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>
                    ${producto.id_producto ?? "-"}
                </td>

                <td>
                    ${producto.id_proveedor ?? "-"}
                </td>

                <td>
                    ${producto.nombre_producto ?? "-"}
                </td>

                <td>
                    ${producto.descripcion ?? "-"}
                </td>

                <td>
                    ${
                        producto.cantidad_stock ??
                        producto.cantidad ??
                        producto.stock ??
                        "-"
                    }
                </td>

                <td>
                    $ ${producto.precio ?? "0"}
                </td>

            `;


            tabla.appendChild(fila);

        });


        actualizarContador(
            "totalProductos",
            productos.length
        );


    } catch (error) {

        console.error(
            "Error productos:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    ❌ Error al cargar los productos
                </td>
            </tr>
        `;

    }

}


/* =====================================================
   NOTIFICACIONES
===================================================== */

function mostrarNotificacion(
    titulo,
    mensaje
) {

    const lista =
        document.getElementById(
            "listaNotificaciones"
        );


    if (!lista) return;


    const notificacion =
        document.createElement("div");


    notificacion.className =
        "notificacion";


    notificacion.innerHTML = `

        <div class="icono-notificacion">
            🔔
        </div>

        <div>

            <strong>
                ${titulo}
            </strong>

            <p>
                ${mensaje}
            </p>

        </div>

    `;


    lista.prepend(notificacion);

}


/* =====================================================
   ACTUALIZAR CONTADORES
===================================================== */

function actualizarContador(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent = valor;

    }

}


/* =====================================================
   CARGAR TODO AL INICIAR
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarPersonal();

        cargarContratos();

        cargarClientes();

        cargarNovedades();

        cargarProductos();

    }
);