function mostrar(seccion){

    let contenidos = document.querySelectorAll('.contenido');

    contenidos.forEach(function(div){
        div.classList.remove('activo');
    });

    document.getElementById(seccion).classList.add('activo');
}


