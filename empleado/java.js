document.addEventListener("DOMContentLoaded", function () {

    const imagen = document.getElementById("imagen");
    const preview = document.getElementById("preview");

    // Cargar si ya existe
    const fotoGuardada = localStorage.getItem("fotoPerfil");
    if (fotoGuardada) {
        preview.src = fotoGuardada;
    }

    imagen.addEventListener("change", function () {

        const archivo = this.files[0];

        if (archivo) {
            const lector = new FileReader();

            lector.onload = function (e) {
                const foto = e.target.result;

                preview.src = foto;

                //  GUARDAR 
                localStorage.setItem("fotoPerfil", foto);
            };

            lector.readAsDataURL(archivo);
        }
    });

});


document.querySelector("form").addEventListener("submit", function(e){
    e.preventDefault();

    alert("Perfil actualizado correctamente");
});
