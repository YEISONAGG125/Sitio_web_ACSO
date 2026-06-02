document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let usuarioIngresado = document.getElementById("usuario").value;
    let passwordIngresado = document.getElementById("password").value;

    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

    let usuarioValido = usuarios.find(u => 
        u.usuario === usuarioIngresado && u.password === passwordIngresado
    );

    if (usuarioValido) {

        alert("Bienvenido a A C S O ✅");
        localStorage.setItem("cargo", usuarioValido.cargo);
        let cargo = usuarioValido.cargo.toLowerCase();
        if (cargo === "empleado") {
            window.location.href = "../empleado/empleado.html";
        } 
        else if (cargo === "supervisor") {
            window.location.href = "../supervisor/supervisor.html";
        } 
        else if (cargo === "cliente") {
            window.location.href = "cliente.html";
        } 
        else {
            alert("Cargo no reconocido ❌");
        }

    } else {
        alert("Usuario o contraseña incorrectos ❌");
    }
});