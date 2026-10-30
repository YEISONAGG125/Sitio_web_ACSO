
const API_BASE = "http://localhost:8080/api";

const navLinks = document.querySelectorAll(".nav-link");
const secciones = document.querySelectorAll(".contenido");

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

const btnVerServicios =
    document.getElementById("btnVerServicios");

const btnRefrescar =
    document.getElementById("btnRefrescar");

const btnCerrarSesion =
    document.getElementById("btnCerrarSesion");

const btnEditar =
    document.getElementById("btnEditar");

const formPerfil =
    document.getElementById("formPerfil");

const marcarTodas =
    document.getElementById("marcarTodas");

const sectionTitulo =
    document.getElementById("sectionTitulo");

const sectionEyebrow =
    document.getElementById("sectionEyebrow");

const usuarioGuardado =
    localStorage.getItem("usuarioLogueado");

if (!usuarioGuardado) {

    window.location.href =
        "../inicio de sistema/login.html";

    throw new Error(
        "No existe una sesión activa."
    );
}


let usuario;

try {

    usuario =
        JSON.parse(usuarioGuardado);

} catch (error) {

    console.error(
        "Error al leer usuario:",
        error
    );

    localStorage.removeItem(
        "usuarioLogueado"
    );

    window.location.href =
        "../inicio de sistema/login.html";

    throw new Error(
        "La información de sesión no es válida."
    );
}

let nombreUsuario =
    usuario.nombre ||
    usuario.nombre_completo ||
    usuario.nombre_usuario ||
    "Cliente";
function obtenerIniciales(nombre) {

    if (!nombre) {
        return "CL";
    }

    const palabras =
        nombre
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (palabras.length === 1) {

        return palabras[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        palabras[0].charAt(0) +
        palabras[palabras.length - 1].charAt(0)
    ).toUpperCase();
}

function actualizarIdentidad() {

    // Se recalcula cada vez, para que el nombre cambie al guardar el perfil
    nombreUsuario =
        usuario.nombre ||
        usuario.nombre_completo ||
        usuario.nombre_usuario ||
        "Cliente";

    const iniciales =
        obtenerIniciales(nombreUsuario);

    const avatar =
        document.getElementById("avatar");

    if (avatar) {
        avatar.textContent =
            iniciales;
    }

    const nombreElemento =
        document.getElementById(
            "nombreUsuario"
        );

    if (nombreElemento) {

        nombreElemento.textContent =
            nombreUsuario;
    }

    if (sectionTitulo) {

        sectionTitulo.textContent =
            "Bienvenido, " +
            nombreUsuario;
    }
    const perfilNombre =
        document.getElementById(
            "perfilNombre"
        );

    if (perfilNombre) {

        perfilNombre.value =
            nombreUsuario;
    }
    const avatarPerfil =
        document.getElementById(
            "avatarPerfil"
        );

    if (avatarPerfil) {

        avatarPerfil.textContent =
            iniciales;
    }
    const nombrePerfil =
        document.getElementById(
            "nombrePerfil"
        );

    if (nombrePerfil) {

        nombrePerfil.textContent =
            nombreUsuario;
    }
}
let servicios = [];
let contratos = [];
let pagos = [];
let notificaciones = [];
const titulos = {

    inicio: {
        eyebrow: "PANEL DE CLIENTE",
        titulo: "Bienvenido, "
    },
    servicios: {
        eyebrow: "MIS SERVICIOS",
        titulo: "Servicios contratados"
    },

    contrato: {
        eyebrow: "MI CONTRATO",
        titulo: "Información del contrato"
    },
    pagos: {
        eyebrow: "MIS PAGOS",
        titulo: "Historial de pagos"
    },
    notificaciones: {
        eyebrow: "NOTIFICACIONES",
        titulo: "Centro de notificaciones"
    },
    solicitar: {
        eyebrow: "NUEVA SOLICITUD",
        titulo: "Solicitar servicio o contrato"
    },
    solicitudes: {
        eyebrow: "SEGUIMIENTO",
        titulo: "Mis solicitudes"
    },
    perfil: {
        eyebrow: "MI PERFIL",
        titulo: "Información de mi cuenta"
    }

};


function mostrarSeccion(nombre) {

    navLinks.forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.section === nombre
        );

    });


    secciones.forEach(section => {

        section.classList.toggle(
            "active",
            section.id === `sec-${nombre}`
        );

    });


    const datos =
        titulos[nombre];


    if (datos) {

        sectionEyebrow.textContent =
            datos.eyebrow;


        if (nombre === "inicio") {

            sectionTitulo.textContent =
                datos.titulo +
                nombreUsuario;

        } else {

            sectionTitulo.textContent =
                datos.titulo;
        }

    }


    cerrarMenuMovil();


    window.scrollTo({

        top: 0,
        behavior: "smooth"

    });
}

navLinks.forEach(link => {

    link.addEventListener(
        "click",
        function (e) {

            e.preventDefault();

            mostrarSeccion(
                this.dataset.section
            );

        }
    );

});

document
    .querySelectorAll(".accion, .btn-ir")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const destino =
                    button.dataset.go;

                mostrarSeccion(
                    destino
                );

            }
        );

    });


if (btnVerServicios) {

    btnVerServicios.addEventListener(
        "click",
        () => {

            mostrarSeccion(
                "servicios"
            );

        }
    );

}


if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "show"
            );

        }
    );

}


if (overlay) {

    overlay.addEventListener(
        "click",
        cerrarMenuMovil
    );

}


function cerrarMenuMovil() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

    if (overlay) {

        overlay.classList.remove(
            "show"
        );

    }

}
function animarNumero(
    elemento,
    destino
) {

    if (!elemento) return;

    const duracion = 700;

    const inicio =
        performance.now();


    function actualizar(tiempo) {

        const progreso =
            Math.min(
                (tiempo - inicio) /
                    duracion,
                1
            );


        const valor =
            Math.floor(
                progreso *
                destino
            );


        elemento.textContent =
            valor;


        if (progreso < 1) {

            requestAnimationFrame(
                actualizar
            );

        }

    }


    requestAnimationFrame(
        actualizar
    );
}


function actualizarEstadisticas() {

    animarNumero(

        document.getElementById(
            "statServicios"
        ),

        servicios.length
    );


    animarNumero(

        document.getElementById(
            "statContratos"
        ),

        contratos.length
    );


    animarNumero(

        document.getElementById(
            "statPagos"
        ),

        pagos.length
    );

}
function claseEstado(estado) {

    const valor =

        String(estado)
            .toLowerCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            );


    if (
        valor.includes("activo") ||
        valor.includes("programado")
    ) {

        return "activo";

    }


    if (
        valor.includes("pendiente")
    ) {

        return "pendiente";

    }


    if (
        valor.includes("finalizado")
    ) {

        return "finalizado";

    }


    if (
        valor.includes("cancelado")
    ) {

        return "cancelado";

    }


    return "pendiente";
}


function crearFilaServicio(servicio) {

    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><strong>${esc(servicio.nombre)}</strong></td>
        <td>${esc(servicio.direccion)}</td>
        <td>
            <span class="estado ${claseEstado(servicio.estado)}">
                ${esc(servicio.estado)}
            </span>
        </td>
        <td>${esc(servicio.fecha)}</td>
    `;

    tr.addEventListener("click", () => {
        mostrarToast(
            "Servicio",
            `${servicio.nombre} · ${servicio.estado}`
        );
    });

    return tr;
}

function filaVacia(columnas, texto) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td class="tabla-vacia" colspan="${columnas}">${texto}</td>`;
    return tr;
}

function cargarServicios() {

    const tablaInicio = document.getElementById("tablaInicioServicios");
    const tablaServicios = document.getElementById("tablaServicios");

    if (!tablaInicio || !tablaServicios) {
        return;
    }

    tablaInicio.innerHTML = "";
    tablaServicios.innerHTML = "";

    if (servicios.length === 0) {
        const msg = "Aún no tienes servicios aprobados. Pídelos en «Solicitar» y revisa «Mis solicitudes».";
        tablaInicio.appendChild(filaVacia(4, msg));
        tablaServicios.appendChild(filaVacia(4, msg));
    }

    servicios.forEach(servicio => {
        tablaInicio.appendChild(crearFilaServicio(servicio));
        tablaServicios.appendChild(crearFilaServicio(servicio));
    });

    const total = servicios.length;

    const conteoInicio = document.getElementById("conteoInicioServicios");
    if (conteoInicio) {
        conteoInicio.textContent = `${total} en total`;
    }

    const conteoServicios = document.getElementById("conteoServicios");
    if (conteoServicios) {
        conteoServicios.textContent = `${total} en total`;
    }
}

function formatearFecha(fecha) {

    if (!fecha) {
        return "-";
    }


    const partes =
        fecha.split("-");


    if (partes.length !== 3) {

        return fecha;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatearMoneda(valor) {

    return new Intl.NumberFormat(
        "es-CO",
        {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        }
    ).format(valor);

}


function cargarContrato() {

    const contrato = contratos[0];

    const vacio = document.getElementById("contratoVacio");
    const datos = document.getElementById("contratoDatos");
    const estado = document.getElementById("estadoContrato");

    if (!contrato) {
        if (vacio) vacio.classList.remove("oculto");
        if (datos) datos.classList.add("oculto");
        if (estado) estado.classList.add("oculto");
        return;
    }

    if (vacio) vacio.classList.add("oculto");
    if (datos) datos.classList.remove("oculto");

    const poner = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.textContent = valor;
    };

    poner("contratoNumero", contrato.numero);
    poner("contratoServicio", contrato.servicio || "-");
    poner("contratoUbicacion", contrato.ubicacion);
    poner("contratoFrecuencia", contrato.frecuencia || "-");
    poner("contratoInicio", formatearFecha(contrato.fechaInicio));
    poner("contratoFin", formatearFecha(contrato.fechaFin));
    poner(
        "contratoValor",
        contrato.valorTotal ? formatearMoneda(contrato.valorTotal) : "Por definir con el supervisor"
    );

    if (estado) {
        const hoy = new Date().toISOString().slice(0, 10);
        const vencido = contrato.fechaFin && contrato.fechaFin < hoy;
        const porIniciar = contrato.fechaInicio && contrato.fechaInicio > hoy;

        estado.classList.remove("oculto");
        estado.textContent = vencido ? "● Finalizado" : porIniciar ? "● Por iniciar" : "● Vigente";
    }
}

function cargarPagos() {

    const tabla = document.getElementById("tablaPagos");

    if (!tabla) {
        return;
    }

    tabla.innerHTML = "";

    if (pagos.length === 0) {
        tabla.appendChild(filaVacia(3, "Aún no tienes pagos registrados."));
    }

    pagos.forEach(pago => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>#${esc(pago.id)}</td>
            <td>${esc(pago.contrato)}</td>
            <td><span class="estado activo">${esc(pago.metodo)}</span></td>
        `;

        tabla.appendChild(fila);
    });

    const conteo = document.getElementById("conteoPagos");

    if (conteo) {
        conteo.textContent = `${pagos.length} registrados`;
    }
}

/* =================================
   NOTIFICACIONES
================================= */

function esc(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
}

function cargarNotificaciones() {

    const lista = document.getElementById("listaNotif");

    if (!lista) {
        return;
    }

    lista.innerHTML = "";

    // Las de la nube (Firestore) llegan desde solicitudes.js
    const todas = [
        ...(window.notificacionesNube || []),
        ...notificaciones
    ];

    const noLeidas = todas.filter(n => !n.leida).length;

    const badge = document.getElementById("badgeNotif");

    if (badge) {
        badge.textContent = noLeidas > 0 ? noLeidas : "0";
        badge.classList.toggle("visible", noLeidas > 0);
    }

    if (todas.length === 0) {
        lista.innerHTML = `<li class="vacio-bloque">No tienes notificaciones por ahora.</li>`;
        return;
    }

    todas.forEach(notificacion => {

        const li = document.createElement("li");
        li.className = "notificacion";

        li.innerHTML = `
            <span class="notificacion-icono">
                ${notificacion.leida ? "✓" : "!"}
            </span>
            <div>
                <strong>${esc(notificacion.titulo)}</strong>
                <p>${esc(notificacion.mensaje)}</p>
            </div>
            <small>${esc(notificacion.fecha)}</small>
        `;

        li.addEventListener("click", () => {

            if (notificacion.nube) {
                if (window.marcarLeidaNube) {
                    window.marcarLeidaNube(notificacion.id);
                }
            } else {
                notificacion.leida = true;
                cargarNotificaciones();
            }

            mostrarToast("Notificación", "Marcada como leída");
        });

        lista.appendChild(li);
    });
}

if (marcarTodas) {

    marcarTodas.addEventListener(
        "click",
        () => {
            if (window.marcarTodasNube) {
                window.marcarTodasNube();
            }


            notificaciones.forEach(
                notificacion => {

                    notificacion.leida =
                        true;

                }
            );


            cargarNotificaciones();


            mostrarToast(
                "Notificaciones",
                "Todas están marcadas como leídas"
            );

        }
    );

}


let modoEdicion = false;


if (btnEditar) {

    btnEditar.addEventListener(
        "click",
        () => {

            modoEdicion =
                !modoEdicion;


            if (!formPerfil) {
                return;
            }


            const campos =
                formPerfil.querySelectorAll("input:not([data-fijo])");


            campos.forEach(
                campo => {

                    campo.disabled =
                        !modoEdicion;

                }
            );


            const btnGuardar =
                document.getElementById(
                    "btnGuardarPerfil"
                );


            if (btnGuardar) {

                btnGuardar.classList.toggle(
                    "oculto",
                    !modoEdicion
                );

            }


            btnEditar.textContent =
                modoEdicion
                    ? "✕ Cancelar"
                    : "✎ Editar datos";

            // Al cancelar se descartan los cambios escritos
            if (!modoEdicion) {
                actualizarIdentidad();
                rellenarPerfil();
            }

        }
    );

}


if (formPerfil) {

    formPerfil.addEventListener(
        "submit",
        event => {

            event.preventDefault();



            const campoNombre =
                document.getElementById(
                    "perfilNombre"
                );


            if (campoNombre) {

                usuario.nombre =
                    campoNombre.value.trim();

            }



            const campoTelefono =
                document.getElementById(
                    "perfilTelefono"
                );


            if (campoTelefono) {

                usuario.telefono =
                    campoTelefono.value.trim();

            }



            const campoCorreo =
                document.getElementById(
                    "perfilCorreo"
                );


            if (campoCorreo) {

                usuario.correo =
                    campoCorreo.value.trim();

            }



            const campoDireccion =
                document.getElementById(
                    "perfilDireccion"
                );


            if (campoDireccion) {

                usuario.direccion =
                    campoDireccion.value.trim();

            }


            localStorage.setItem(
                "usuarioLogueado",
                JSON.stringify(
                    usuario
                )
            );

            window.dispatchEvent(
                new CustomEvent("perfil-guardado", { detail: usuario })
            );




            actualizarIdentidad();


            const campos =
                formPerfil.querySelectorAll("input:not([data-fijo])");


            campos.forEach(
                campo => {

                    campo.disabled =
                        true;

                }
            );


            modoEdicion =
                false;


            const btnGuardar =
                document.getElementById(
                    "btnGuardarPerfil"
                );


            if (btnGuardar) {

                btnGuardar.classList.add(
                    "oculto"
                );

            }


            btnEditar.textContent =
                "✎ Editar datos";


            const confirmacion =
                document.getElementById(
                    "confirmacionPerfil"
                );


            if (confirmacion) {

                confirmacion.classList.add(
                    "mostrar"
                );


                setTimeout(
                    () => {

                        confirmacion.classList.remove(
                            "mostrar"
                        );

                    },
                    3500
                );

            }


            mostrarToast(
                "Perfil actualizado",
                "Los datos se actualizaron correctamente."
            );

        }
    );

}


let toastTimeout;


function mostrarToast(
    titulo,
    mensaje
) {

    const toast =
        document.getElementById(
            "toast"
        );


    if (!toast) {
        return;
    }


    const toastTitulo =
        document.getElementById(
            "toastTitulo"
        );


    const toastMensaje =
        document.getElementById(
            "toastMensaje"
        );


    if (toastTitulo) {

        toastTitulo.textContent =
            titulo;

    }


    if (toastMensaje) {

        toastMensaje.textContent =
            mensaje;

    }


    toast.classList.add(
        "visible"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "visible"
                );

            },
            3500
        );

}


if (btnRefrescar) {

    btnRefrescar.addEventListener(
        "click",
        async () => {

            btnRefrescar.disabled =
                true;


            mostrarToast(
                "POWER CLEAN",
                "Actualizando información..."
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        700
                    )
            );


            cargarServicios();

            cargarContrato();

            cargarPagos();

            cargarNotificaciones();

            actualizarEstadisticas();


            btnRefrescar.disabled =
                false;


            mostrarToast(
                "Información actualizada",
                "Los datos del panel están al día."
            );

        }
    );

}

if (btnCerrarSesion) {

    btnCerrarSesion.addEventListener(
        "click",
        () => {

            const confirmar =
                confirm(
                    "¿Deseas cerrar tu sesión?"
                );


            if (!confirmar) {
                return;
            }

            localStorage.removeItem(
                "usuarioLogueado"
            );

            localStorage.removeItem(
                "usuario"
            );

            localStorage.removeItem(
                "usuarioActivo"
            );

            localStorage.removeItem(
                "cliente"
            );


            window.location.href =
                "../inicio de sistema/login.html";

        }
    );

}


function rellenarPerfil() {

    const poner = (id, valor) => {
        const el = document.getElementById(id);
        if (el) el.value = valor || "";
    };

    poner("perfilUsuario", usuario.usuario);
    poner("perfilTelefono", usuario.telefono);
    poner("perfilCorreo", usuario.correo);
    poner("perfilDireccion", usuario.direccion);
}

window.actualizarDatosCliente = function (nuevosServicios, nuevosContratos, nuevosPagos) {
    servicios = nuevosServicios || [];
    contratos = nuevosContratos || [];
    pagos = nuevosPagos || [];

    cargarServicios();
    cargarContrato();
    cargarPagos();
    actualizarEstadisticas();
};

function iniciarPanel() {
    actualizarIdentidad();
    rellenarPerfil();

    cargarServicios();

    cargarContrato();

    cargarPagos();

    cargarNotificaciones();

    actualizarEstadisticas();

}


iniciarPanel();

setInterval(
    () => {

        cargarNotificaciones();

    },
    30000
);

