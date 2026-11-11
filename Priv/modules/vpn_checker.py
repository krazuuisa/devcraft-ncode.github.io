import os
def vpn_status():
    # Android VPN state is not reliably exposed to ordinary Termux processes.
    try:
        names=os.listdir("/sys/class/net")
        if "tun0" in names or "wg0" in names:
            return "Tunnel interface detected (not proof system-wide routing)"
    except Exception: pass
    return "Cannot confirm VPN from Termux; verify Android VPN settings/app"
