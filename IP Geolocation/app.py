import requests

def get_ip_location(ip_address=None):
    # Jika tidak ada IP, ambil IP publik perangkat ini
    if ip_address is None:
        ip_address = "ipinfo.io"
    
    # URL API ipinfo.io untuk mendapatkan lokasi berdasarkan IP
    url = f"https://ipinfo.io/{ip_address}/json"
    
    # Kirim permintaan GET
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        return data
    else:
        return {"error": "Tidak dapat mengambil data lokasi"}

# Coba dengan IP tertentu, atau biarkan kosong untuk IP publik
ip = input("Masukkan alamat IP (kosongkan untuk IP publik): ")
location = get_ip_location(ip if ip else None)

print(location)
s