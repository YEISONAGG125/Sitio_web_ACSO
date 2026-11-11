// Íconos SVG para los campos de las páginas de acceso (login, registro y recuperar contraseña).
(function () {
    "use strict";
    var P = {
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
        mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
        lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
        key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
        shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
        job: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>'
    };
    function cual(i) {
        var k = ((i.id || "") + " " + (i.name || "") + " " + (i.type || "")).toLowerCase();
        if (/cargo/.test(k)) return "job";
        if (/codigo|code/.test(k)) return "key";
        if (/clave|sup/.test(k)) return "shield";
        if (/pass|contra/.test(k)) return "lock";
        if (/correo|mail|usuario/.test(k)) return "mail";
        if (/nombre|name/.test(k)) return "user";
        return "user";
    }
    var css = document.createElement("style");
    css.textContent = ".input-icon svg{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}";
    document.head.appendChild(css);
    function poner() {
        document.querySelectorAll(".input-wrapper").forEach(function (w) {
            var i = w.querySelector("input,select"); if (!i) return;
            var s = w.querySelector(".input-icon");
            if (s && s.querySelector("svg")) return;
            if (!s) { s = document.createElement("span"); s.className = "input-icon"; s.setAttribute("aria-hidden", "true"); w.insertBefore(s, w.firstChild); }
            s.innerHTML = '<svg viewBox="0 0 24 24">' + P[cual(i)] + "</svg>";
        });
    }
    poner();
    new MutationObserver(poner).observe(document.body, { childList: true, subtree: true });
})();
