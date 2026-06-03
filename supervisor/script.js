let cargo = localStorage.getItem("cargo");

if (cargo !== "supervisor") {
    alert("Acceso denegado");
    window.location.href = "../inicio de sistema/login.html";
}
function mostrar(id, elemento){

    document.querySelectorAll(".contenido").forEach(seccion=>{
        seccion.classList.remove("active");
    });

    document.querySelectorAll(".tab").forEach(tab=>{
        tab.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
    elemento.classList.add("active");
}

