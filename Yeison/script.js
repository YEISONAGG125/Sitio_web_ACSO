function mostrar(id) {

    let secciones = document.querySelectorAll('.seccion');

    secciones.forEach(seccion => {
        seccion.style.display = 'none';
    });

    document.getElementById(id).style.display = 'block';
}