const secciones = document.querySelectorAll(".section");

function mostrar(id){

    secciones.forEach(seccion => {
        seccion.style.display = "none";
    });

    document.getElementById(id).style.display = "block";
}