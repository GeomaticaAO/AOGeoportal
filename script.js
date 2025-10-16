// Obtenemos el contenedor que agrupa el panel + botón
const sidebarContainer = document.getElementById('sidebarContainer');
const toggleBtn = document.getElementById('toggleBtn');

toggleBtn.addEventListener('click', () => {
  // Alterna la clase 'oculto' en el contenedor lateral
  sidebarContainer.classList.toggle('oculto');
  setTimeout(() => {
  }, 300);
});


