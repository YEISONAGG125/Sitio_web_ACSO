// =====================================================
// PANEL DEL EMPLEADO
// - Novedades / incapacidades  -> Cloud Firestore (tiempo real)
// - Notificaciones             -> Cloud Firestore (tiempo real)
// - Servicios y horarios       -> API Spring Boot (opcional)
// =====================================================

import {
    db,
    rtdb,
    ref,
    update,
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    COL_NOVEDADES,
    COL_NOTIFICACIONES
} from "../FIREBASE/firebase.js";


// =====================================================
// CONFIGURACIÓN
// =====================================================

// Solo se usa para servicios y horarios. Si el backend no está
// encendido, esas dos secciones muestran un aviso y el resto sigue
// funcionando.
const API_BASE = "http://localhost:8080/api";


// =====================================================
// SESIÓN DEL EMPLEADO
// =====================================================

function leerSesion() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogueado")) || {};
    } catch {
        return {};
    }
}

const sesion = leerSesion();

// Solo pueden entrar empleados
if (String(sesion.cargo || localStorage.getItem("cargo") || "").toLowerCase() !== "empleado") {
    window.location.href = "../inicio de sistema/login.html";
}

// ID: id_empleado si existe; si no, el id del usuario en Firebase
const idEmpleado = String(
    localStorage.getItem("id_empleado") ||
    sesion.id_empleado ||
    sesion.id_usuario ||
    sesion.id ||
    ""
);

const nombreEmpleado =
    localStorage.getItem("nombre_empleado") ||
    sesion.nombre_empleado ||
    sesion.nombre_completo ||
    sesion.nombre ||
    sesion.usuario ||
    "Empleado";


// =====================================================
// UTILIDADES
// =====================================================

const $ = (id) => document.getElementById(id);

function escaparHTML(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
}

function formatearFecha(valor) {
    if (!valor) return "";
    const fecha = valor.toDate ? valor.toDate() : new Date(valor);
    if (isNaN(fecha)) return "";
    return fecha.toLocaleString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatearDia(isoDia) {
    if (!isoDia) return "-";
    const [a, m, d] = isoDia.split("-");
    return `${d}/${m}/${a}`;
}

function claseEstado(estado) {
    return "estado-" + String(estado || "Pendiente")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

function milisegundos(valor) {
    if (!valor) return 0;
    return valor.toMillis ? valor.toMillis() : new Date(valor).getTime();
}

function mostrarMensaje(texto, tipo = "") {
    const caja = $("mensajeSistema");
    $("textoMensaje").textContent = texto;
    caja.className = "mensaje-sistema mostrar " + tipo;
    clearTimeout(mostrarMensaje.t);
    mostrarMensaje.t = setTimeout(() => {
        caja.className = "mensaje-sistema";
    }, 3500);
}


// =====================================================
// DATOS DEL EMPLEADO EN PANTALLA
// =====================================================

function mostrarDatosEmpleado() {
    $("nombreEmpleado").textContent = nombreEmpleado;
    $("inicioNombre").textContent = nombreEmpleado;
    $("formNombreEmpleado").textContent = nombreEmpleado;
    $("saludoEmpleado").textContent = `Hola, ${nombreEmpleado.split(" ")[0]}`;

    $("inicioId").textContent = idEmpleado || "-";
    $("formIdEmpleado").textContent = idEmpleado || "-";

    const iniciales = nombreEmpleado
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join("");

    $("avatarEmpleado").textContent = iniciales || "US";
}


// =====================================================
// MENÚ
// =====================================================

const TITULOS = {
    inicio: ["Panel del Empleado", "Consulta tu información laboral"],
    servicios: ["Mis servicios", "Servicios asignados"],
    novedades: ["Novedad laboral", "Envía una novedad o incapacidad al supervisor"],
    notificaciones: ["Notificaciones", "Información importante"],
    horarios: ["Mi horario", "Consulta tus horarios de trabajo"]
};

function configurarMenu() {
    const botones = document.querySelectorAll(".menu-item");
    const secciones = document.querySelectorAll(".seccion");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {

            const seccion = boton.dataset.seccion;

            botones.forEach(b => b.classList.remove("activo"));
            boton.classList.add("activo");

            secciones.forEach(s => s.classList.remove("activa"));
            $(seccion)?.classList.add("activa");

            if (TITULOS[seccion]) {
                $("tituloPagina").textContent = TITULOS[seccion][0];
                $("subtituloPagina").textContent = TITULOS[seccion][1];
            }

            // Al abrir notificaciones se marcan como leídas
            if (seccion === "notificaciones") {
                marcarNotificacionesLeidas();
            }
        });
    });
}


// =====================================================
// FORMULARIO DE NOVEDAD / INCAPACIDAD
// =====================================================

function configurarFormulario() {

    const tipo = $("tipoNovedad");
    const bloque = $("camposIncapacidad");
    const fInicio = $("fechaInicio");
    const fFin = $("fechaFin");
    const dias = $("diasCalculados");
    const texto = $("descripcionNovedad");

    // Mostrar campos extra si es incapacidad
    tipo.addEventListener("change", () => {
        const esIncapacidad = tipo.value === "Incapacidad";
        bloque.classList.toggle("oculto", !esIncapacidad);
        fInicio.required = esIncapacidad;
        fFin.required = esIncapacidad;
    });

    // Calcular días
    function calcularDias() {
        if (!fInicio.value || !fFin.value) {
            dias.textContent = "-";
            return null;
        }
        const diff = (new Date(fFin.value) - new Date(fInicio.value)) / 86400000 + 1;
        if (diff < 1) {
            dias.textContent = "Fechas inválidas";
            return null;
        }
        dias.textContent = diff + (diff === 1 ? " día" : " días");
        return diff;
    }

    fInicio.addEventListener("change", () => {
        fFin.min = fInicio.value;
        calcularDias();
    });
    fFin.addEventListener("change", calcularDias);

    // Contador de caracteres
    texto.addEventListener("input", () => {
        $("contadorCaracteres").textContent = texto.value.length;
    });

    // Enviar
    $("formNovedad").addEventListener("submit", async (event) => {

        event.preventDefault();

        if (!idEmpleado) {
            mostrarMensaje("No se encontró tu ID. Vuelve a iniciar sesión.", "error");
            return;
        }

        const tipoValor = tipo.value;
        const descripcion = texto.value.trim();

        if (!tipoValor) {
            mostrarMensaje("Selecciona el tipo de novedad.", "error");
            return;
        }

        if (!descripcion) {
            mostrarMensaje("Escribe una descripción.", "error");
            return;
        }

        const esIncapacidad = tipoValor === "Incapacidad";
        let diasIncapacidad = null;

        if (esIncapacidad) {
            diasIncapacidad = calcularDias();
            if (!diasIncapacidad) {
                mostrarMensaje("Revisa las fechas de la incapacidad.", "error");
                return;
            }
        }

        const boton = $("btnEnviarNovedad");
        boton.disabled = true;
        boton.textContent = "Enviando...";

        const novedad = {
            id_empleado: idEmpleado,
            nombre_empleado: nombreEmpleado,
            usuario: sesion.usuario || "",
            tipo_novedad: tipoValor,
            descripcion: descripcion,
            es_incapacidad: esIncapacidad,
            fecha_inicio: esIncapacidad ? fInicio.value : null,
            fecha_fin: esIncapacidad ? fFin.value : null,
            dias_incapacidad: diasIncapacidad,
            entidad: esIncapacidad ? $("entidadIncapacidad").value.trim() : "",
            estado: "Pendiente",
            comentario_supervisor: "",
            fecha_envio: serverTimestamp(),
            fecha_actualizacion: serverTimestamp()
        };

        try {
            await addDoc(collection(db, COL_NOVEDADES), novedad);

            mostrarMensaje(
                esIncapacidad
                    ? "Incapacidad enviada al supervisor."
                    : "Novedad enviada al supervisor.",
                "exito"
            );

            $("formNovedad").reset();
            bloque.classList.add("oculto");
            dias.textContent = "-";
            $("contadorCaracteres").textContent = "0";

        } catch (error) {
            console.error("Error enviando novedad:", error);
            mostrarMensaje(
                "No se pudo enviar. Revisa tu conexión y las reglas de Firestore.",
                "error"
            );
        } finally {
            boton.disabled = false;
            boton.textContent = "📤 Enviar novedad";
        }
    });
}


// =====================================================
// HISTORIAL DE NOVEDADES (TIEMPO REAL)
// =====================================================

function escucharNovedades() {

    const contenedor = $("listaNovedades");

    if (!idEmpleado) {
        contenedor.innerHTML = `<div class="mensaje-error">No se encontró el ID del empleado.</div>`;
        return;
    }

    const q = query(
        collection(db, COL_NOVEDADES),
        where("id_empleado", "==", idEmpleado)
    );

    onSnapshot(q, (snap) => {

        const lista = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => milisegundos(b.fecha_envio) - milisegundos(a.fecha_envio));

        $("totalNovedades").textContent = lista.length;

        if (lista.length === 0) {
            contenedor.innerHTML = `<div class="mensaje-vacio">No tienes novedades registradas.</div>`;
            return;
        }

        contenedor.innerHTML = lista.map(n => {

            const rango = n.es_incapacidad
                ? `<div class="novedad-extra">
                       📅 ${formatearDia(n.fecha_inicio)} → ${formatearDia(n.fecha_fin)}
                       · <strong>${n.dias_incapacidad} ${n.dias_incapacidad === 1 ? "día" : "días"}</strong>
                       ${n.entidad ? "· " + escaparHTML(n.entidad) : ""}
                   </div>`
                : "";

            const respuesta = n.comentario_supervisor
                ? `<div class="novedad-respuesta">
                       <strong>Respuesta del supervisor:</strong>
                       ${escaparHTML(n.comentario_supervisor)}
                   </div>`
                : "";

            return `
                <div class="novedad-item">
                    <div class="novedad-top">
                        <h3>${n.es_incapacidad ? "🩺" : "📝"} ${escaparHTML(n.tipo_novedad)}</h3>
                        <span class="badge-estado ${claseEstado(n.estado)}">${escaparHTML(n.estado)}</span>
                    </div>
                    ${rango}
                    <p>${escaparHTML(n.descripcion)}</p>
                    ${respuesta}
                    <div class="novedad-meta">Enviada: ${formatearFecha(n.fecha_envio) || "ahora"}</div>
                </div>
            `;
        }).join("");

    }, (error) => {
        console.error("Error escuchando novedades:", error);
        contenedor.innerHTML = `
            <div class="mensaje-error">
                No se pudieron cargar las novedades. Revisa las reglas de Firestore.
            </div>`;
    });
}


// =====================================================
// NOTIFICACIONES (TIEMPO REAL)
// =====================================================

let notificacionesActuales = [];

function escucharNotificaciones() {

    const contenedor = $("listaNotificaciones");

    if (!idEmpleado) {
        contenedor.innerHTML = `<div class="mensaje-vacio">No tienes notificaciones.</div>`;
        return;
    }

    const q = query(
        collection(db, COL_NOTIFICACIONES),
        where("id_empleado", "==", idEmpleado)
    );

    onSnapshot(q, (snap) => {

        notificacionesActuales = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => milisegundos(b.fecha) - milisegundos(a.fecha));

        const sinLeer = notificacionesActuales.filter(n => !n.leida).length;

        $("totalNotificaciones").textContent = notificacionesActuales.length;

        const contador = $("contadorNotificaciones");
        contador.textContent = sinLeer;
        contador.classList.toggle("oculto", sinLeer === 0);

        if (notificacionesActuales.length === 0) {
            contenedor.innerHTML = `<div class="mensaje-vacio">No tienes notificaciones.</div>`;
            return;
        }

        contenedor.innerHTML = notificacionesActuales.map(n => `
            <div class="notificacion ${n.leida ? "" : "nueva"}">
                <h3>🔔 ${escaparHTML(n.titulo || "Notificación")}</h3>
                <p>${escaparHTML(n.mensaje || "")}</p>
                <small>${formatearFecha(n.fecha)}</small>
            </div>
        `).join("");

        // Si la sección está abierta, se marcan leídas al instante
        if ($("notificaciones").classList.contains("activa")) {
            marcarNotificacionesLeidas();
        }

    }, (error) => {
        console.error("Error escuchando notificaciones:", error);
        contenedor.innerHTML = `<div class="mensaje-error">No se pudieron cargar las notificaciones.</div>`;
    });
}

async function marcarNotificacionesLeidas() {
    const pendientes = notificacionesActuales.filter(n => !n.leida);
    for (const n of pendientes) {
        try {
            await updateDoc(doc(db, COL_NOTIFICACIONES, n.id), { leida: true });
        } catch (e) {
            console.error("No se pudo marcar como leída:", e);
        }
    }
}


// =====================================================
// SERVICIOS Y HORARIOS (API SPRING BOOT - OPCIONAL)
// =====================================================

async function obtenerDatos(endpoint) {
    const respuesta = await fetch(`${API_BASE}${endpoint}`);
    if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
    return await respuesta.json();
}

async function cargarServicios() {

    const contenedor = $("listaServicios");
    const cargando = $("cargandoServicios");

    cargando.style.display = "flex";
    contenedor.innerHTML = "";

    try {
        const servicios = await obtenerDatos(`/servicios/empleado/${idEmpleado}`);

        cargando.style.display = "none";
        $("totalServicios").textContent = Array.isArray(servicios) ? servicios.length : 0;

        if (!Array.isArray(servicios) || servicios.length === 0) {
            contenedor.innerHTML = `<div class="mensaje-vacio">No tienes servicios asignados.</div>`;
            return;
        }

        servicios.forEach(s => {
            const tarjeta = document.createElement("div");
            tarjeta.className = "tarjeta-servicio";
            tarjeta.innerHTML = `
                <h3>🧹 ${escaparHTML(s.nombre_servicio || s.nombre || "Servicio")}</h3>
                <p><strong>Fecha:</strong> ${escaparHTML(s.fecha || s.fecha_servicio || "No especificada")}</p>
                <p><strong>Ubicación:</strong> ${escaparHTML(s.ubicacion || s.direccion || "No especificada")}</p>
                <span class="estado">${escaparHTML(s.estado || "Pendiente")}</span>
            `;
            contenedor.appendChild(tarjeta);
        });

    } catch (error) {
        cargando.style.display = "none";
        contenedor.innerHTML = `
            <div class="mensaje-vacio">
                Los servicios no están disponibles en este momento
                (el servidor de servicios no está conectado).
            </div>`;
    }
}

async function cargarHorarios() {

    const tabla = $("tablaHorarios");

    tabla.innerHTML = `<tr><td colspan="5">Cargando horarios...</td></tr>`;

    try {
        const horarios = await obtenerDatos(`/horarios/empleado/${idEmpleado}`);

        $("totalHorarios").textContent = Array.isArray(horarios) ? horarios.length : 0;

        if (!Array.isArray(horarios) || horarios.length === 0) {
            tabla.innerHTML = `<tr><td colspan="5">No tienes horarios registrados.</td></tr>`;
            return;
        }

        tabla.innerHTML = horarios.map(h => `
            <tr>
                <td>${escaparHTML(h.fecha || h.fecha_asignado || "-")}</td>
                <td>${escaparHTML(h.hora_inicio || h.horaInicio || "-")}</td>
                <td>${escaparHTML(h.hora_fin || h.horaFin || "-")}</td>
                <td>${escaparHTML(h.turno || "-")}</td>
                <td>${escaparHTML(h.estado || "Programado")}</td>
            </tr>
        `).join("");

    } catch (error) {
        tabla.innerHTML = `
            <tr><td colspan="5">
                Los horarios no están disponibles en este momento
                (el servidor no está conectado).
            </td></tr>`;
    }
}


// =====================================================
// CERRAR SESIÓN
// =====================================================

async function cerrarSesion() {

    try {
        if (sesion.id) {
            await update(ref(rtdb, "usuarios/" + sesion.id), { online: false });
        }
    } catch (e) {
        console.warn("No se pudo marcar offline:", e);
    }

    [
        "usuarioLogueado",
        "usuario",
        "cargo",
        "id_empleado",
        "nombre_empleado",
        "nombreEmpleado"
    ].forEach(k => localStorage.removeItem(k));

    window.location.href = "../inicio de sistema/login.html";
}


// =====================================================
// INICIO
// =====================================================

mostrarDatosEmpleado();
configurarMenu();
configurarFormulario();

escucharNovedades();
escucharNotificaciones();

if (idEmpleado) {
    cargarServicios();
    cargarHorarios();
}

$("btnActualizarServicios").addEventListener("click", cargarServicios);
$("btnActualizarHorarios").addEventListener("click", cargarHorarios);
$("cerrarSesion").addEventListener("click", cerrarSesion);
