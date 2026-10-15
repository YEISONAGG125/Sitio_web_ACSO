document.addEventListener("DOMContentLoaded", () => {

    const elementos = document.querySelectorAll(
        ".contacto-header, .info-card, .contacto-panel"
    );

    elementos.forEach((elemento, index) => {

        elemento.style.opacity = "0";
        elemento.style.transform = "translateY(25px)";

        setTimeout(() => {

            elemento.style.transition =
                "opacity 0.7s ease, transform 0.7s ease";

            elemento.style.opacity = "1";
            elemento.style.transform = "translateY(0)";

        }, 100 + index * 120);

    });

});