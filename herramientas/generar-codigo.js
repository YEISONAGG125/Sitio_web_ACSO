
const crypto = require("crypto");
const readline = require("readline");

const ITERACIONES = 210000;

function generar(codigo) {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(codigo, salt, ITERACIONES, 32, "sha256");
    return {
        codigo_hash: hash.toString("base64"),
        codigo_salt: salt.toString("base64"),
        codigo_iter: ITERACIONES
    };
}

function pedir(pregunta) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(pregunta, (r) => { rl.close(); resolve(r); });
    });
}

(async () => {
    const codigo = process.argv[2] || await pedir("Escribe el código de autorización (mín. 12 caracteres): ");

    if (codigo.length < 12) {
        console.error("\n✖ El código debe tener mínimo 12 caracteres.");
        process.exit(1);
    }

    console.log("\nPega esto en Firebase -> Realtime Database -> config/seguridad:\n");
    console.log(JSON.stringify(generar(codigo), null, 2));
    console.log("\nGuarda el código en un lugar seguro. Si lo pierdes, genera uno nuevo y reemplaza el JSON.\n");
})();
