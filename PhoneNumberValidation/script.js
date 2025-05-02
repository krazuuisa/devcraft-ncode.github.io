const apiKey = '5d5fca4dec06041d4fbf553edc9b2d1d'; // Your API key

// DOM elements
const form = document.getElementById('phone-form');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone-number');
const resultDiv = document.getElementById('result');

// Event listener untuk form submission
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // Menghentikan reload halaman setelah submit

  const userName = nameInput.value.trim();
  let phoneNumber = phoneInput.value.trim();

  // Validasi input nama dan nomor telepon
  if (!userName || !phoneNumber) {
    resultDiv.textContent = 'Please enter both your name and a valid phone number!';
    return;
  }

  // Menampilkan loading
  resultDiv.textContent = 'Validating...';

  // Format nomor telepon Indonesia
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '62' + phoneNumber.slice(1);
  }

  try {
    // URL API untuk validasi nomor telepon
    const url = `http://apilayer.net/api/validate?access_key=${apiKey}&number=${phoneNumber}&country_code=&format=1`;

    // Panggilan API menggunakan fetch
    const response = await fetch(url);
    const data = await response.json();

    // Memeriksa hasil validasi
    if (data.valid) {
      const location = data.location || 'Unknown location';
      const city = location.includes(",") ? location.split(",")[0] : 'Unknown city'; // Extract city from location

      resultDiv.innerHTML = `
        <strong>Hello, ${userName}!</strong><br>
        <strong>Valid Number!</strong><br>
        Country: ${data.country_name}<br>
        City: ${city}<br>  <!-- Menampilkan kota -->
        Location: ${location}<br>
        Carrier: ${data.carrier}<br>
        Country Code: ${data.country_code}<br>
        International Format: ${data.international_format}
      `;
    } else {
      resultDiv.innerHTML = `
        <strong>Hello, ${userName}!</strong><br>
        Invalid phone number!
      `;
    }
  } catch (error) {
    resultDiv.textContent = 'An error occurred. Please try again.';
    console.error(error);
  }
});
