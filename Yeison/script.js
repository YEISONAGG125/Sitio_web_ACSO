
// Menú móvil
const toggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
 
// Carrusel
const slides = document.querySelector('#carousel .slides');
const dots = document.querySelectorAll('#carousel .dot');
let idx = 0, timer;
function go(i) {
    idx = (i + dots.length) % dots.length;
    slides.style.transform = `translateX(-${idx * 100}%)`;
    dots.forEach((d, n) => d.classList.toggle('active', n === idx));
}
function auto() { clearInterval(timer); timer = setInterval(() => go(idx + 1), 5000); }
dots.forEach((d, n) => d.addEventListener('click', () => { go(n); auto(); }));
auto();
 