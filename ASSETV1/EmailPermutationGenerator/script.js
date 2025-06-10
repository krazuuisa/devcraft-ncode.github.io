function generateEmails() {
  const first = document.getElementById('first').value.toLowerCase();
  const last = document.getElementById('last').value.toLowerCase();
  const domain = document.getElementById('domain').value.toLowerCase();

  const result = [
    `${first}@${domain}`,
    `${last}@${domain}`,
    `${first}.${last}@${domain}`,
    `${first}${last}@${domain}`,
    `${first}_${last}@${domain}`,
    `${first.charAt(0)}${last}@${domain}`,
    `${first}${last.charAt(0)}@${domain}`,
    `${last}${first}@${domain}`,
    `${last}.${first}@${domain}`,
    `${last}_${first}@${domain}`,
    `${first.charAt(0)}.${last}@${domain}`,
    `${last.charAt(0)}${first}@${domain}`,
    `${first}-${last}@${domain}`,
    `${last}-${first}@${domain}`
  ];

  document.getElementById('result').value = result.join('\n');
}
