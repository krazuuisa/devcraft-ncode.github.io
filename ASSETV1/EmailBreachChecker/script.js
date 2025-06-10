document.getElementById("breachForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const results = document.getElementById("results");
  
  if (!email) return;

  // Add Timestamp
  const timestamp = new Date().toLocaleString();
  results.innerHTML = `<p><strong>Search Timestamp:</strong> ${timestamp}</p>` + results.innerHTML;

  results.innerHTML = "[+] Generating breach search links...\n";

  const dorks = [
    `site:pastebin.com "${email}"`,
    `site:github.com "${email}"`,
    `"${email}" filetype:txt`,
    `"${email}" intext:password`,
    `"${email}" "leaked password"`
  ];

  const breachLinks = [
    {
      name: 'Have I Been Pwned',
      url: `https://haveibeenpwned.com/unifiedsearch/${email}`
    },
    {
      name: 'DeHashed',
      url: `https://www.dehashed.com/search?query=${email}`
    },
    {
      name: 'LeakCheck',
      url: `https://leakcheck.io/search?query=${email}`
    },
    {
      name: 'SnusBase',
      url: `https://snusbase.com/search?query=${email}`
    }
  ];

  const additionalLinks = [
    {
      name: 'WeLeakInfo',
      url: `https://weleakinfo.to/search?query=${email}`
    },
    {
      name: 'IntelX',
      url: `https://intelx.io/?s=${email}`
    },
    {
      name: 'Scylla',
      url: `https://scylla.sh/search?q=${email}`
    },
    {
      name: 'GhostProject',
      url: `https://ghostproject.fr/search.php?search=${email}`
    },
    {
      name: 'BreachDirectory',
      url: `https://breachdirectory.org/?query=${email}`
    },
    {
      name: 'Leak-Lookup',
      url: `https://leak-lookup.com/search?query=${email}`
    },
    {
      name: 'Hacked-Emails',
      url: `https://hacked-emails.com/?q=${email}`
    },
    {
      name: 'EmailRep',
      url: `https://emailrep.io/${email}`
    },
    {
      name: 'Hunter.io',
      url: `https://hunter.io/email-finder/${email}`
    }
  ];

  results.innerHTML += '<h2>Comprehensive Breach Search Links:</h2><ul>';
  [...breachLinks, ...additionalLinks].forEach(link => {
    results.innerHTML += `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`;
  });
  results.innerHTML += '</ul>';

  results.innerHTML += '<h2>Google Dork Queries:</h2><ul>';
  dorks.forEach((dork, index) => {
    const link = `https://www.google.com/search?q=${encodeURIComponent(dork)}`;
    results.innerHTML += `<li>[${index + 1}] <a href="${link}" target="_blank">${dork}</a> <button onclick="copyToClipboard('${dork}')">Copy Dork</button></li>`;
  });
  results.innerHTML += '</ul>';

  // Add Custom Search Engine Toggle
  const searchEngines = {
    Google: 'https://www.google.com/search?q=',
    Bing: 'https://www.bing.com/search?q=',
    DuckDuckGo: 'https://duckduckgo.com/?q='
  };
  let selectedEngine = 'Google';
  results.innerHTML += '<label for="searchEngine">Select Search Engine:</label>';
  results.innerHTML += '<select id="searchEngine">' +
    Object.keys(searchEngines).map(engine => `<option value="${engine}">${engine}</option>`).join('') +
    '</select>';
  document.getElementById('searchEngine').addEventListener('change', function() {
    selectedEngine = this.value;
  });

  // Auto Dork Generator Based on Keywords
  const keywordInput = document.createElement('input');
  keywordInput.placeholder = 'Enter keywords for dork generation';
  keywordInput.style.margin = '10px 0';
  results.appendChild(keywordInput);
  keywordInput.addEventListener('input', function() {
    const keywords = this.value.split(' ').filter(Boolean);
    const autoDorks = keywords.map(keyword => `"${keyword}" intext:password`);
    const preview = document.getElementById('preview') || document.createElement('div');
    preview.id = 'preview';
    preview.innerHTML = '<h3>Real-time Dork Preview:</h3><ul>' +
      autoDorks.map(dork => `<li>${dork}</li>`).join('') + '</ul>';
    results.appendChild(preview);
  });

  // Add Warning for Vulnerable Emails
  if (breachLinks.length > 0) {
    results.innerHTML += '<p style="color: red;"><strong>Warning:</strong> This email may be vulnerable based on breach data.</p>';
  }

  // Email Pattern Finder
  const emailPattern = email.replace(/@.+$/, '@*.*');
  results.innerHTML += `<p><strong>Email Pattern:</strong> ${emailPattern}</p>`;

  // Add Download Results functionality
  results.innerHTML += '<button onclick="downloadResults()">Download Results</button>';

  // Function to copy dork to clipboard
  window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Dork copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  // Function to download results
  window.downloadResults = function() {
    const blob = new Blob([results.innerText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'breach_results.txt';
    link.click();
  };
});

function addToHistory(email) {
  if (!email) return;
  let history = JSON.parse(localStorage.getItem('breachHistory') || '[]');
  // Hindari duplikat, email terbaru di atas
  history = history.filter(e => e !== email);
  history.unshift(email);
  if (history.length > 10) history = history.slice(0, 10); // Maksimal 10 riwayat
  localStorage.setItem('breachHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;
  const history = JSON.parse(localStorage.getItem('breachHistory') || '[]');
  if (history.length === 0) {
    historyList.innerHTML = '<li style="color:#888;font-style:italic;">No recent checks.</li>';
    return;
  }
  historyList.innerHTML = '';
  history.forEach(email => {
    const li = document.createElement('li');
    li.textContent = email;
    li.style.cursor = 'pointer';
    li.onclick = function() {
      document.getElementById('email').value = email;
    };
    historyList.appendChild(li);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderHistory();
  // Copy Result
  var copyBtn = document.getElementById('copyBtn');
  if (copyBtn) {
    copyBtn.onclick = function() {
      var results = document.getElementById('results');
      if (results && results.innerText.trim() !== '') {
        var temp = document.createElement('textarea');
        temp.value = results.innerText;
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
      var results = document.getElementById('results');
      if (results && results.innerText.trim() !== '') {
        var blob = new Blob([results.innerText], { type: 'text/plain' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'breach_result.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  }

  // Clear History
  var clearHistoryBtn = document.getElementById('clearHistoryBtn');
  if (clearHistoryBtn) {
    clearHistoryBtn.onclick = function() {
      var historyList = document.getElementById('historyList');
      if (historyList) {
        historyList.innerHTML = '<li style="color:#888;font-style:italic;">No recent checks.</li>';
      }
      if (window.localStorage) {
        localStorage.removeItem('breachHistory');
      }
      var preview = document.getElementById('preview');
      if (preview) {
        preview.remove();
      }
      this.innerText = 'Cleared!';
      setTimeout(() => { this.innerText = 'Clear History'; }, 1200);
    };
  }
  // Tambahkan ke riwayat setiap kali submit
  var breachForm = document.getElementById('breachForm');
  if (breachForm) {
    breachForm.addEventListener('submit', function(e) {
      const email = document.getElementById('email').value.trim();
      addToHistory(email);
    }, true);
  }
});
