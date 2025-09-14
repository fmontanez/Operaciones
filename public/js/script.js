window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    const content = document.getElementById('content');

    setTimeout(() => {
        loader.style.display = 'none';
        content.classList.remove('hidden');
    }, 2000); // 2 segundos de delay para la animación
});
