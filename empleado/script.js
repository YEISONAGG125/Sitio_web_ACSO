let cargo = localStorage.getItem("cargo");

if (cargo !== "empleado") {
    alert("Acceso denegado");
    window.location.href = "../inicio de sistema/login.html";
}
function mostrar(seccion, elemento) {

    let contenidos = document.querySelectorAll('.contenido');
    contenidos.forEach(c => c.classList.remove('active'));

    document.getElementById(seccion).classList.add('active');

    let tabs = document.querySelectorAll('.tab');
    tabs.forEach(t => t.classList.remove('active'));

    elemento.classList.add('active');
}


document.getElementById("formIncapacidad").addEventListener("submit", function(e){
    e.preventDefault();

    let tipo = document.getElementById("tipo").value;
    let inicio = document.getElementById("inicio").value;
    let fin = document.getElementById("fin").value;
    let descripcion = document.getElementById("descripcion").value;

    let incapacidades = JSON.parse(localStorage.getItem("incapacidades")) || [];

    incapacidades.push({
        tipo: tipo,
        inicio: inicio,
        fin: fin,
        descripcion: descripcion
    });

    localStorage.setItem("incapacidades", JSON.stringify(incapacidades));
document.getElementById("formIncapacidad").reset();

    mostrarIncapacidades();
});

function mostrarIncapacidades(){
    let lista = document.getElementById("listaIncapacidades");
    lista.innerHTML = "";

    let incapacidades = JSON.parse(localStorage.getItem("incapacidades")) || [];

    incapacidades.forEach(i => {
        let li = document.createElement("li");
        li.textContent = i.tipo + " | " + i.inicio + " - " + i.fin + " | " + i.descripcion;
        lista.appendChild(li);
    });
}

window.onload = function(){
    mostrarIncapacidades();
}
