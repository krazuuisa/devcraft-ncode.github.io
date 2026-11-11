#!/data/data/com.termux/files/usr/bin/bash
set -e
echo "========================================"
echo " ANPS V1.0 • CODE BY NCODE"
echo " Termux Installer"
echo "========================================"
if [ ! -d "$PREFIX" ] || ! command -v pkg >/dev/null 2>&1; then
  echo "ERROR: Run this installer inside Termux."; exit 1
fi
pkg update -y
pkg install -y python
python -m pip install --upgrade pip
cd "$(dirname "$0")"
python -m pip install -r requirements.txt
chmod +x run.sh
echo
echo "Installation complete."
echo "Run: ./run.sh"
