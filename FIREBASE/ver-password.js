// Agrega un botón "Mostrar / Ocultar" a cada campo de contraseña que aún no lo tenga.
(function () {
    "use strict";
    var css = document.createElement("style");
    css.textContent = ".ver-pass{margin:0 0 0 8px;padding:2px 6px;border:0;background:none;color:inherit;font:600 13px/1.2 inherit;text-decoration:underline;cursor:pointer;white-space:nowrap}";
    document.head.appendChild(css);
    function poner(i) {
        if (i.dataset.ver || (i.parentElement && i.parentElement.querySelector("button"))) return;
        i.dataset.ver = "1";
        var b = document.createElement("button");
        b.type = "button"; b.className = "ver-pass"; b.textContent = "Mostrar"; b.setAttribute("aria-label", "Mostrar contraseña");
        b.addEventListener("click", function () {
            var o = i.type === "password";
            i.type = o ? "text" : "password";
            b.textContent = o ? "Ocultar" : "Mostrar";
            b.setAttribute("aria-label", (o ? "Ocultar" : "Mostrar") + " contraseña");
        });
        i.parentNode.insertBefore(b, i.nextSibling);
    }
    function barrer() { document.querySelectorAll('input[type="password"]').forEach(poner); }
    barrer();
    new MutationObserver(barrer).observe(document.body, { childList: true, subtree: true });
})();
