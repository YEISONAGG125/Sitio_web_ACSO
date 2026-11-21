/* ACSO · Mejoras de accesibilidad y usabilidad (no depende de Firebase ni de la API) */
(function () {
  'use strict';
  var d = document;
  function ready(fn){ d.readyState === 'loading' ? d.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    /* 1. Landmark principal + enlace "Saltar al contenido" */
    var main = d.querySelector('main, [role=main]') ||
      d.querySelector('.login-panel, .perfil-container, .contenedor, .contenido, .content, .main-content') ||
      d.querySelector('section') || d.body;
    if (main.tagName !== 'MAIN' && !main.getAttribute('role')) main.setAttribute('role', 'main');
    if (!main.id) main.id = 'contenido-principal';
    main.setAttribute('tabindex', '-1');
    if (!d.querySelector('.skip-link')) {
      var a = d.createElement('a');
      a.className = 'skip-link'; a.href = '#' + main.id; a.textContent = 'Saltar al contenido principal';
      a.addEventListener('click', function(){ setTimeout(function(){ main.focus(); }, 0); });
      d.body.insertBefore(a, d.body.firstChild);
    }
    /* 2. Menús lateral/superior como navegación etiquetada */
    d.querySelectorAll('aside, .sidebar, .menu-lateral').forEach(function (n, i) {
      if (!n.querySelector('nav') && !n.getAttribute('role') && n.tagName !== 'NAV') {
        n.setAttribute('role', 'navigation'); n.setAttribute('aria-label', 'Menú principal' + (i ? ' ' + (i + 1) : ''));
      }
    });
    /* 3. Botones sin type no envían formularios por accidente */
    d.querySelectorAll('button:not([type])').forEach(function (b) { b.type = 'button'; });
    /* 4. Elementos con onclick que no son botones: teclado + rol */
    d.querySelectorAll('div[onclick], span[onclick], li[onclick], td[onclick], p[onclick]').forEach(function (el) {
      el.setAttribute('role', 'button'); el.tabIndex = 0;
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
    /* 5. Campos sin nombre accesible: usar el texto vecino o el placeholder */
    d.querySelectorAll('input, select, textarea').forEach(function (c) {
      if (/hidden|submit|button|reset/.test(c.type) || c.getAttribute('aria-label') || c.getAttribute('aria-labelledby')) return;
      if (c.labels && c.labels.length) return;
      var txt = c.title || c.placeholder;
      if (!txt) { var p = c.closest('label, .input-group, .campo, .form-group, div'); var l = p && p.querySelector('label, span, strong'); txt = l && l !== c ? l.textContent.trim() : ''; }
      if (txt) c.setAttribute('aria-label', txt);
    });
    /* 6. Autocompletado en campos habituales */
    var ac = { email: 'email', tel: 'tel' };
    d.querySelectorAll('input:not([autocomplete])').forEach(function (c) { if (ac[c.type]) c.setAttribute('autocomplete', ac[c.type]); });
    /* 7. Tablas: encabezados con alcance y contenedor desplazable */
    d.querySelectorAll('th:not([scope])').forEach(function (th) { th.setAttribute('scope', 'col'); });
    d.querySelectorAll('table').forEach(function (t) {
      if (t.parentElement && !/tabla-responsive|table-wrap/.test(t.parentElement.className) && getComputedStyle(t.parentElement).overflowX === 'visible') {
        t.parentElement.setAttribute('data-scroll-hint', '');
      }
    });
    /* 8. Mensajes dinámicos anunciados por lectores de pantalla */
    d.querySelectorAll('.mensaje, .toast, .alerta, [id^=mensaje], [id^=toast]').forEach(function (m) {
      if (!m.getAttribute('role')) { m.setAttribute('role', 'status'); m.setAttribute('aria-live', 'polite'); m.setAttribute('aria-atomic', 'true'); }
    });
    new MutationObserver(function (muts) {
      muts.forEach(function (mu) { mu.addedNodes.forEach(function (n) {
        if (n.nodeType === 1 && /toast|alerta|aviso|notif/i.test(n.className || '') && !n.getAttribute('role')) {
          n.setAttribute('role', 'alert'); }
      }); });
    }).observe(d.body, { childList: true, subtree: true });
    /* 9. Diálogos/modales: Escape cierra y el foco queda atrapado */
    d.addEventListener('keydown', function (e) {
      var m = d.querySelector('.modal.activo, .modal.show, .modal.abierto, .modal[open], [role=dialog]:not([hidden])');
      if (!m || m.offsetParent === null) return;
      if (e.key === 'Escape') { var x = m.querySelector('[data-cerrar], .cerrar, .close, button[aria-label*=errar]'); if (x) x.click(); }
      if (e.key === 'Tab') {
        var f = m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return; var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    /* 10. Imágenes decorativas sin alt */
    d.querySelectorAll('img:not([alt])').forEach(function (i) { i.setAttribute('alt', ''); });
    /* 11. Avisar si se pierde la conexión */
    var off = d.createElement('div'); off.className = 'sr-only'; off.setAttribute('role', 'status'); d.body.appendChild(off);
    window.addEventListener('offline', function(){ off.textContent = 'Sin conexión a internet. Algunos datos pueden no actualizarse.'; });
    window.addEventListener('online', function(){ off.textContent = 'Conexión restablecida.'; });
  });
})();
