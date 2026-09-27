
document.addEventListener("DOMContentLoaded", () => {

    inicializarAyuda();

});


function inicializarAyuda() {

    const botonWhatsApp =
        document.querySelector(".btn-whatsapp");

    if (botonWhatsApp) {

        botonWhatsApp.addEventListener(
            "click",
            () => {

                console.log(
                    "El usuario ha seleccionado contacto por WhatsApp."
                );

            }
        );

    }


    agregarAnimaciones();

}


/* ================= ANIMACIONES ================= */

function agregarAnimaciones() {

    const tarjetas =
        document.querySelectorAll(".ayuda-card");

    tarjetas.forEach((tarjeta, indice) => {

        tarjeta.style.opacity = "0";

        tarjeta.style.transform =
            "translateY(20px)";


        setTimeout(() => {

            tarjeta.style.transition =
                "opacity 0.5s ease, transform 0.5s ease";

            tarjeta.style.opacity = "1";

            tarjeta.style.transform =
                "translateY(0)";

        }, 120 * indice);

    });

}

