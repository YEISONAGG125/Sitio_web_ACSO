document.getElementById("formRegistro").addEventListener("submit", function(e) {
    e.preventDefault();
    let nombre = document.getElementById("nombre").value;
    let cargo = document.getElementById("cargo").value;
    let correo = document.getElementById("correo").value;
    let usuario = document.getElementById("usuario").value;
    let password = document.getElementById("password").value;
    let nuevoUsuario = {
        nombre,
        cargo,
        correo,
        usuario,
        password
    };
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    usuarios.push(nuevoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    alert("Usuario registrado correctamente ✅");
    document.getElementById("formRegistro").reset();
});
