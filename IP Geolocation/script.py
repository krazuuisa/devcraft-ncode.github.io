function getGeolocation() {
  const ip = document.getElementById('ipAddress').value.trim();
  let url = 'https://ip-api.com/json/';
  if (ip) {
    url += ip;
  }
  fetch(url.replace('https://','http://')) // ip-api.com endpoint only supports http for free tier
    .then(response => response.json())
    .then(data => {
      document.getElementById('ip').innerText = data.query || '-';
      // Gabungkan city dan district jika ada (contoh: JAKARTA, BARU ANCOL)
      let cityText = data.city || '-';
      if (data.district && data.district !== data.city) {
        cityText = `${data.city}`;
        document.getElementById('city').innerText = cityText;
        document.getElementById('city').innerText += `, ${data.district}`;
      } else {
        document.getElementById('city').innerText = cityText;
      }
      document.getElementById('country').innerText = data.country || '-';
      // Info akurasi lokasi
      if (data.status === 'success' && (!data.city || data.city === '-' || cityText.toLowerCase().includes('jakarta') || (data.district && data.district.toLowerCase().includes('ancol')))) {
        document.getElementById('city').innerText += ' (Lokasi IP publik bisa tidak akurat)';
      }
      document.getElementById('org').innerText = data.org || data.as || '-';
      document.getElementById('location').innerText = (data.lat && data.lon) ? `${data.lat}, ${data.lon}` : '-';
      document.getElementById('asn').innerText = data.as || '-';
      document.getElementById('isp').innerText = data.isp || '-';
      document.getElementById('rdns').innerText = '-'; // ip-api.com free tier does not provide reverse DNS
      // Flag
       if (data.countryCode && data.countryCode.toLowerCase() !== 'id') {
        document.getElementById('flag').innerHTML = `<img class="flag" src='https://flagcdn.com/28x20/${data.countryCode.toLowerCase()}.png' alt='${data.country}'>`;
      } else {
        document.getElementById('flag').innerHTML = '';
      }
      // Map
      if (data.lat && data.lon && window.L) {
        showMap(data.lat, data.lon);
      } else {
        document.getElementById('map').style.display = 'none';
      }
    })
    // Hilangkan alert error, cukup log di console
    .catch(error => {
      console.error(error);
    });
}

function showMap(lat, lon) {
    document.getElementById('map').style.display = 'block';
    if (window._leafletMap) {
        window._leafletMap.setView([lat, lon], 10);
        if (window._leafletMarker) {
            window._leafletMarker.setLatLng([lat, lon]);
        } else {
            window._leafletMarker = L.marker([lat, lon]).addTo(window._leafletMap);
        }
    } else {
        window._leafletMap = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(window._leafletMap);
        window._leafletMarker = L.marker([lat, lon]).addTo(window._leafletMap);
    }
}
