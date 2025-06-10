document.getElementById("dnsForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const domain = document.getElementById("domain").value.trim();
  const recordType = document.getElementById("recordType").value;
  const result = document.getElementById("result");

  if (!domain) {
    result.textContent = "Please enter a valid domain.";
    return;
  }

  result.textContent = "Fetching DNS records...";

  try {
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=${recordType}`);
    const data = await response.json();

    if (!data.Answer) {
      result.textContent = `No ${recordType} records found for ${domain}.`;
      return;
    }

    let output = `DNS Records for ${domain} (${recordType}):\n\n`;
    data.Answer.forEach(record => {
      output += `- ${record.data}\n`;
    });

    result.textContent = output;
  } catch (error) {
    result.textContent = "Error fetching DNS records.";
    console.error(error);
  }
});

function addToHistory(domain) {
  if (!domain) return;
  let history = JSON.parse(localStorage.getItem('dnsHistory') || '[]');
  history = history.filter(e => e !== domain);
  history.unshift(domain);
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem('dnsHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  const history = JSON.parse(localStorage.getItem('dnsHistory') || '[]');
  if (history.length === 0) {
    historyList.innerHTML = '<li style="color:#888;font-style:italic;">No recent checks.</li>';
    return;
  }
  historyList.innerHTML = '';
  history.forEach(domain => {
    const li = document.createElement('li');
    li.textContent = domain;
    li.style.cursor = 'pointer';
    li.onclick = function() {
      document.getElementById('domain').value = domain;
    };
    historyList.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderHistory();
  var dnsForm = document.getElementById('dnsForm');
  if (dnsForm) {
    dnsForm.addEventListener('submit', function(e) {
      const domain = document.getElementById('domain').value.trim();
      addToHistory(domain);
    }, true);
  }

  // Copy Result
  var copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.onclick = function() {
      var result = document.getElementById('result');
      if (result && result.innerText.trim() !== '') {
        var temp = document.createElement('textarea');
        temp.value = result.innerText;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        this.innerText = 'Copied!';
        setTimeout(() => { this.innerText = 'Copy Result'; }, 1200);
      }
    };
  }

  // Download TXT
  var downloadBtn = document.getElementById('downloadBtn');
  if (downloadBtn) {
    downloadBtn.onclick = function() {
      var result = document.getElementById('result');
      if (result && result.innerText.trim() !== '') {
        var blob = new Blob([result.innerText], { type: 'text/plain' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'dns_result.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  }
});
