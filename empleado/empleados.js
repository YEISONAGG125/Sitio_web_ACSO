
document.addEventListener("DOMContentLoaded", function () {

    const fotoGuardada = localStorage.getItem("fotoPerfil");

    if (fotoGuardada) {
        document.getElementById("fotoEmpleado").src = fotoGuardada;
    }

});

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const toggle = document.getElementById('menuToggle');
toggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('show');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
});
document.querySelectorAll('.nav-link').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-link').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
  });
});