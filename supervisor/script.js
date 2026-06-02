let cargo = localStorage.getItem("cargo");

if (cargo !== "supervisor") {
    alert("Acceso denegado");
    window.location.href = "../inicio de sistema/login.html";
}