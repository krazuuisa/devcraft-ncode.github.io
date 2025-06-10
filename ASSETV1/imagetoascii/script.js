const asciiChars = "@%#*+=-:. "; // Characters for ASCII art, from dark to light

document.getElementById('generateBtn').addEventListener('click', () => {
  const fileInput = document.getElementById('imageInput');
  const asciiOutput = document.getElementById('asciiOutput');

  if (!fileInput.files[0]) {
    alert('Please upload an image first!');
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.src = event.target.result;

    img.onload = function () {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize image to fit ASCII art dimensions
      const width = 100; // Fixed width for ASCII art
      const height = Math.floor((img.height / img.width) * width * 0.5); // Maintain aspect ratio
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height).data;
      let ascii = '';

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const brightness = (r + g + b) / 3; // Calculate brightness
        const charIndex = Math.floor((brightness / 255) * (asciiChars.length - 1));
        ascii += asciiChars[charIndex];

        if ((i / 4 + 1) % width === 0) {
          ascii += '\n'; // Add a new line at the end of each row
        }
      }

      asciiOutput.value = ascii; // Display ASCII art in the textarea
    };
  };

  reader.readAsDataURL(file);
});

document.getElementById('downloadBtn').addEventListener('click', () => {
  const asciiOutput = document.getElementById('asciiOutput').value;

  if (!asciiOutput) {
    alert('No ASCII art to download. Please generate ASCII art first!');
    return;
  }

  const blob = new Blob([asciiOutput], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'ascii_art.txt';
  link.click();
});

// Fullscreen functionality
document.getElementById('asciiOutput').addEventListener('dblclick', function () {
  this.classList.toggle('fullscreen');
});