const secciones = document.querySelectorAll(".section");

function mostrar(id){

    secciones.forEach(seccion => {
        seccion.style.display = "none";
    });

    document.getElementById(id).style.display = "block";
}
const imagenes = [
    "imagen1.png",
    "imagen2.png",
    "imagen3.png",
    "imagen4.png"
];

let indice = 0;

setInterval(() => {

    indice++;

    if(indice >= imagenes.length){
        indice = 0;
    }

    document.getElementById("slider").src = imagenes[indice];

}, 3000);