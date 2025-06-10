document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('coordForm');
  if (!form) return; // Hindari error jika form tidak ditemukan

  let map = L.map('map').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  let marker = null;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const lat = parseFloat(document.getElementById('lat').value);
    const lon = parseFloat(document.getElementById('lon').value);
    map.setView([lat, lon], 12);
    if (marker) {
      marker.setLatLng([lat, lon]);
    } else {
      marker = L.marker([lat, lon]).addTo(map);
    }
    showLocationInfo(lat, lon);
  });

  function showLocationInfo(lat, lon) {
    const infoDiv = document.getElementById('locationInfo');
    infoDiv.textContent = 'Loading location info...';
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          infoDiv.innerHTML = `Lokasi: ${data.display_name}<br>
            <a href="https://maps.google.com/?q=${lat},${lon}" target="_blank" style="color:#39ff14;text-decoration:underline;">
              [Lihat di Google Maps]
            </a>`;
        } else {
          infoDiv.textContent = 'Lokasi tidak ditemukan.';
        }
      })
      .catch(() => {
        infoDiv.textContent = 'Gagal mengambil info lokasi.';
      });
  }
});
