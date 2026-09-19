
const API_URL = "http://localhost:8080/api/reportes/resumen";

let graficaGeneral = null;
let graficaOperaciones = null;
let graficaInventario = null;

async function cargarReportes() {
    const mensaje = document.getElementById("mensaje");

    if (mensaje) {
        mensaje.textContent = "Cargando información...";
        mensaje.className = "mensaje";
    }

    try {
        console.log("Conectando con:", API_URL);

        const respuesta = await fetch(API_URL, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        console.log("Estado HTTP:", respuesta.status);

        if (!respuesta.ok) {
            throw new Error("Error HTTP: " + respuesta.status);
        }

        const datos = await respuesta.json();

        console.log("Datos recibidos:", datos);

        colocarDato("usuarios", datos.usuarios);
        colocarDato("roles", datos.roles);
        colocarDato("empleados", datos.empleados);
        colocarDato("clientes", datos.clientes);
        colocarDato("servicios", datos.servicios);
        colocarDato("contratos", datos.contratos);
        colocarDato("productos", datos.productos);
        colocarDato("reportes", datos.reportes);
        colocarDato("novedad_laboral", datos.novedad_laboral);
        colocarDato("proveedor", datos.proveedor);

        crearGraficaGeneral(datos);
        crearGraficaOperaciones(datos);
        crearGraficaInventario(datos);

        const ahora = new Date();

        const hora = ahora.toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const ultimaActualizacion =
            document.getElementById("ultimaActualizacion");

        if (ultimaActualizacion) {
            ultimaActualizacion.textContent =
                "Última actualización: " + hora;
        }

        if (mensaje) {
            mensaje.textContent =
                "✓ Reportes cargados correctamente";

            mensaje.className = "mensaje exito";
        }

    } catch (error) {

        console.error("Error al cargar reportes:", error);

        if (mensaje) {
            mensaje.textContent =
                "❌ No se pudo cargar la información.";

            mensaje.className = "mensaje error";
        }
    }
}

function colocarDato(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor ?? 0;
    }
}

function crearGraficaGeneral(datos) {

    const canvas =
        document.getElementById("graficaGeneral");

    if (!canvas) return;

    if (graficaGeneral) {
        graficaGeneral.destroy();
    }

    graficaGeneral = new Chart(canvas, {
        type: "bar",

        data: {
            labels: [
                "Usuarios",
                "Roles",
                "Empleados",
                "Clientes",
                "Servicios",
                "Contratos",
                "Productos",
                "Reportes",
                "Novedades",
                "Proveedores"
            ],

            datasets: [
                {
                    label: "Cantidad de registros",

                    data: [
                        datos.usuarios ?? 0,
                        datos.roles ?? 0,
                        datos.empleados ?? 0,
                        datos.clientes ?? 0,
                        datos.servicios ?? 0,
                        datos.contratos ?? 0,
                        datos.productos ?? 0,
                        datos.reportes ?? 0,
                        datos.novedad_laboral ?? 0,
                        datos.proveedor ?? 0
                    ],

                    borderWidth: 1
                }
            ]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "white"
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: "white",
                        precision: 0
                    }
                }
            }
        }
    });
}

function crearGraficaOperaciones(datos) {

    const canvas =
        document.getElementById("graficaOperaciones");

    if (!canvas) return;

    if (graficaOperaciones) {
        graficaOperaciones.destroy();
    }

    graficaOperaciones = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: [
                "Clientes",
                "Empleados",
                "Servicios",
                "Contratos"
            ],

            datasets: [
                {
                    label: "Operaciones",

                    data: [
                        datos.clientes ?? 0,
                        datos.empleados ?? 0,
                        datos.servicios ?? 0,
                        datos.contratos ?? 0
                    ],

                    borderWidth: 2
                }
            ]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "white"
                    }
                }
            }
        }
    });
}

function crearGraficaInventario(datos) {

    const canvas =
        document.getElementById("graficaInventario");

    if (!canvas) return;

    if (graficaInventario) {
        graficaInventario.destroy();
    }

    graficaInventario = new Chart(canvas, {
        type: "bar",

        data: {
            labels: [
                "Productos",
                "Proveedores"
            ],

            datasets: [
                {
                    label: "Inventario",

                    data: [
                        datos.productos ?? 0,
                        datos.proveedor ?? 0
                    ],

                    borderWidth: 1
                }
            ]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            },

            scales: {
                x: {
                    ticks: {
                        color: "white"
                    }
                },

                y: {
                    beginAtZero: true,

                    ticks: {
                        color: "white",
                        precision: 0
                    }
                }
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const boton =
        document.getElementById("btnActualizar");

    if (boton) {
        boton.addEventListener(
            "click",
            cargarReportes
        );
    }

    cargarReportes();
});

