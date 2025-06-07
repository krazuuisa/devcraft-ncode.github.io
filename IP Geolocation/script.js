function getGeolocation() {
  const ip = document.getElementById('ipAddress').value.trim();
  let url = 'https://ipwho.is/';
  if (ip) {
    url += ip;
  }
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        document.getElementById('ip').innerText = '-';
        document.getElementById('city').innerText = '-';
        document.getElementById('country').innerText = '-';
        document.getElementById('org').innerText = '-';
        document.getElementById('location').innerText = '-';
        document.getElementById('asn').innerText = '-';
        document.getElementById('isp').innerText = '-';
        document.getElementById('rdns').innerText = '-';
        document.getElementById('flag').innerHTML = '';
        document.getElementById('map').style.display = 'none';
        return;
      }
      document.getElementById('ip').innerText = data.ip || '-';
      let cityText = data.city || '-';
      document.getElementById('city').innerText = cityText;
      document.getElementById('country').innerText = data.country || '-';
      document.getElementById('org').innerText = data.connection && data.connection.org ? data.connection.org : '-';
      document.getElementById('location').innerText = (data.latitude && data.longitude) ? `${data.latitude}, ${data.longitude}` : '-';
      document.getElementById('asn').innerText = data.connection && data.connection.asn ? data.connection.asn : '-';
      document.getElementById('isp').innerText = data.connection && data.connection.isp ? data.connection.isp : '-';
      document.getElementById('rdns').innerText = data.connection && data.connection.domain ? data.connection.domain : '-';
      if (data.country_code && data.country_code.toLowerCase() !== 'id') {
        document.getElementById('flag').innerHTML = `<img class="flag" src='https://flagcdn.com/28x20/${data.country_code.toLowerCase()}.png' alt='${data.country}'>`;
      } else {
        document.getElementById('flag').innerHTML = '';
      }
      if (data.latitude && data.longitude && window.L) {
        showMap(data.latitude, data.longitude);
      } else {
        document.getElementById('map').style.display = 'none';
      }
    })
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
