import socket, urllib.request
def network_info():
    data={"local_ip":None,"wifi_interface":"Not exposed"}
    try:
        s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM); s.connect(("1.1.1.1",80))
        data["local_ip"]=s.getsockname()[0]; s.close()
    except Exception: pass
    return data
def internet_check():
    try:
        urllib.request.urlopen("https://www.google.com/generate_204",timeout=4)
        return True
    except Exception: return False
