import socket
def dns_status():
    # Android Private DNS is system-level; Termux generally cannot read its exact setting.
    return "System setting not directly readable (check Android Settings → Private DNS)"
def dns_test():
    try:
        result=socket.getaddrinfo("example.com",443)
        return f"Resolution successful ({len(result)} records). This does NOT prove encrypted DNS or no leak."
    except Exception as e:
        return f"Resolution failed: {e}"
