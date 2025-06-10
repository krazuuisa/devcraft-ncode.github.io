function encryptMessage() {
    const message = document.getElementById("message").value;
    const key = document.getElementById("key").value;

    if (message === "" || key === "") {
        alert("Masukkan pesan dan kunci enkripsi!");
        return;
    }

    const encryptedMessage = CryptoJS.AES.encrypt(message, key).toString();
    
    document.getElementById("output").value = encryptedMessage;
}

function decryptMessage() {
    const encryptedMessage = document.getElementById("message").value;
    const key = document.getElementById("key").value;

    if (encryptedMessage === "" || key === "") {
        alert("Masukkan pesan yang dienkripsi dan kunci dekripsi!");
        return;
    }

    const decryptedMessageBytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decryptedMessage = decryptedMessageBytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedMessage) {
        alert("Kunci atau pesan yang dimasukkan salah!");
        return;
    }

    document.getElementById("output").value = decryptedMessage;
}
