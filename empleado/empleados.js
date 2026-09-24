// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE = "http://localhost:8080/api";


// =====================================================
// DATOS DEL EMPLEADO
// =====================================================

// El ID debe estar guardado cuando el empleado inicia sesión.
//
// Ejemplo:
// localStorage.setItem("id_empleado", usuario.id_empleado);

let idEmpleado = localStorage.getItem("id_empleado");


// También intentamos obtener el nombre
let nombreGuardado =
    localStorage.getItem("nombre_empleado") ||
    localStorage.getItem("nombreEmpleado") ||
    "Empleado";


// Si no existe ID mostramos un aviso
if (!idEmpleado) {

    console.warn(
        "No se encontró id_empleado en localStorage."
    );

}


// =====================================================
// INICIO
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

    mostrarDatosEmpleado();

    configurarMenu();

    configurarFormularioNovedad();

    configurarContadorCaracteres();

    cargarResumen();

    if (idEmpleado) {

        cargarServicios();

        cargarNovedades();

        cargarNotificaciones();

        cargarHorarios();

    }

});


// =====================================================
// MOSTRAR DATOS DEL EMPLEADO
// =====================================================

function mostrarDatosEmpleado() {

    document.getElementById(
        "nombreEmpleado"
    ).textContent = nombreGuardado;

    document.getElementById(
        "inicioNombre"
    ).textContent = nombreGuardado;

    document.getElementById(
        "formNombreEmpleado"
    ).textContent = nombreGuardado;


    document.getElementById(
        "inicioId"
    ).textContent = idEmpleado || "-";

    document.getElementById(
        "formIdEmpleado"
    ).textContent = idEmpleado || "-";
}


// =====================================================
// MENÚ
// =====================================================

function configurarMenu() {

    const botones =
        document.querySelectorAll(".menu-item");

    const secciones =
        document.querySelectorAll(".seccion");


    botones.forEach(boton => {

        boton.addEventListener("click", () => {

            const seccion =
                boton.dataset.seccion;


            // Quitar activo

            botones.forEach(btn => {
                btn.classList.remove("activo");
            });


            // Activar botón

            boton.classList.add("activo");


            // Ocultar secciones

            secciones.forEach(sec => {
                sec.classList.remove("activa");
            });


            // Mostrar sección

            const seccionSeleccionada =
                document.getElementById(seccion);

            if (seccionSeleccionada) {

                seccionSeleccionada.classList.add("activa");

            }


            actualizarTitulo(seccion);

        });

    });

}


// =====================================================
// TÍTULOS
// =====================================================

function actualizarTitulo(seccion) {

    const titulo =
        document.getElementById("tituloPagina");

    const subtitulo =
        document.getElementById("subtituloPagina");


    const titulos = {

        inicio: [
            "Panel del Empleado",
            "Consulta tu información laboral"
        ],

        servicios: [
            "Mis servicios",
            "Servicios asignados"
        ],

        novedades: [
            "Novedad laboral",
            "Envía una novedad al supervisor"
        ],

        notificaciones: [
            "Notificaciones",
            "Información importante del sistema"
        ],

        horarios: [
            "Mi horario",
            "Consulta tus horarios de trabajo"
        ]

    };


    if (titulos[seccion]) {

        titulo.textContent =
            titulos[seccion][0];

        subtitulo.textContent =
            titulos[seccion][1];

    }

}


// =====================================================
// RESUMEN
// =====================================================

async function cargarResumen() {

    if (!idEmpleado) {
        return;
    }

    try {

        const servicios =
            await obtenerDatos(
                `/servicios/empleado/${idEmpleado}`
            );

        if (Array.isArray(servicios)) {

            document.getElementById(
                "totalServicios"
            ).textContent = servicios.length;

        }

    } catch (error) {

        console.error(
            "Error cargando servicios:",
            error
        );

    }


    try {

        const novedades =
            await obtenerDatos(
                "/novedad_laboral"
            );


        if (Array.isArray(novedades)) {

            const misNovedades =
                novedades.filter(
                    n =>
                        Number(n.id_empleado) ===
                        Number(idEmpleado)
                );


            document.getElementById(
                "totalNovedades"
            ).textContent =
                misNovedades.length;

        }

    } catch (error) {

        console.error(
            "Error cargando novedades:",
            error
        );

    }


    try {

        const notificaciones =
            await obtenerDatos(
                `/notificaciones/empleado/${idEmpleado}`
            );


        if (Array.isArray(notificaciones)) {

            document.getElementById(
                "totalNotificaciones"
            ).textContent =
                notificaciones.length;

            document.getElementById(
                "contadorNotificaciones"
            ).textContent =
                notificaciones.length;

        }

    } catch (error) {

        console.error(
            "Error cargando notificaciones:",
            error
        );

    }


    try {

        const horarios =
            await obtenerDatos(
                `/horarios/empleado/${idEmpleado}`
            );


        if (Array.isArray(horarios)) {

            document.getElementById(
                "totalHorarios"
            ).textContent =
                horarios.length;

        }

    } catch (error) {

        console.error(
            "Error cargando horarios:",
            error
        );

    }

}


// =====================================================
// SERVICIOS
// =====================================================

async function cargarServicios() {

    const contenedor =
        document.getElementById(
            "listaServicios"
        );

    const cargando =
        document.getElementById(
            "cargandoServicios"
        );


    if (!idEmpleado) {

        cargando.textContent =
            "No se encontró el ID del empleado.";

        return;

    }


    cargando.style.display = "block";

    contenedor.innerHTML = "";


    try {

        const servicios =
            await obtenerDatos(
                `/servicios/empleado/${idEmpleado}`
            );


        cargando.style.display = "none";


        if (!Array.isArray(servicios) ||
            servicios.length === 0) {

            contenedor.innerHTML = `
                <div class="mensaje-vacio">
                    No tienes servicios asignados.
                </div>
            `;

            document.getElementById(
                "totalServicios"
            ).textContent = "0";

            return;

        }


        document.getElementById(
            "totalServicios"
        ).textContent =
            servicios.length;


        servicios.forEach(servicio => {

            const tarjeta =
                document.createElement("div");

            tarjeta.className =
                "tarjeta-servicio";


            const nombre =
                servicio.nombre_servicio ||
                servicio.nombre ||
                "Servicio";


            const fecha =
                servicio.fecha ||
                servicio.fecha_servicio ||
                "No especificada";


            const ubicacion =
                servicio.ubicacion ||
                servicio.direccion ||
                "No especificada";


            const estado =
                servicio.estado ||
                "Pendiente";


            tarjeta.innerHTML = `

                <h3>🧹 ${escaparHTML(nombre)}</h3>

                <p>
                    <strong>Fecha:</strong>
                    ${escaparHTML(fecha)}
                </p>

                <p>
                    <strong>Ubicación:</strong>
                    ${escaparHTML(ubicacion)}
                </p>

                <span class="estado">
                    ${escaparHTML(estado)}
                </span>

            `;


            contenedor.appendChild(tarjeta);

        });


    } catch (error) {

        cargando.style.display = "none";

        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se pudieron cargar los servicios.
                Verifica que Spring Boot esté ejecutándose.
            </div>
        `;

        console.error(
            "Error:",
            error
        );

    }

}


// =====================================================
// NOVEDADES
// =====================================================

function configurarFormularioNovedad() {

    const formulario =
        document.getElementById(
            "formNovedad"
        );


    formulario.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            if (!idEmpleado) {

                mostrarMensaje(
                    "No se encontró el ID del empleado.",
                    "error"
                );

                return;

            }


            const tipo =
                document.getElementById(
                    "tipoNovedad"
                ).value;


            const descripcion =
                document.getElementById(
                    "descripcionNovedad"
                ).value.trim();


            if (!tipo) {

                mostrarMensaje(
                    "Selecciona el tipo de novedad.",
                    "error"
                );

                return;

            }


            if (!descripcion) {

                mostrarMensaje(
                    "Escribe una descripción.",
                    "error"
                );

                return;

            }


            const boton =
                document.getElementById(
                    "btnEnviarNovedad"
                );


            boton.disabled = true;

            boton.textContent =
                "Enviando...";


            // =================================================
            // OBJETO QUE SE ENVÍA A SPRING BOOT
            // =================================================

            const nuevaNovedad = {

                id_empleado:
                    Number(idEmpleado),

                tipo_novedad:
                    tipo,

                descripcion:
                    descripcion

            };


            console.log(
                "Enviando novedad:",
                nuevaNovedad
            );


            try {

                const respuesta =
                    await fetch(
                        `${API_BASE}/novedad_laboral`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    nuevaNovedad
                                )
                        }
                    );


                if (!respuesta.ok) {

                    let mensaje =
                        "No se pudo guardar la novedad.";

                    try {

                        const error =
                            await respuesta.json();

                        mensaje =
                            error.message ||
                            error.error ||
                            mensaje;

                    } catch (e) {

                        // El backend no devolvió JSON

                    }


                    throw new Error(
                        mensaje
                    );

                }


                const resultado =
                    await respuesta.json();


                console.log(
                    "Novedad guardada:",
                    resultado
                );


                mostrarMensaje(
                    "Novedad enviada correctamente.",
                    "exito"
                );


                formulario.reset();

                document.getElementById(
                    "contadorCaracteres"
                ).textContent = "0";


                // Actualizar lista

                await cargarNovedades();

                await cargarResumen();


            } catch (error) {

                console.error(
                    "Error enviando novedad:",
                    error
                );


                mostrarMensaje(
                    error.message ||
                    "Error al enviar la novedad.",
                    "error"
                );

            } finally {

                boton.disabled = false;

                boton.textContent =
                    "📤 Enviar novedad";

            }

        }
    );

}


// =====================================================
// CARGAR NOVEDADES
// =====================================================

async function cargarNovedades() {

    const contenedor =
        document.getElementById(
            "listaNovedades"
        );


    if (!idEmpleado) {

        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se encontró el ID del empleado.
            </div>
        `;

        return;

    }


    contenedor.innerHTML = `
        <div class="mensaje-cargando">
            Cargando novedades...
        </div>
    `;


    try {

        const novedades =
            await obtenerDatos(
                "/novedad_laboral"
            );


        if (!Array.isArray(novedades)) {

            throw new Error(
                "La respuesta no es una lista."
            );

        }


        const misNovedades =
            novedades.filter(
                novedad =>
                    Number(novedad.id_empleado) ===
                    Number(idEmpleado)
            );


        document.getElementById(
            "totalNovedades"
        ).textContent =
            misNovedades.length;


        if (misNovedades.length === 0) {

            contenedor.innerHTML = `
                <div class="mensaje-vacio">
                    No tienes novedades registradas.
                </div>
            `;

            return;

        }


        contenedor.innerHTML = "";


        misNovedades
            .slice()
            .reverse()
            .forEach(novedad => {

                const elemento =
                    document.createElement("div");

                elemento.className =
                    "novedad-item";


                elemento.innerHTML = `

                    <h3>
                        📝
                        ${escaparHTML(
                            novedad.tipo_novedad ||
                            "Novedad"
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            novedad.descripcion ||
                            ""
                        )}
                    </p>

                    <div class="novedad-meta">

                        ID novedad:
                        ${escaparHTML(
                            String(
                                novedad.id_novedad ||
                                "-"
                            )
                        )}

                    </div>

                `;


                contenedor.appendChild(
                    elemento
                );

            });


    } catch (error) {

        console.error(
            "Error cargando novedades:",
            error
        );


        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se pudieron cargar las novedades.
            </div>
        `;

    }

}


// =====================================================
// NOTIFICACIONES
// =====================================================

async function cargarNotificaciones() {

    const contenedor =
        document.getElementById(
            "listaNotificaciones"
        );


    if (!idEmpleado) {

        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se encontró el ID del empleado.
            </div>
        `;

        return;

    }


    contenedor.innerHTML = `
        <div class="mensaje-cargando">
            Cargando notificaciones...
        </div>
    `;


    try {

        const notificaciones =
            await obtenerDatos(
                `/notificaciones/empleado/${idEmpleado}`
            );


        if (!Array.isArray(notificaciones)) {

            throw new Error(
                "Respuesta incorrecta."
            );

        }


        document.getElementById(
            "totalNotificaciones"
        ).textContent =
            notificaciones.length;


        document.getElementById(
            "contadorNotificaciones"
        ).textContent =
            notificaciones.length;


        if (notificaciones.length === 0) {

            contenedor.innerHTML = `
                <div class="mensaje-vacio">
                    No tienes notificaciones.
                </div>
            `;

            return;

        }


        contenedor.innerHTML = "";


        notificaciones.forEach(
            notificacion => {

                const elemento =
                    document.createElement("div");

                elemento.className =
                    "notificacion";


                elemento.innerHTML = `

                    <h3>
                        🔔
                        ${escaparHTML(
                            notificacion.titulo ||
                            "Notificación"
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            notificacion.mensaje ||
                            notificacion.descripcion ||
                            ""
                        )}
                    </p>

                    <small>
                        ${escaparHTML(
                            notificacion.fecha ||
                            ""
                        )}
                    </small>

                `;


                contenedor.appendChild(
                    elemento
                );

            }
        );


    } catch (error) {

        console.error(
            "Error cargando notificaciones:",
            error
        );


        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se pudieron cargar las notificaciones.
                Verifica el endpoint de notificaciones.
            </div>
        `;

    }

}


// =====================================================
// HORARIOS
// =====================================================

async function cargarHorarios() {

    const tabla =
        document.getElementById(
            "tablaHorarios"
        );


    if (!idEmpleado) {

        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No se encontró el ID del empleado.
                </td>
            </tr>
        `;

        return;

    }


    tabla.innerHTML = `
        <tr>
            <td colspan="5">
                Cargando horarios...
            </td>
        </tr>
    `;


    try {

        const horarios =
            await obtenerDatos(
                `/horarios/empleado/${idEmpleado}`
            );


        document.getElementById(
            "totalHorarios"
        ).textContent =
            Array.isArray(horarios)
                ? horarios.length
                : 0;


        if (!Array.isArray(horarios) ||
            horarios.length === 0) {

            tabla.innerHTML = `
                <tr>
                    <td colspan="5">
                        No tienes horarios registrados.
                    </td>
                </tr>
            `;

            return;

        }


        tabla.innerHTML = "";


        horarios.forEach(horario => {

            const fila =
                document.createElement("tr");


            fila.innerHTML = `

                <td>
                    ${escaparHTML(
                        horario.fecha ||
                        horario.fecha_asignado ||
                        "-"
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        horario.hora_inicio ||
                        horario.horaInicio ||
                        "-"
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        horario.hora_fin ||
                        horario.horaFin ||
                        "-"
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        horario.turno ||
                        "-"
                    )}
                </td>

                <td>
                    ${escaparHTML(
                        horario.estado ||
                        "Programado"
                    )}
                </td>

            `;


            tabla.appendChild(fila);

        });


    } catch (error) {

        console.error(
            "Error cargando horarios:",
            error
        );


        tabla.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudieron cargar los horarios.
                </td>
            </tr>
        `;

    }

}


// =====================================================
// FUNCIÓN GENERAL GET
// =====================================================

async function obtenerDatos(endpoint) {

    const respuesta =
        await fetch(
            `${API_BASE}${endpoint}`,
            {
                method: "GET",

                headers: {
                    "Content-Type":
                        "application/json"
                }
            }
        );


    if (!respuesta.ok) {

        throw new Error(
            `Error HTTP ${respuesta.status}`
        );

    }


    return await respuesta.json();

}


// =====================================================
// CONTADOR DE CARACTERES
// =====================================================

function configurarContadorCaracteres() {

    const textarea =
        document.getElementById(
            "descripcionNovedad"
        );

    const contador =
        document.getElementById(
            "contadorCaracteres"
        );


    textarea.addEventListener(
        "input",
        () => {

            contador.textContent =
                textarea.value.length;

        }
    );

}


// =====================================================
// MENSAJE DEL SISTEMA
// =====================================================

function mostrarMensaje(
    texto,
    tipo = ""
) {

    const mensaje =
        document.getElementById(
            "mensajeSistema"
        );

    const textoMensaje =
        document.getElementById(
            "textoMensaje"
        );


    textoMensaje.textContent =
        texto;


    mensaje.className =
        "mensaje-sistema mostrar " +
        tipo;


    setTimeout(() => {

        mensaje.className =
            "mensaje-sistema";

    }, 3500);

}


// =====================================================
// SEGURIDAD BÁSICA PARA HTML
// =====================================================

function escaparHTML(valor) {

    const div =
        document.createElement("div");

    div.textContent =
        valor ?? "";

    return div.innerHTML;

}


// =====================================================
// CERRAR SESIÓN
// =====================================================

document.getElementById(
    "cerrarSesion"
).addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "id_empleado"
        );

        localStorage.removeItem(
            "nombre_empleado"
        );

        localStorage.removeItem(
            "nombreEmpleado"
        );


        window.location.href =
            "../inicio de sistema/login.html";

    }
);