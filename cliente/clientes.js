/* ===========================================================
   Datos de ejemplo — reemplazar por llamadas a tu API/backend
   =========================================================== */

const servicios = [
    {
        id: 1, servicio: "Limpieza general", zona: "Zona Norte", estado: "activo",
        empleado: "Juan Pérez",
        descripcion: "Limpieza general de oficinas y áreas comunes.",
        observaciones: "Sin novedades registradas.",
    },
    {
        id: 2, servicio: "Mantenimiento", zona: "Zona Norte", estado: "pendiente",
        empleado: "Carlos Gómez",
        descripcion: "Mantenimiento preventivo de equipos de limpieza.",
        observaciones: "Programado para la próxima semana.",
    },
];

const contrato = {
    numero: "CT-001",
    inicio: "01/09/2026",
    fin: "01/12/2026",
    valor: "$2.500.000",
    ubicacion: "Bogotá",
};

const pagos = [
    { id: 1, contrato: "CT-001", metodo: "Transferencia" },
    { id: 2, contrato: "CT-001", metodo: "Efectivo" },
    { id: 3, contrato: "CT-001", metodo: "Transferencia" },
];

let notificaciones = [
    { id: 1, tipo: "programado", titulo: "Servicio programado",
        detalle: "Su servicio de limpieza está programado para el día 25 de septiembre.",
        tiempo: "Hace 2 horas", leida: false },
    { id: 2, tipo: "completado", titulo: "Servicio completado",
        detalle: "El servicio del contrato CT-001 fue marcado como completado.",
        tiempo: "Ayer", leida: false },
    { id: 3, tipo: "pago", titulo: "Pago registrado",
        detalle: "Registramos un nuevo pago asociado a tu contrato CT-001.",
        tiempo: "Hace 3 días", leida: true },
];

const iconosNotif = {
    programado: { clase: "card-icono--azul", svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' },
    completado: { clase: "card-icono--verde", svg: '<svg viewBox="0 0 24 24"><path d="M4 12.5 9.5 18 20 6.5"/></svg>' },
    pago:       { clase: "card-icono--morado", svg: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>' },
};

const pillEstado = {
    activo: '<span class="pill pill--activo">Activo</span>',
    pendiente: '<span class="pill pill--pendiente">Pendiente</span>',
    completado: '<span class="pill pill--completado">Completado</span>',
};

/* ===========================================================
   Navegación entre secciones
   =========================================================== */

const titulos = {
    inicio: ["Panel de cliente", "Bienvenido, Carlos Pérez"],
    servicios: ["Servicios", "Mis servicios"],
    contrato: ["Contrato", "Mi contrato"],
    pagos: ["Pagos", "Mis pagos"],
    notificaciones: ["Avisos", "Notificaciones"],
    perfil: ["Cuenta", "Mi perfil"],
};

function irASeccion(nombre) {
    document.querySelectorAll(".contenido").forEach(s => s.classList.remove("active"));
    document.getElementById("sec-" + nombre).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
    document.querySelector(`.nav-link[data-section="${nombre}"]`).classList.add("active");

    const [eyebrow, titulo] = titulos[nombre];
    document.getElementById("sectionEyebrow").textContent = eyebrow;
    document.getElementById("sectionTitulo").textContent = titulo;

    cerrarMenu();
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", e => {
        e.preventDefault();
        irASeccion(link.dataset.section);
    });
});

/* ===== Menú móvil ===== */
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

function cerrarMenu() {
    sidebar.classList.remove("abierto");
    overlay.classList.remove("visible");
    menuToggle.setAttribute("aria-expanded", "false");
}

menuToggle.addEventListener("click", () => {
    const abierto = sidebar.classList.toggle("abierto");
    overlay.classList.toggle("visible", abierto);
    menuToggle.setAttribute("aria-expanded", String(abierto));
});
overlay.addEventListener("click", cerrarMenu);

/* ===========================================================
   Utilidades
   =========================================================== */

function filaVacia(colspan, titulo, texto) {
    return `<tr class="fila-vacia"><td colspan="${colspan}">
        <div class="estado-vacio">
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 9h8M8 13h5"/></svg>
            <p><strong>${titulo}</strong><br>${texto}</p>
        </div>
    </td></tr>`;
}

function filaServicio(s) {
    return `
        <tr class="fila-servicio" data-id="${s.id}">
            <td><strong>${s.servicio}</strong></td>
            <td>${s.zona}</td>
            <td>${pillEstado[s.estado]}</td>
            <td>${s.empleado}</td>
        </tr>
        <tr class="fila-detalle" data-detalle="${s.id}">
            <td colspan="4">
                <div class="detalle-interno">
                    <div><span>Descripción</span><strong>${s.descripcion}</strong></div>
                    <div><span>Zona</span><strong>${s.zona}</strong></div>
                    <div><span>Empleado asignado</span><strong>${s.empleado}</strong></div>
                    <div><span>Estado</span><strong>${s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}</strong></div>
                    <div class="ancho"><span>Observaciones</span><strong>${s.observaciones}</strong></div>
                </div>
            </td>
        </tr>`;
}

/* ===========================================================
   Inicio
   =========================================================== */

function pintarInicio() {
    document.getElementById("statServicios").textContent = servicios.length;
    document.getElementById("statContratos").textContent = 1;
    document.getElementById("statPagos").textContent = pagos.length;

    document.getElementById("conteoInicioServicios").textContent = `${servicios.length} en total`;
    const tbody = document.getElementById("tablaInicioServicios");
    tbody.innerHTML = servicios.length
        ? servicios.map(s => `
            <tr>
                <td><strong>${s.servicio}</strong></td>
                <td>${s.zona}</td>
                <td>${pillEstado[s.estado]}</td>
                <td>${s.empleado}</td>
            </tr>`).join("")
        : filaVacia(4, "Aún no tienes servicios contratados.", "Cuando se te asigne uno, aparecerá aquí.");
}

/* ===========================================================
   Mis servicios (con detalle expandible)
   =========================================================== */

function pintarServicios() {
    document.getElementById("conteoServicios").textContent = `${servicios.length} en total`;
    const tbody = document.getElementById("tablaServicios");
    tbody.innerHTML = servicios.length
        ? servicios.map(filaServicio).join("")
        : filaVacia(4, "Aún no tienes servicios contratados.", "Cuando se te asigne uno, aparecerá aquí.");
}

document.getElementById("tablaServicios").addEventListener("click", e => {
    const fila = e.target.closest(".fila-servicio");
    if (!fila) return;
    const id = fila.dataset.id;
    const detalle = document.querySelector(`.fila-detalle[data-detalle="${id}"]`);
    const yaAbierta = detalle.classList.contains("abierta");
    document.querySelectorAll(".fila-detalle").forEach(d => d.classList.remove("abierta"));
    if (!yaAbierta) detalle.classList.add("abierta");
});

/* ===========================================================
   Mis pagos
   =========================================================== */

function pintarPagos() {
    document.getElementById("conteoPagos").textContent = `${pagos.length} registrados`;
    const tbody = document.getElementById("tablaPagos");
    tbody.innerHTML = pagos.length
        ? pagos.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.contrato}</td>
                <td>${p.metodo}</td>
            </tr>`).join("")
        : filaVacia(3, "No tienes pagos registrados.", "Aparecerán aquí en cuanto se registre uno.");
}

/* ===========================================================
   Notificaciones
   =========================================================== */

function pintarNotificaciones() {
    const sinLeer = notificaciones.filter(n => !n.leida).length;
    document.getElementById("badgeNotif").textContent = sinLeer;
    document.getElementById("badgeNotif").style.display = sinLeer ? "inline-flex" : "none";

    const lista = document.getElementById("listaNotif");
    lista.innerHTML = notificaciones.length
        ? notificaciones.map(n => {
            const ic = iconosNotif[n.tipo] || iconosNotif.programado;
            return `
            <li class="notif-item ${n.leida ? "" : "no-leida"}" data-id="${n.id}">
                <span class="notif-punto"></span>
                <span class="notif-icono ${ic.clase}">${ic.svg}</span>
                <div class="notif-texto">
                    <strong>${n.titulo}</strong>
                    <p>${n.detalle}</p>
                    <time>${n.tiempo}</time>
                </div>
            </li>`;
        }).join("")
        : `<li class="estado-vacio" style="padding:36px 22px;">
            <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/></svg>
            <p><strong>No tienes notificaciones.</strong><br>Te avisaremos aquí de cualquier novedad.</p>
           </li>`;
}

document.getElementById("listaNotif").addEventListener("click", e => {
    const item = e.target.closest(".notif-item");
    if (!item) return;
    const id = Number(item.dataset.id);
    const n = notificaciones.find(n => n.id === id);
    if (n) n.leida = true;
    pintarNotificaciones();
});

document.getElementById("marcarTodas").addEventListener("click", () => {
    notificaciones.forEach(n => n.leida = true);
    pintarNotificaciones();
});

/* ===========================================================
   Mi perfil
   =========================================================== */

const btnEditar = document.getElementById("btnEditar");
const btnGuardarPerfil = document.getElementById("btnGuardarPerfil");
const camposEditables = ["perfilTelefono", "perfilCorreo", "perfilDireccion"];

btnEditar.addEventListener("click", () => {
    camposEditables.forEach(id => document.getElementById(id).disabled = false);
    document.getElementById(camposEditables[0]).focus();
    btnGuardarPerfil.classList.remove("oculto");
    btnEditar.classList.add("oculto");
});

document.getElementById("formPerfil").addEventListener("submit", e => {
    e.preventDefault();
    camposEditables.forEach(id => document.getElementById(id).disabled = true);
    btnGuardarPerfil.classList.add("oculto");
    btnEditar.classList.remove("oculto");

    const datos = {};
    camposEditables.forEach(id => datos[id] = document.getElementById(id).value);
    localStorage.setItem("powerclean_perfil_cliente", JSON.stringify(datos));

    const conf = document.getElementById("confirmacionPerfil");
    conf.classList.add("visible");
    setTimeout(() => conf.classList.remove("visible"), 4000);
});

function cargarPerfilGuardado() {
    const guardado = JSON.parse(localStorage.getItem("powerclean_perfil_cliente") || "null");
    if (!guardado) return;
    camposEditables.forEach(id => {
        if (guardado[id]) document.getElementById(id).value = guardado[id];
    });
}

/* ===========================================================
   Inicialización
   =========================================================== */

cargarPerfilGuardado();
pintarInicio();
pintarServicios();
pintarPagos();
pintarNotificaciones();