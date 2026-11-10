
import { crearHashClave, verificarHashClave, compararSeguro } from "./cripto.js";

export async function hashPassword(plana) {
    const h = await crearHashClave(plana);
    return { password_hash: h.hash, password_salt: h.salt, password_iter: h.iter, password: null };
}

export async function passwordCorrecta(usuario, plana) {
    if (usuario.password_hash) {
        return verificarHashClave(plana, { hash: usuario.password_hash, salt: usuario.password_salt, iter: usuario.password_iter });
    }
    return usuario.password != null && compararSeguro(usuario.password, plana);
}
