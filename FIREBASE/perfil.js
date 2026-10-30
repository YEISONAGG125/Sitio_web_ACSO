// =====================================================
// PERFIL DE USUARIO - MÓDULO COMPARTIDO
// =====================================================
// Lo usan los paneles de Empleado, Supervisor y Cliente.
//
//  - Lee y guarda los datos en Realtime Database (usuarios/{id}),
//    la misma tabla que usa el login, así los cambios sobreviven
//    al cerrar sesión.
//  - Foto de perfil: se reduce a 256 px y se guarda como texto
//    (data URL) en el campo "foto" del usuario.
//  - Cambio de contraseña: verifica la contraseña actual.
//
// Cómo se conecta con la página: busca elementos por id
// (pfForm, pfNombre, pfFoto, pfPassForm...) y por atributos
// data-pf-avatar / data-pf-nombre. Si un elemento no existe,
// simplemente se ignora.
// =====================================================

import { rtdb, ref, get, update } from "./firebase.js";


// =====================================================
// SESIÓN
// =====================================================

export function leerSesion() {
    try {
        return JSON.parse(localStorage.getItem("usuarioLogueado")) || {};
    } catch {
        return {};
    }
}

function guardarSesion(sesion) {
    localStorage.setItem("usuarioLogueado", JSON.stringify(sesion));
}

const CLAVES_NOMBRE = ["nombre", "nombre_completo", "nombre_cliente", "nombre_empleado"];

export function iniciales(nombre) {
    const letras = String(nombre || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join("");
    return letras || "US";
}

function nombreDe(sesion) {
    return (
        sesion.nombre_empleado ||
        sesion.nombre_completo ||
        sesion.nombre_cliente ||
        sesion.nombre ||
        sesion.usuario ||
        "Usuario"
    );
}

function nombreRol(cargo) {
    const c = String(cargo || "").toLowerCase();
    if (c === "empleado") return "Empleado";
    if (c === "supervisor") return "Supervisor";
    if (c === "cliente") return "Cliente ACSO";
    return c ? c[0].toUpperCase() + c.slice(1) : "Usuario";
}


// =====================================================
// ACCESO A LA BASE DE DATOS
// =====================================================

async function leerRegistro(sesion) {
    if (!sesion.id) return null;
    const snap = await get(ref(rtdb, "usuarios/" + sesion.id));
    return snap.exists() ? snap.val() : null;
}


// =====================================================
// FOTO: REDIMENSIONAR A 256 px
// =====================================================

export function procesarFoto(archivo, lado = 256) {
    return new Promise((resolve, reject) => {

        if (!archivo || !archivo.type.startsWith("image/")) {
            reject(new Error("El archivo no es una imagen."));
            return;
        }

        if (archivo.size > 8 * 1024 * 1024) {
            reject(new Error("La imagen pesa más de 8 MB."));
            return;
        }

        const lector = new FileReader();

        lector.onerror = () => reject(new Error("No se pudo leer la imagen."));

        lector.onload = () => {
            const img = new Image();

            img.onerror = () => reject(new Error("La imagen está dañada."));

            img.onload = () => {
                // Recorte cuadrado centrado
                const lado0 = Math.min(img.width, img.height);
                const sx = (img.width - lado0) / 2;
                const sy = (img.height - lado0) / 2;

                const canvas = document.createElement("canvas");
                canvas.width = lado;
                canvas.height = lado;

                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, lado, lado);
                ctx.drawImage(img, sx, sy, lado0, lado0, 0, 0, lado, lado);

                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };

            img.src = lector.result;
        };

        lector.readAsDataURL(archivo);
    });
}


// =====================================================
// AVATARES Y NOMBRES EN PANTALLA
// =====================================================

function claveFoto(sesion) {
    return "fotoPerfil_" + (sesion.id || sesion.usuario || "x");
}

export function pintarIdentidad(sesion, foto) {

    const nombre = nombreDe(sesion);
    const fotoActual = foto !== undefined ? foto : localStorage.getItem(claveFoto(sesion));

    document.querySelectorAll("[data-pf-avatar]").forEach(el => {
        if (fotoActual) {
            el.textContent = "";
            el.style.backgroundImage = `url("${fotoActual}")`;
            el.classList.add("pf-con-foto");
        } else {
            el.textContent = iniciales(nombre);
            el.style.backgroundImage = "";
            el.classList.remove("pf-con-foto");
        }
    });

    document.querySelectorAll("[data-pf-nombre]").forEach(el => {
        el.textContent = nombre;
    });

    document.querySelectorAll("[data-pf-rol]").forEach(el => {
        el.textContent = nombreRol(sesion.cargo);
    });
}


// =====================================================
// MENSAJES DENTRO DEL PERFIL
// =====================================================

function mensaje(id, texto, tipo = "ok") {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = texto;
    el.className = "pf-msg pf-msg--" + tipo + " pf-msg--ver";
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("pf-msg--ver"), 4500);
}


// =====================================================
// GUARDAR DATOS DE PERFIL
// =====================================================

export async function guardarDatos(sesion, datos) {

    if (!sesion.id) {
        throw new Error("No se encontró tu sesión. Vuelve a iniciar sesión.");
    }

    const registro = (await leerRegistro(sesion)) || {};

    // El nombre se escribe en la(s) clave(s) que ya existan en
    // el usuario, para no romper lo que lee el resto del sistema.
    const cambios = {
        telefono: datos.telefono,
        correo: datos.correo,
        direccion: datos.direccion
    };

    let clavesNombre = CLAVES_NOMBRE.filter(k => k in registro);
    if (clavesNombre.length === 0) clavesNombre = ["nombre"];

    clavesNombre.forEach(k => { cambios[k] = datos.nombre; });

    await update(ref(rtdb, "usuarios/" + sesion.id), cambios);

    // Sesión local
    const nueva = {
        ...sesion,
        nombre: datos.nombre,
        nombre_completo: datos.nombre,
        telefono: datos.telefono,
        correo: datos.correo,
        direccion: datos.direccion
    };

    if (String(sesion.cargo).toLowerCase() === "empleado") {
        nueva.nombre_empleado = datos.nombre;
        localStorage.setItem("nombre_empleado", datos.nombre);
    }

    if (String(sesion.cargo).toLowerCase() === "cliente") {
        nueva.nombre_cliente = datos.nombre;
    }

    guardarSesion(nueva);

    return nueva;
}


export async function guardarFoto(sesion, dataUrl) {

    if (!sesion.id) {
        throw new Error("No se encontró tu sesión. Vuelve a iniciar sesión.");
    }

    await update(ref(rtdb, "usuarios/" + sesion.id), { foto: dataUrl || null });

    if (dataUrl) {
        localStorage.setItem(claveFoto(sesion), dataUrl);
    } else {
        localStorage.removeItem(claveFoto(sesion));
    }
}


// =====================================================
// CAMBIAR CONTRASEÑA
// =====================================================
// OJO: el login de ACSO compara la contraseña en texto plano
// contra Realtime Database, por eso aquí se guarda igual. Cuando
// el login se migre a Firebase Authentication hay que cambiar esto.

export async function cambiarPassword(sesion, actual, nueva, confirmar) {

    if (!actual || !nueva || !confirmar) {
        throw new Error("Completa los tres campos.");
    }

    if (nueva.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
    }

    if (nueva !== confirmar) {
        throw new Error("La confirmación no coincide con la nueva contraseña.");
    }

    if (nueva === actual) {
        throw new Error("La nueva contraseña debe ser diferente a la actual.");
    }

    const registro = await leerRegistro(sesion);

    if (!registro) {
        throw new Error("No se encontró tu usuario.");
    }

    if (String(registro.password || "") !== actual) {
        throw new Error("La contraseña actual es incorrecta.");
    }

    await update(ref(rtdb, "usuarios/" + sesion.id), { password: nueva });
}


// =====================================================
// VALIDACIONES
// =====================================================

export function validarDatos(d) {
    if (d.nombre.length < 3) return "El nombre debe tener al menos 3 caracteres.";
    if (d.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.correo)) return "El correo no es válido.";
    if (d.telefono && !/^\+?[0-9 ]{7,15}$/.test(d.telefono)) return "El teléfono debe tener entre 7 y 15 números.";
    return "";
}


// =====================================================
// MONTAR EL PERFIL EN LA PÁGINA
// =====================================================
// opciones.alGuardar(sesionNueva) -> se llama después de guardar
// para que cada panel refresque sus textos.

export async function montarPerfil(opciones = {}) {

    let sesion = leerSesion();
    const $ = (id) => document.getElementById(id);

    const form = $("pfForm");
    const campos = {
        nombre: $("pfNombre"),
        usuario: $("pfUsuario"),
        id: $("pfId"),
        telefono: $("pfTelefono"),
        correo: $("pfCorreo"),
        direccion: $("pfDireccion")
    };

    const btnEditar = $("pfEditar");
    const btnGuardar = $("pfGuardar");
    const btnCancelar = $("pfCancelar");
    let editando = false;
    let copia = {};

    // ---- Rellenar con lo que haya en la sesión (rápido) ----

    function rellenar() {
        if (campos.nombre) campos.nombre.value = nombreDe(sesion);
        if (campos.usuario) campos.usuario.value = sesion.usuario || "";
        if (campos.id) {
            campos.id.value = String(
                sesion.id_empleado || sesion.id_cliente || sesion.id_usuario || sesion.id || ""
            );
        }
        if (campos.telefono) campos.telefono.value = sesion.telefono || "";
        if (campos.correo) campos.correo.value = sesion.correo || "";
        if (campos.direccion) campos.direccion.value = sesion.direccion || "";
    }

    function bloquear(si) {
        ["nombre", "telefono", "correo", "direccion"].forEach(k => {
            if (campos[k]) campos[k].disabled = si;
        });
        btnGuardar?.classList.toggle("pf-oculto", si);
        btnCancelar?.classList.toggle("pf-oculto", si);
        if (btnEditar) btnEditar.textContent = si ? "✎ Editar datos" : "✕ Cancelar";
        editando = !si;
    }

    rellenar();
    bloquear(true);
    pintarIdentidad(sesion);


    // ---- Completar con lo que haya en la base de datos ----

    try {
        const registro = await leerRegistro(sesion);

        if (registro) {
            sesion = {
                ...sesion,
                telefono: registro.telefono ?? sesion.telefono ?? "",
                correo: registro.correo ?? sesion.correo ?? "",
                direccion: registro.direccion ?? sesion.direccion ?? ""
            };

            // Nombre: respeta el orden que usa el login
            const nombreBD =
                registro.nombre || registro.nombre_completo ||
                registro.nombre_cliente || registro.nombre_empleado;

            if (nombreBD) {
                sesion.nombre = nombreBD;
                sesion.nombre_completo = nombreBD;
            }

            guardarSesion(sesion);

            if (!editando) rellenar();

            // Foto
            if (registro.foto) {
                localStorage.setItem(claveFoto(sesion), registro.foto);
                pintarIdentidad(sesion, registro.foto);
            } else {
                localStorage.removeItem(claveFoto(sesion));
                pintarIdentidad(sesion, "");
            }
        }
    } catch (e) {
        console.warn("No se pudo leer el perfil de Firebase:", e);
    }


    // ---- Editar / cancelar ----

    btnEditar?.addEventListener("click", () => {
        if (!editando) {
            copia = {
                nombre: campos.nombre?.value, telefono: campos.telefono?.value,
                correo: campos.correo?.value, direccion: campos.direccion?.value
            };
            bloquear(false);
            campos.nombre?.focus();
        } else {
            cancelar();
        }
    });

    function cancelar() {
        Object.keys(copia).forEach(k => { if (campos[k]) campos[k].value = copia[k]; });
        bloquear(true);
    }

    btnCancelar?.addEventListener("click", cancelar);


    // ---- Guardar ----

    form?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const datos = {
            nombre: campos.nombre.value.trim(),
            telefono: (campos.telefono?.value || "").trim(),
            correo: (campos.correo?.value || "").trim(),
            direccion: (campos.direccion?.value || "").trim()
        };

        const error = validarDatos(datos);
        if (error) {
            mensaje("pfMsg", error, "error");
            return;
        }

        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            sesion = await guardarDatos(sesion, datos);
            pintarIdentidad(sesion);
            bloquear(true);
            mensaje("pfMsg", "Perfil actualizado correctamente.", "ok");
            opciones.alGuardar?.(sesion);
            window.dispatchEvent(new CustomEvent("perfil-guardado", { detail: sesion }));
        } catch (err) {
            console.error(err);
            mensaje("pfMsg", err.message || "No se pudo guardar el perfil.", "error");
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "✓ Guardar cambios";
        }
    });


    // En el panel del cliente otro script puede cambiar la sesión
    // (guarda el perfil por su cuenta), así que antes de pintar se
    // vuelve a leer para no mostrar datos viejos.
    function refrescarSesion() {
        sesion = { ...sesion, ...leerSesion() };
    }

    // ---- Foto ----

    $("pfFoto")?.addEventListener("change", async (e) => {
        const archivo = e.target.files[0];
        e.target.value = "";
        if (!archivo) return;

        refrescarSesion();

        try {
            const dataUrl = await procesarFoto(archivo);
            await guardarFoto(sesion, dataUrl);
            pintarIdentidad(sesion, dataUrl);
            mensaje("pfMsg", "Foto actualizada.", "ok");
        } catch (err) {
            mensaje("pfMsg", err.message || "No se pudo guardar la foto.", "error");
        }
    });

    $("pfQuitarFoto")?.addEventListener("click", async () => {
        refrescarSesion();

        try {
            await guardarFoto(sesion, null);
            pintarIdentidad(sesion, "");
            mensaje("pfMsg", "Foto eliminada.", "ok");
        } catch (err) {
            mensaje("pfMsg", err.message || "No se pudo quitar la foto.", "error");
        }
    });


    // ---- Contraseña ----

    $("pfPassForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const boton = $("pfPassGuardar");
        boton.disabled = true;

        try {
            await cambiarPassword(
                sesion,
                $("pfPassActual").value,
                $("pfPassNueva").value,
                $("pfPassConfirmar").value
            );
            $("pfPassForm").reset();
            mensaje("pfPassMsg", "Contraseña actualizada correctamente.", "ok");
        } catch (err) {
            mensaje("pfPassMsg", err.message || "No se pudo cambiar la contraseña.", "error");
        } finally {
            boton.disabled = false;
        }
    });

    // Mostrar / ocultar contraseñas
    document.querySelectorAll("[data-pf-ver-pass]").forEach(b => {
        b.addEventListener("click", () => {
            const input = $(b.dataset.pfVerPass);
            if (!input) return;
            const oculto = input.type === "password";
            input.type = oculto ? "text" : "password";
            b.textContent = oculto ? "🙈" : "👁";
        });
    });
}
