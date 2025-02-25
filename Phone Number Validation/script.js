const apiKey = '5d5fca4dec06041d4fbf553edc9b2d1d'; // Your API key

const form = document.getElementById('phone-form');
const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone-number');
const resultDiv = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault(); 

  const userName = nameInput.value.trim();
  const phoneNumber = phoneInput.value.trim();

  if (!userName || !phoneNumber) {
    resultDiv.textContent = 'Please enter both your name and a valid phone number!';
    return;
  }

  resultDiv.textContent = 'Validating...';

  try {
    const url = `http://apilayer.net/api/validate?access_key=${apiKey}&number=${phoneNumber}`;

    const response = await fetch(url);
    const data = await response.json();

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
