// Función para actualizar la imagen sin parpadeos
function updateImage() {
    const img = document.getElementById('calendar-img');
    if (!img) return;

    const baseSrc = "https://yossix-calendar.web.app/Current.png";
    const newImg = new Image();
    const newSrc = baseSrc + '?t=' + new Date().getTime();
    
    newImg.onload = function() {
        img.src = newSrc;
        console.log('Calendario actualizado: ' + new Date().toLocaleTimeString());
    };
    
    newImg.onerror = function() {
        console.log('Error actualizando calendario, manteniendo el anterior.');
    };

    newImg.src = newSrc;
}

// Script básico para inicializar la extensión de Twitch
window.Twitch.ext.onAuthorized(function(auth) {
    console.log('Yossix Calendar Extension Authorized');
    updateImage(); // Actualizar nada más abrir por si acaso
});

// Refrescar la imagen cada 60 segundos
setInterval(updateImage, 60 * 1000);