const suspiciousPatterns = [
  /(<script.*?>[\s\S]*?<\/script>)/gi,
  /(onerror\s*=\s*['"]?.+?['"]?)/gi,
  /(onload\s*=\s*['"]?.+?['"]?)/gi,
  /(eval\s*\()/gi,
  /(alert\s*\()/gi,
  /(document\.cookie)/gi,
  /(base64,[a-zA-Z0-9\/+=]+)/gi,
  /(\bselect\b.+?\bfrom\b)/gi,
  /(\bdrop\b.+?\btable\b)/gi,
  /(\bunion\b.+?\bselect\b)/gi,
  /(\bexec\b)/gi,
  /(\bscript\b)/gi,
  /(\biframe\b)/gi,
  /(\bjavascript:)/gi,
  /(\bwindow\.location\b)/gi,
  /(\bdocument\.write\b)/gi,
  /(\balert\b)/gi,
  /(\bprompt\b)/gi,
  /(\bconfirm\b)/gi,
];

function updateResult() {
  const input = document.getElementById("inputText").value;
  let count = 0;
  let highlighted = input;

  suspiciousPatterns.forEach((regex) => {
    highlighted = highlighted.replace(regex, (match) => {
      count++;
      return `<span class="highlight" title="Suspicious pattern detected: ${match}">${match}</span>`;
    });
  });

  document.getElementById("result").innerHTML = input
    ? highlighted
    : "<i>No input provided.</i>";
  document.getElementById("count").textContent = input
    ? `🧬 Suspicious matches found: ${count}`
    : "";
}

document.getElementById("highlightBtn").addEventListener("click", updateResult);

document.getElementById("clearBtn").addEventListener("click", () => {
  document.getElementById("inputText").value = "";
  document.getElementById("result").innerHTML = "";
  document.getElementById("count").textContent = "";
});

document.getElementById("downloadTxtBtn").addEventListener("click", () => {
  const text = document.getElementById("result").innerText;
  if (!text) {
    alert("Nothing to export!");
    return;
  }
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "suspicious_output.txt";
  link.click();
});
