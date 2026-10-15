// =====================================================
// PANEL DEL CLIENTE - SOLICITUDES DE SERVICIO Y CONTRATO
// - Guarda cada pedido en Cloud Firestore (colección "solicitudes")
// - Muestra el estado en vivo (Pendiente, Visto, Aprobada...)
// - Recibe las respuestas del supervisor como notificaciones
// =====================================================

import {
    db,
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    COL_SOLICITUDES,
    COL_NOTIFICACIONES
} from "../FIREBASE/firebase.js";


// =====================================================
// SESIÓN DEL CLIENTE
// =====================================================

function leerSesion() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogueado")) || {};
    } catch {
        return {};
    }
}

const sesion = leerSesion();

if (String(sesion.cargo || localStorage.getItem("cargo") || "").toLowerCase() !== "cliente") {
    window.location.href = "../inicio de sistema/login.html";
}

// ID del cliente: id_cliente si existe; si no, el id del usuario en Firebase
const idCliente = String(
    sesion.id_cliente ||
    sesion.id_usuario ||
    sesion.id ||
    ""
);

const nombreCliente =
    sesion.nombre_cliente ||
    sesion.nombre_completo ||
    sesion.nombre ||
    sesion.usuario ||
    "Cliente";


// =====================================================
// UTILIDADES
// =====================================================

const $ = (id) => document.getElementById(id);

function esc(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML;
}

function ms(valor) {
    if (!valor) return 0;
    return valor.toMillis ? valor.toMillis() : new Date(valor).getTime();
}

function formatearFecha(valor) {
    if (!valor) return "ahora";
    const f = valor.toDate ? valor.toDate() : new Date(valor);
    if (isNaN(f)) return "";
    return f.toLocaleString("es-CO", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function formatearDia(iso) {
    if (!iso) return "-";
    const [a, m, d] = iso.split("-");
    return `${d}/${m}/${a}`;
}

function claseEstado(estado) {
    return "estado-" + String(estado || "Pendiente")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

function aviso(titulo, mensaje) {
    if (typeof window.mostrarToast === "function") {
        window.mostrarToast(titulo, mensaje);
    }
}

function hoyISO() {
    const h = new Date();
    h.setMinutes(h.getMinutes() - h.getTimezoneOffset());
    return h.toISOString().slice(0, 10);
}


// =====================================================
// PESTAÑAS: SERVICIO / CONTRATO
// =====================================================

function configurarPestanas() {

    const tabs = document.querySelectorAll(".sol-tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {

            tabs.forEach(t => t.classList.remove("activo"));
            tab.classList.add("activo");

            $("formServicio").classList.toggle("oculto", tab.dataset.form !== "servicio");
            $("formContrato").classList.toggle("oculto", tab.dataset.form !== "contrato");
        });
    });

    // No se puede pedir algo para una fecha pasada
    $("srvFecha").min = hoyISO();
    $("conInicio").min = hoyISO();

    // Teléfono que ya tengamos en la sesión
    if (sesion.telefono) {
        $("srvTelefono").value = sesion.telefono;
        $("conTelefono").value = sesion.telefono;
    }

    // Si el cliente llega desde el botón "Solicitar", se abre la pestaña de servicio
}


// =====================================================
// ENVIAR SOLICITUD
// =====================================================

async function enviarSolicitud(datos, boton, textoBoton, formulario) {

    if (!idCliente) {
        aviso("Sesión", "No se encontró tu ID. Vuelve a iniciar sesión.");
        return;
    }

    boton.disabled = true;
    boton.textContent = "Enviando...";

    try {
        await addDoc(collection(db, COL_SOLICITUDES), {
            id_cliente: idCliente,
            nombre_cliente: nombreCliente,
            correo: sesion.correo || "",
            usuario: sesion.usuario || "",
            ...datos,
            estado: "Pendiente",
            comentario_supervisor: "",
            fecha_envio: serverTimestamp(),
            fecha_actualizacion: serverTimestamp()
        });

        formulario.reset();
        if (sesion.telefono) {
            $("srvTelefono").value = sesion.telefono;
            $("conTelefono").value = sesion.telefono;
        }

        aviso(
            "Solicitud enviada",
            "El supervisor la recibirá y te responderá pronto."
        );

        // Llevar al cliente a ver el seguimiento
        document.querySelector('.nav-link[data-section="solicitudes"]')?.click();

    } catch (error) {
        console.error("Error enviando solicitud:", error);
        aviso(
            "No se pudo enviar",
            "Revisa tu conexión y las reglas de Firestore."
        );
    } finally {
        boton.disabled = false;
        boton.textContent = textoBoton;
    }
}

function configurarFormularios() {

    // ------------ SERVICIO ------------
    $("formServicio").addEventListener("submit", (e) => {
        e.preventDefault();

        enviarSolicitud(
            {
                tipo: "Servicio",
                servicio: $("srvTipo").value,
                direccion: $("srvDireccion").value.trim(),
                fecha_deseada: $("srvFecha").value,
                jornada: $("srvJornada").value,
                telefono: $("srvTelefono").value.trim(),
                descripcion: $("srvDescripcion").value.trim()
            },
            $("btnEnviarServicio"),
            "📤 Enviar solicitud de servicio",
            $("formServicio")
        );
    });

    // ------------ CONTRATO ------------
    $("formContrato").addEventListener("submit", (e) => {
        e.preventDefault();

        const area = $("conArea").value ? Number($("conArea").value) : null;

        enviarSolicitud(
            {
                tipo: "Contrato",
                servicio: $("conServicio").value,
                frecuencia: $("conFrecuencia").value,
                fecha_inicio: $("conInicio").value,
                duracion_meses: Number($("conDuracion").value),
                area_m2: area,
                direccion: $("conUbicacion").value.trim(),
                telefono: $("conTelefono").value.trim(),
                descripcion: $("conDescripcion").value.trim()
            },
            $("btnEnviarContrato"),
            "📤 Enviar solicitud de contrato",
            $("formContrato")
        );
    });
}


// =====================================================
// MIS SOLICITUDES (TIEMPO REAL)
// =====================================================

function escucharSolicitudes() {

    const contenedor = $("listaSolicitudes");

    if (!idCliente) {
        contenedor.innerHTML = `<div class="sol-vacio">No se encontró tu ID de cliente.</div>`;
        return;
    }

    const q = query(
        collection(db, COL_SOLICITUDES),
        where("id_cliente", "==", idCliente)
    );

    onSnapshot(q, (snap) => {

        const lista = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => ms(b.fecha_envio) - ms(a.fecha_envio));

        $("conteoSolicitudes").textContent = `${lista.length} en total`;

        // Contador del menú: solicitudes que siguen en trámite
        const enTramite = lista.filter(s => s.estado === "Pendiente" || s.estado === "Visto" || s.estado === "En revisión").length;
        const badge = $("badgeSolicitudes");
        badge.textContent = enTramite;
        badge.classList.toggle("visible", enTramite > 0);

        if (lista.length === 0) {
            contenedor.innerHTML = `<div class="sol-vacio">Aún no has enviado solicitudes.</div>`;
            return;
        }

        contenedor.innerHTML = lista.map(s => {

            const detalles = s.tipo === "Contrato"
                ? `
                    <span>🧹 ${esc(s.servicio)}</span>
                    <span>🔁 ${esc(s.frecuencia)}</span>
                    <span>📅 Inicio: ${formatearDia(s.fecha_inicio)}</span>
                    <span>⏳ ${esc(s.duracion_meses)} meses</span>
                    ${s.area_m2 ? `<span>📐 ${esc(s.area_m2)} m²</span>` : ""}`
                : `
                    <span>🧹 ${esc(s.servicio)}</span>
                    <span>📅 ${formatearDia(s.fecha_deseada)}</span>
                    <span>🕐 ${esc(s.jornada)}</span>`;

            const respuesta = s.comentario_supervisor
                ? `<div class="sol-respuesta">
                       <strong>Respuesta del supervisor:</strong>
                       ${esc(s.comentario_supervisor)}
                   </div>`
                : "";

            return `
                <div class="sol-item ${s.tipo === "Contrato" ? "es-contrato" : ""}">
                    <div class="sol-item-top">
                        <h4>${s.tipo === "Contrato" ? "📄 Contrato" : "🧹 Servicio"}</h4>
                        <span class="badge-estado ${claseEstado(s.estado)}">${esc(s.estado)}</span>
                    </div>
                    <div class="sol-datos">${detalles}</div>
                    <div class="sol-lugar">📍 ${esc(s.direccion)}</div>
                    ${s.descripcion ? `<p class="sol-texto">${esc(s.descripcion)}</p>` : ""}
                    ${respuesta}
                    <small class="sol-fecha">Enviada: ${formatearFecha(s.fecha_envio)}</small>
                </div>`;
        }).join("");

    }, (error) => {
        console.error("Error escuchando solicitudes:", error);
        contenedor.innerHTML = `
            <div class="sol-vacio sol-error">
                No se pudieron cargar tus solicitudes.
                Revisa las reglas de Firestore.
            </div>`;
    });
}


// =====================================================
// NOTIFICACIONES DEL SUPERVISOR -> CLIENTE
// =====================================================

let notifAnteriores = null;

function escucharNotificaciones() {

    if (!idCliente) return;

    const q = query(
        collection(db, COL_NOTIFICACIONES),
        where("id_cliente", "==", idCliente)
    );

    onSnapshot(q, (snap) => {

        const lista = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => ms(b.fecha) - ms(a.fecha));

        // Aviso emergente cuando llega una nueva (no en la primera carga)
        if (notifAnteriores !== null) {
            const nuevas = lista.filter(n => !notifAnteriores.includes(n.id));
            if (nuevas.length > 0) {
                aviso(nuevas[0].titulo || "Notificación", nuevas[0].mensaje || "");
            }
        }
        notifAnteriores = lista.map(n => n.id);

        // clientes.js las mezcla con las demás
        window.notificacionesNube = lista.map(n => ({
            id: n.id,
            nube: true,
            titulo: n.titulo || "Notificación",
            mensaje: n.mensaje || "",
            fecha: formatearFecha(n.fecha),
            leida: !!n.leida
        }));

        if (typeof window.cargarNotificaciones === "function") {
            window.cargarNotificaciones();
        }

    }, (error) => {
        console.error("Error escuchando notificaciones:", error);
    });

    window.marcarLeidaNube = async (id) => {
        try {
            await updateDoc(doc(db, COL_NOTIFICACIONES, id), { leida: true });
        } catch (e) {
            console.error("No se pudo marcar como leída:", e);
        }
    };

    window.marcarTodasNube = async () => {
        for (const n of (window.notificacionesNube || []).filter(x => !x.leida)) {
            await window.marcarLeidaNube(n.id);
        }
    };
}


// =====================================================
// INICIO
// =====================================================

configurarPestanas();
configurarFormularios();
escucharSolicitudes();
escucharNotificaciones();
