# ANPS V1.0 — CODE BY NCODE

Android Network Privacy System for Termux (non-root).

## Install
```bash
pkg install python git
git clone YOUR_REPOSITORY_URL ANPS
cd ANPS
bash install.sh
./run.sh
```
If you downloaded the project ZIP, extract it, enter its folder, then run `bash install.sh`.

## Scope & limitations
This CLI provides basic connectivity/IP diagnostics. It does NOT create a VPN, set Android Private DNS, change Wi-Fi MAC, capture packets, or guarantee anonymity. Use a trusted VPN app and Android's Always-on VPN / Block connections without VPN settings where available. Configure randomized MAC in Android Wi-Fi network settings.

IP checks contact ipify. Internet check contacts Google connectivity endpoint. Use only networks you are authorized to use.

**CODE BY NCODE**
