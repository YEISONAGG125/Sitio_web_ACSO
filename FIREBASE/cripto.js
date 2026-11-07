

const enc = new TextEncoder();

export const ITERACIONES = 210000;  

export function aBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}

export function deBase64(texto) {
    const s = atob(texto);
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes;
}

export function aBase64Url(buffer) {
    return aBase64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}



export function bytesAleatorios(n = 16) {
    return crypto.getRandomValues(new Uint8Array(n));
}

export async function derivarHash(clave, saltBase64, iteraciones = ITERACIONES) {

    const material = await crypto.subtle.importKey(
        "raw",
        enc.encode(String(clave)),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            hash: "SHA-256",
            salt: deBase64(saltBase64),
            iterations: iteraciones
        },
        material,
        256
    );

    return aBase64(bits);
}
export async function crearHashClave(clave) {
    const salt = aBase64(bytesAleatorios(16));
    const hash = await derivarHash(clave, salt, ITERACIONES);
    return { hash, salt, iter: ITERACIONES };
}
export async function verificarHashClave(clave, guardado) {
    if (!guardado || !guardado.hash || !guardado.salt) return false;
    const calculado = await derivarHash(clave, guardado.salt, Number(guardado.iter) || ITERACIONES);
    return compararSeguro(calculado, guardado.hash);
}


export async function sha256(texto) {
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(String(texto)));
    return aBase64(buf);
}

export function nuevoToken() {
    return aBase64Url(bytesAleatorios(32)); 
}

export function compararSeguro(a, b) {
    a = String(a); b = String(b);
    let diff = a.length ^ b.length;
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
        diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return diff === 0;
}

export function validarClaveSupervisor(clave, { password = "", usuario = "" } = {}) {
    if (clave.length < 10) return "La clave de supervisor debe tener mínimo 10 caracteres.";
    if (!/[A-Za-z]/.test(clave) || !/\d/.test(clave)) return "La clave de supervisor debe combinar letras y números.";
    if (password && clave === password) return "La clave de supervisor debe ser distinta a tu contraseña.";
    if (usuario && clave.toLowerCase().includes(usuario.toLowerCase())) return "La clave de supervisor no puede contener tu nombre de usuario.";
    return null;
}
