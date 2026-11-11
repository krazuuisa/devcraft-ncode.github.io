import requests, socket
URLS={"ipv4":"https://api.ipify.org","ipv6":"https://api6.ipify.org"}
def get_ip_info():
    out={"ipv4":None,"ipv6":None}
    for k,u in URLS.items():
        try:
            r=requests.get(u,timeout=5); r.raise_for_status(); out[k]=r.text.strip()
        except Exception: pass
    return out
