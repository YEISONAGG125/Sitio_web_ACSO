/* ===========================================================
   Datos de ejemplo — reemplazar por llamadas a tu API/backend
   =========================================================== */

const servicios = [
    { id: 1, cliente: "Constructora Andes S.A.", direccion: "Cra 15 #93-40, Bogotá", fecha: "2026-09-19", hora: "08:00 a.m.", estado: "en curso",
        productos: ["Detergente industrial", "Guantes de nitrilo", "Paños de microfibra"] },
    { id: 2, cliente: "Edificio Mirador del Parque", direccion: "Calle 100 #14-32, Bogotá", fecha: "2026-09-19", hora: "02:00 p.m.", estado: "pendiente",
        productos: ["Desinfectante multiusos", "Bolsas de basura 60L"] },
    { id: 3, cliente: "Oficinas Grupo Sura", direccion: "Av. Chile #10-25, Bogotá", fecha: "2026-09-21", hora: "09:00 a.m.", estado: "pendiente",
        productos: ["Limpiavidrios", "Paños de microfibra"] },
    { id: 4, cliente: "Restaurante La Central", direccion: "Cra 7 #63-40, Bogotá", fecha: "2026-09-17", hora: "10:00 a.m.", estado: "completado",
        productos: ["Desengrasante", "Guantes de nitrilo"] },
    { id: 5, cliente: "Colegio San Rafael", direccion: "Cll 170 #45-12, Bogotá", fecha: "2026-09-16", hora: "07:00 a.m.", estado: "completado",
        productos: ["Detergente industrial", "Trapeador"] },
    { id: 6, cliente: "Clínica del Country", direccion: "Cra 16 #82-57, Bogotá", fecha: "2026-09-22", hora: "11:00 a.m.", estado: "pendiente",
        productos: ["Desinfectante hospitalario", "Guantes de nitrilo", "Bolsas de riesgo biológico"] },
];

const productosInventario = [
    { nombre: "Detergente industrial", categoria: "Limpieza", cantidad: "2 galones", stock: "disponible", para: "Constructora Andes S.A." },
    { nombre: "Guantes de nitrilo", categoria: "Protección", cantidad: "3 pares", stock: "disponible", para: "Múltiples servicios" },
    { nombre: "Paños de microfibra", categoria: "Limpieza", cantidad: "6 unidades", stock: "bajo", para: "Múltiples servicios" },
    { nombre: "Desinfectante multiusos", categoria: "Limpieza", cantidad: "1 galón", stock: "disponible", para: "Edificio Mirador del Parque" },
    { nombre: "Bolsas de basura 60L", categoria: "Insumos", cantidad: "1 rollo", stock: "agotado", para: "Edificio Mirador del Parque" },
    { nombre: "Limpiavidrios", categoria: "Limpieza", cantidad: "1 litro", stock: "disponible", para: "Oficinas Grupo Sura" },
    { nombre: "Desinfectante hospitalario", categoria: "Protección", cantidad: "1 galón", stock: "bajo", para: "Clínica del Country" },
    { nombre: "Bolsas de riesgo biológico", categoria: "Protección", cantidad: "10 unidades", stock: "disponible", para: "Clínica del Country" },
];

const notificacionesData = [
    { id: 1, tipo: "servicio", titulo: "Nuevo servicio asignado", detalle: "Clínica del Country — 22 de septiembre, 11:00 a.m.", tiempo: "Hace 1 hora", leida: false },
    { id: 2, tipo: "producto", titulo: "Insumo con bajo stock", detalle: "Paños de microfibra — quedan pocas unidades disponibles.", tiempo: "Hace 3 horas", leida: false },
    { id: 3, tipo: "horario", titulo: "Recordatorio de horario", detalle: "Mañana inicias a las 8:00 a.m. en Constructora Andes S.A.", tiempo: "Ayer", leida: false },
    { id: 4, tipo: "novedad", titulo: "Novedad en revisión", detalle: "Tu supervisor está revisando tu solicitud de permiso.", tiempo: "Hace 2 días", leida: true },
];

const horarioSemana = [
    { dia: "Lun", fecha: "14 sep", turnos: [{ hora: "7:00 a.m.", texto: "Colegio San Rafael" }] },
    { dia: "Mar", fecha: "15 sep", turnos: [] },
    { dia: "Mié", fecha: "16 sep", turnos: [{ hora: "7:00 a.m.", texto: "Colegio San Rafael" }] },
    { dia: "Jue", fecha: "17 sep", turnos: [{ hora: "10:00 a.m.", texto: "Restaurante La Central" }] },
    { dia: "Vie", fecha: "18 sep", turnos: [] },
    { dia: "Sáb", fecha: "19 sep", turnos: [{ hora: "8:00 a.m.", texto: "Constructora Andes S.A." }, { hora: "2:00 p.m.", texto: "Edificio Mirador" }], hoy: true },
    { dia: "Dom", fecha: "20 sep", turnos: [] },
];

/* ===========================================================
   Estado
   =========================================================== */

let notificaciones = [...notificacionesData];
let novedades = JSON.parse(localStorage.getItem("acso_novedades") || "[]");

const iconosNotif = {
    servicio: { clase: "card-icono--azul", svg: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' },
    producto:  { clase: "card-icono--ambar", svg: '<svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/></svg>' },
    horario:   { clase: "card-icono--verde", svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' },
    novedad:   { clase: "card-icono--morado", svg: '<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5"/><path d="M12 18h.01"/></svg>' },
};

const pillEstado = {
    "pendiente": '<span class="pill pill--pendiente">Pendiente</span>',
    "en curso": '<span class="pill pill--curso">En curso</span>',
    "completado": '<span class="pill pill--completado">Completado</span>',
};

/* ===========================================================
   Navegación entre secciones
   =========================================================== */

const titulos = {
    inicio: ["Panel de trabajo", "Hola, María Fernanda"],
    servicios: ["Servicios", "Mis servicios"],
    horario: ["Semana laboral", "Mi horario"],
    productos: ["Insumos", "Productos / Inventario"],
    novedad: ["Novedades", "Reportar novedad"],
    reportes: ["Novedades", "Reportes"],
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
   Inicio: estadísticas + próximos servicios
   =========================================================== */

function pintarInicio() {
    const hoy = "2026-09-19";
    const serviciosHoy = servicios.filter(s => s.fecha === hoy);
    const pendientes = servicios.filter(s => s.estado === "pendiente" || s.estado === "en curso");
    const completados = servicios.filter(s => s.estado === "completado");
    const sinLeer = notificaciones.filter(n => !n.leida);

    document.getElementById("statHoy").textContent = serviciosHoy.length;
    document.getElementById("statPendientes").textContent = pendientes.length;
    document.getElementById("statCompletados").textContent = completados.length;
    document.getElementById("statNotif").textContent = sinLeer.length;

    const proximos = servicios
        .filter(s => s.estado !== "completado")
        .sort((a, b) => a.fecha.localeCompare(b.fecha))
        .slice(0, 5);

    document.getElementById("conteoProximos").textContent = `${proximos.length} en total`;

    const tbody = document.getElementById("tablaProximos");
    tbody.innerHTML = proximos.length
        ? proximos.map(s => `
            <tr>
                <td><strong>${s.cliente}</strong></td>
                <td>${s.direccion}</td>
                <td>${formatoFecha(s.fecha)}</td>
                <td>${s.hora}</td>
                <td>${pillEstado[s.estado]}</td>
            </tr>`).join("")
        : filaVacia(5, "No tienes servicios próximos.", "Cuando te asignen uno nuevo, aparecerá aquí.");
}

function formatoFecha(fecha) {
    const [a, m, d] = fecha.split("-");
    const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
    return `${d} ${meses[parseInt(m,10)-1]}`;
}

function filaVacia(colspan, titulo, texto) {
    return `<tr class="fila-vacia"><td colspan="${colspan}">
        <div class="estado-vacio">
            <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 9h8M8 13h5"/></svg>
            <p><strong>${titulo}</strong><br>${texto}</p>
        </div>
    </td></tr>`;
}

/* ===========================================================
   Mis servicios (con filtros)
   =========================================================== */

function pintarServicios(filtro = "todos") {
    const lista = filtro === "todos" ? servicios : servicios.filter(s => s.estado === filtro);
    document.getElementById("conteoServicios").textContent = `${lista.length} en total`;

    const tbody = document.getElementById("tablaServicios");
    tbody.innerHTML = lista.length
        ? lista.map(s => `
            <tr>
                <td><strong>${s.cliente}</strong></td>
                <td>${s.direccion}</td>
                <td>${formatoFecha(s.fecha)}</td>
                <td>${s.hora}</td>
                <td>${s.productos.join(", ")}</td>
                <td>${pillEstado[s.estado]}</td>
            </tr>`).join("")
        : filaVacia(6, "No hay servicios en esta categoría.", "Prueba con otro filtro.");
}

document.getElementById("filtroServicios").addEventListener("click", e => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    document.querySelectorAll("#filtroServicios .tab").forEach(t => t.classList.remove("active"));
    btn.classList.add("active");
    pintarServicios(btn.dataset.filtro);
});

/* ===========================================================
   Mi horario
   =========================================================== */

function pintarHorario() {
    const cont = document.getElementById("grillaHorario");
    cont.innerHTML = horarioSemana.map(d => `
        <div class="dia-card ${d.hoy ? "hoy" : ""}">
            <h4>${d.dia}<small>${d.fecha}</small></h4>
            ${d.turnos.length
                ? d.turnos.map(t => `<div class="turno"><strong>${t.hora}</strong>${t.texto}</div>`).join("")
                : `<p class="dia-vacio">Sin servicios</p>`}
        </div>`).join("");
}

/* ===========================================================
   Productos / Inventario
   =========================================================== */

const pillStock = {
    disponible: '<span class="pill pill--disponible">Disponible</span>',
    bajo: '<span class="pill pill--bajo">Bajo stock</span>',
    agotado: '<span class="pill pill--agotado">Agotado</span>',
};

function pintarProductos() {
    const cont = document.getElementById("grillaProductos");
    cont.innerHTML = productosInventario.map(p => `
        <div class="producto-card">
            <span class="producto-icono">
                <svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/></svg>
            </span>
            <h4>${p.nombre}</h4>
            <span class="cantidad">${p.cantidad}</span>
            <span class="para">Para: ${p.para}</span>
            ${pillStock[p.stock]}
        </div>`).join("");
}

/* ===========================================================
   Reportar novedad
   =========================================================== */

const pillNovedad = {
    "Enviada": '<span class="pill pill--enviada">Enviada</span>',
    "En revisión": '<span class="pill pill--revision">En revisión</span>',
    "Resuelta": '<span class="pill pill--resuelta">Resuelta</span>',
};

function guardarNovedades() {
    localStorage.setItem("acso_novedades", JSON.stringify(novedades));
}

function pintarNovedades() {
    document.getElementById("conteoNovedades").textContent = `${novedades.length} registradas`;
    const tbody = document.getElementById("tablaNovedades");
    tbody.innerHTML = novedades.length
        ? novedades.slice().reverse().map(n => `
            <tr>
                <td><strong>${n.tipo}</strong></td>
                <td>${formatoFecha(n.fecha)}</td>
                <td>${n.descripcion}</td>
                <td>${pillNovedad[n.estado]}</td>
            </tr>`).join("")
        : filaVacia(4, "No has reportado novedades.", "Usa el formulario de arriba cuando lo necesites.");
}

document.getElementById("formNovedad").addEventListener("submit", e => {
    e.preventDefault();
    const tipo = document.getElementById("tipoNovedad").value;
    const fecha = new Date().toISOString().slice(0, 10); // fecha del reporte, asignada automáticamente
    const descripcion = document.getElementById("descripcionNovedad").value;

    novedades.push({ tipo, fecha, descripcion, estado: "Enviada" });
    guardarNovedades();
    pintarNovedades();

    notificaciones.unshift({
        id: Date.now(), tipo: "novedad",
        titulo: "Novedad enviada",
        detalle: `Tu novedad de tipo "${tipo}" fue registrada correctamente.`,
        tiempo: "Ahora mismo", leida: false,
    });
    pintarNotificaciones();
    pintarInicio();

    e.target.reset();
    const conf = document.getElementById("confirmacionNovedad");
    conf.classList.add("visible");
    setTimeout(() => conf.classList.remove("visible"), 4000);
});

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
            const ic = iconosNotif[n.tipo] || iconosNotif.servicio;
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
    pintarInicio();
});

document.getElementById("marcarTodas").addEventListener("click", () => {
    notificaciones.forEach(n => n.leida = true);
    pintarNotificaciones();
    pintarInicio();
});

/* ===========================================================
   Mi perfil
   =========================================================== */

const btnEditar = document.getElementById("btnEditar");
const btnGuardarPerfil = document.getElementById("btnGuardarPerfil");
const camposEditables = ["perfilCorreo", "perfilTelefono", "perfilContacto"];

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
    localStorage.setItem("acso_perfil", JSON.stringify(datos));

    const conf = document.getElementById("confirmacionPerfil");
    conf.classList.add("visible");
    setTimeout(() => conf.classList.remove("visible"), 4000);
});

function cargarPerfilGuardado() {
    const guardado = JSON.parse(localStorage.getItem("acso_perfil") || "null");
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
pintarHorario();
pintarProductos();
pintarNovedades();
pintarNotificaciones();