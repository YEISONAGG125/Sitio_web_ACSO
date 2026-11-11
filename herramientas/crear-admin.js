
const crypto = require("crypto");
const readline = require("readline");
const IT = 210000;
const hash = (t) => { const s = crypto.randomBytes(16); return { h: crypto.pbkdf2Sync(t, s, IT, 32, "sha256").toString("base64"), s: s.toString("base64") }; };
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const p = (q) => new Promise((r) => rl.question(q, r));
(async () => {
    const nombre = await p("Nombre: "), correo = (await p("Correo: ")).toLowerCase(), usuario = await p("Usuario: ");
    const pass = await p("Contraseña (mín. 8): "), clave = await p("Clave de acceso de administrador (mín. 10, letras y números): ");
    rl.close();
    if (pass.length < 8 || clave.length < 10 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) { console.error("\nContraseña o clave demasiado débil."); process.exit(1); }
    const a = hash(pass), b = hash(clave);
    console.log("\n" + JSON.stringify({ nombre, correo, usuario, cargo: "administrador", online: false,
        password_hash: a.h, password_salt: a.s, password_iter: IT, clave_hash: b.h, clave_salt: b.s, clave_iter: IT }, null, 2) + "\n");
})();
