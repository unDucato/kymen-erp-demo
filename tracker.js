import * as maplibregl from 'https://unpkg.com/maplibre-gl@6.12.0/dist/maplibre-gl.mjs';
(() => {
  "use strict";

  /* ============================================================
   * Live fleet tracker. ERP -> Dashboard.
   * Зависит от: maplibre-gl (index.html), window.Prefs (prefs.js),
   * tokens.env (DEV_MAPTILER_TOKEN).
   * ============================================================ */

  const P = window.Prefs || { t: (k) => k, locale: () => "en-GB", onChange() {} };
  const tr = (key, vars = {}) =>
    Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), P.t(key));

  // Ключ карты читаем прямо из tokens.env (лежит рядом с index.html). Нужен HTTP-сервер (Live Server и т.п.).
  // Читаем ключ из объекта, созданного скриптом gen-config.mjs
  let KEY = window.KTP_CONFIG?.maptilerKey || "";
  
  // Создаем мгновенно разрешающийся Promise, чтобы не ломать логику инициализации ниже
  const keyReady = Promise.resolve(); 
  const OFFLINE_AFTER_MS = 30000; // нет телеметрии дольше этого -> "Offline"
  const LOW_FUEL_PCT = 20;
  const TRAIL_POINTS = 40;
  const TICK_MS = 2000;           // как часто приходит телеметрия (демо)
  const DEMO_SPEEDUP = 12;        // ускорение движения в демо, чтобы перемещение было видно на карте

  const els = {
    map: document.getElementById("tracker-map"),
    list: document.getElementById("tracker-list"),
    legend: document.getElementById("tracker-legend"),
    note: document.getElementById("tracker-note"),
    live: document.getElementById("tracker-live"),
    fit: document.getElementById("tracker-fit"),
    panel: document.getElementById("live-tracker"),
  };
  if (!els.map) { console.warn("[tracker] #tracker-map not found"); return; }
  const hasMapLib = () => typeof maplibregl !== "undefined";

  /* ---------- справочник техники (статика) ---------- */
  const FLEET = {
    "KTP-118": { name: "Mitsubishi EDIA EM (Forklift)", icon: "fa-dolly" },
    "KTP-204": { name: "Yanmar V80 (Loader)", icon: "fa-truck" },
    "KTP-001": { name: "Combilift C4000", icon: "fa-truck-monster" },
    "KTP-042": { name: "Volvo L60H", icon: "fa-tractor" },
    "KTP-077": { name: "Manitou MT 1840 (Telehandler)", icon: "fa-truck-ramp-box" },
  };

  const STATES = ["moving", "idle", "parked", "offline"];
  const STATE_LABEL = { moving: "Moving", idle: "Idling", parked: "Parked", offline: "Offline" };
  const STATE_COLOR = { moving: "--accent", idle: "--orange", parked: "#8b93a1", offline: "--red-hover" };

  /* ============================================================
   * ИСТОЧНИК ТЕЛЕМЕТРИИ
   * Контракт: source.subscribe(fn) -> fn(frames[]), где frame:
   *   { id, lng, lat, heading, speedKmh, engineOn, fuelPct, engineHours, ts }
   * Статус (moving/idle/parked/offline) считается на клиенте из этих полей.
   * Чтобы подключить реальные данные, достаточно заменить createSimulatedSource().
   * ============================================================ */

  function createSimulatedSource() {
    const M_PER_DEG_LAT = 111320;
    const mPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

    const loop = (lng, lat, rM, n = 18) =>
      Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        return [lng + (Math.cos(a) * rM) / mPerDegLng(lat), lat + (Math.sin(a) * rM) / M_PER_DEG_LAT];
      });

    // Координаты приблизительные, только для демо. Заменить реальными данными.
    const units = [
      { id: "KTP-118", path: loop(26.8160, 60.5030, 140), closed: true, speed: 9, fuel: 62, hours: 480, mode: "work" },
      { id: "KTP-204", path: loop(26.8205, 60.5058, 230), closed: true, speed: 12, fuel: 48, hours: 120, mode: "work" },
      { id: "KTP-001", path: loop(26.9470, 60.4660, 160), closed: true, speed: 8, fuel: 14, hours: 3120, mode: "work" },
      { id: "KTP-042", path: [[26.7042, 60.8681]], closed: false, speed: 0, fuel: 71, hours: 7840, mode: "parked" },
      { id: "KTP-077", path: [[26.7042, 60.8681], [26.8160, 60.5030]], closed: false, speed: 55, fuel: 83, hours: 1960, mode: "haul" },
    ].map((u) => ({ ...u, seg: 0, segPos: 0, dir: 1, engineOn: u.mode !== "parked", moving: u.mode !== "parked", switchIn: 20 + Math.random() * 30, heading: 0 }));

    const listeners = [];
    let timer = null;

    const dist = (a, b) => {
      const lat = (a[1] + b[1]) / 2;
      return Math.hypot((b[0] - a[0]) * mPerDegLng(lat), (b[1] - a[1]) * M_PER_DEG_LAT);
    };

    function advance(u, dtSec) {
      if (!u.moving || u.path.length < 2) return;
      let remain = (u.speed / 3.6) * dtSec * DEMO_SPEEDUP;
      const n = u.path.length;
      while (remain > 0) {
        const a = u.path[u.seg];
        const nextIdx = u.closed ? (u.seg + u.dir + n) % n : u.seg + u.dir;
        const b = u.path[nextIdx];
        const len = dist(a, b) || 1e-6;
        const left = len - u.segPos;
        if (remain < left) { u.segPos += remain; remain = 0; }
        else {
          remain -= left; u.segPos = 0; u.seg = nextIdx;
          if (!u.closed && (u.seg === n - 1 || u.seg === 0)) u.dir *= -1; // ping-pong
        }
      }
      const a = u.path[u.seg];
      const nextIdx = u.closed ? (u.seg + u.dir + n) % n : u.seg + u.dir;
      const b = u.path[nextIdx];
      const f = Math.min(1, u.segPos / (dist(a, b) || 1e-6));
      u.pos = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      u.heading = (Math.atan2((b[0] - a[0]) * mPerDegLng(a[1]), (b[1] - a[1]) * M_PER_DEG_LAT) * 180) / Math.PI;
    }

    units.forEach((u) => { u.pos = u.path[0]; });

    function tick() {
      const dt = TICK_MS / 1000;
      const now = Date.now();
      const frames = [];
      units.forEach((u) => {
        // работающие на площадке машины периодически останавливаются на холостом ходу
        if (u.mode === "work") {
          u.switchIn -= dt;
          if (u.switchIn <= 0) { u.moving = !u.moving; u.switchIn = 15 + Math.random() * 35; }
        }
        advance(u, dt);
        if (u.engineOn) {
          u.hours += (dt * DEMO_SPEEDUP) / 3600;
          u.fuel -= (u.moving ? 0.012 : 0.004) * DEMO_SPEEDUP * 0.5;
          if (u.fuel <= 3) u.fuel = 90; // демо: "дозаправка"
        }
        frames.push({
          id: u.id, lng: u.pos[0], lat: u.pos[1], heading: u.heading,
          speedKmh: u.moving ? u.speed + (Math.random() - 0.5) * 2 : 0,
          engineOn: u.engineOn, fuelPct: u.fuel, engineHours: u.hours, ts: now,
        });
      });
      listeners.forEach((fn) => fn(frames));
    }

    return {
      subscribe(fn) { listeners.push(fn); },
      start() { if (!timer) { tick(); timer = setInterval(tick, TICK_MS); } },
      stop() { clearInterval(timer); timer = null; },
    };
  }

  /* Пример реального источника (WebSocket), для справки:
   *
   * function createWebSocketSource(url) {
   *   const listeners = []; let ws, retry = 1000;
   *   const open = () => {
   *     ws = new WebSocket(url);
   *     ws.onmessage = (e) => { const frames = [].concat(JSON.parse(e.data)); listeners.forEach((fn) => fn(frames)); };
   *     ws.onclose = () => setTimeout(open, (retry = Math.min(retry * 2, 30000)));
   *     ws.onopen = () => (retry = 1000);
   *   };
   *   return { subscribe: (fn) => listeners.push(fn), start: open, stop: () => ws && ws.close() };
   * }
   */

  /* ---------- состояние ---------- */
  const source = createSimulatedSource();
  const units = new Map(); // id -> { meta, frame, from, to, t0, marker, trail[] , state }
  let map = null;
  let mapReady = false;
  let selectedId = null;
  let popup = null;
  let visible = false;
  let styleKey = "";
  let didInitialFit = false;
  let rafId = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const isDark = () => document.documentElement.dataset.theme !== "light";

  function stateOf(frame) {
    if (Date.now() - frame.ts > OFFLINE_AFTER_MS) return "offline";
    if (!frame.engineOn) return "parked";
    return frame.speedKmh > 1 ? "moving" : "idle";
  }

  function ago(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 5) return tr("just now");
    if (s < 60) return tr("{n} s ago", { n: s });
    return tr("{n} min ago", { n: Math.round(s / 60) });
  }

  /* ---------- карта ---------- */
  function styleUrl() {
    if (!KEY) {
      // Запасная подложка без ключа (растровые тайлы OSM, только для dev)
      return {
        version: 8,
        sources: { osm: { type: "raster", tileSize: 256, maxzoom: 19, tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"], attribution: "© OpenStreetMap contributors" } },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      };
    }
    // const name = isDark() ? "dataviz-dark" : "dataviz-light";
    const name = isDark() ? "streets-v4-dark" : "streets-v4";
    return `https://api.maptiler.com/maps/${name}/style.json?key=${encodeURIComponent(KEY)}`;
  }

  function addTrailLayers() {
    if (!map.getSource("trails")) {
      map.addSource("trails", { type: "geojson", data: trailsGeoJSON() });
    }
    if (!map.getLayer("trails-line")) {
      map.addLayer({
        id: "trails-line", type: "line", source: "trails",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": ["get", "color"], "line-width": 3, "line-opacity": 0.65 },
      });
    }
  }

  function trailsGeoJSON() {
    return {
      type: "FeatureCollection",
      features: [...units.values()]
        .filter((u) => u.trail.length > 1)
        .map((u) => ({
          type: "Feature",
          properties: { id: u.meta.id, color: cssVar(STATE_COLOR[u.state]) || STATE_COLOR[u.state] },
          geometry: { type: "LineString", coordinates: u.trail },
        })),
    };
  }

  function initMap() {
    if (map) return;
    if (!hasMapLib()) return;

    // Гарантируем, что контейнер не схлопнется
    els.map.style.setProperty("position", "absolute", "important");
    els.map.style.setProperty("height", "100%", "important");
    els.map.style.setProperty("width", "100%", "important");

    try {
      map = new maplibregl.Map({
        container: els.map,
        style: styleUrl(),
        center: [26.83, 60.68],
        zoom: 8.5,
        attributionControl: { compact: true },
      });
    } catch (err) {
      showNote([tr("Map failed to load")]);
      return;
    }

    styleKey = `${isDark()}`;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      mapReady = true;
      map.resize();
      addTrailLayers();
      syncMarkers();
      fitAll(false);
    });

    map.on("style.load", () => {
      if (mapReady) addTrailLayers();
    });

    map.on("click", () => selectUnit(null));
  }

  function showNote(lines) {
    els.note.innerHTML = lines.map((l) => `<span>${esc(l)}</span>`).join("");
    els.note.hidden = !lines.length;
  }

  /* ---------- маркеры ---------- */
  function createMarker(u) {
    const el = document.createElement("div");
    el.className = `unit-marker st-${u.state}`;
    el.innerHTML = `<div class="unit-pin"><i class="fa-solid ${esc(u.meta.icon)}"></i></div>`;
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", u.meta.name);
    el.tabIndex = 0;
    el.addEventListener("click", (e) => { e.stopPropagation(); selectUnit(u.meta.id, { fly: false }); });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectUnit(u.meta.id, { fly: false }); } });
    return new maplibregl.Marker({ element: el }).setLngLat([u.frame.lng, u.frame.lat]).addTo(map);
  }

  function syncMarkers() {
    if (!mapReady) return;
    units.forEach((u) => { if (!u.marker) u.marker = createMarker(u); });
  }

  function paintMarker(u) {
    if (!u.marker) return;
    const el = u.marker.getElement();
    STATES.forEach((s) => el.classList.toggle(`st-${s}`, s === u.state));
    el.classList.toggle("is-selected", u.meta.id === selectedId);
  }

  /* плавная интерполяция позиции между кадрами телеметрии */
  function animate(now) {
    rafId = 0;
    if (!visible || document.hidden) return;
    units.forEach((u) => {
      if (!u.marker || !u.to) return;
      const k = Math.min(1, (now - u.t0) / TICK_MS);
      const lng = u.from[0] + (u.to[0] - u.from[0]) * k;
      const lat = u.from[1] + (u.to[1] - u.from[1]) * k;
      u.marker.setLngLat([lng, lat]);
    });
    rafId = requestAnimationFrame(animate);
  }
  function startAnim() { if (!rafId && visible) rafId = requestAnimationFrame(animate); }

  /* ---------- обработка кадров телеметрии ---------- */
  function onFrames(frames) {
    const now = performance.now();
    frames.forEach((f) => {
      const meta = { id: f.id, ...(FLEET[f.id] || { name: f.id, icon: "fa-truck" }) };
      let u = units.get(f.id);
      if (!u) {
        u = { meta, frame: f, from: [f.lng, f.lat], to: [f.lng, f.lat], t0: now, marker: null, trail: [], state: stateOf(f) };
        units.set(f.id, u);
      } else {
        u.from = u.to ? [...u.to] : [f.lng, f.lat];
        u.to = [f.lng, f.lat];
        u.t0 = now;
        u.frame = f;
        u.state = stateOf(f);
      }
      if (f.speedKmh > 1) {
        u.trail.push([f.lng, f.lat]);
        if (u.trail.length > TRAIL_POINTS) u.trail.shift();
      }
    });
    refresh();
  }

  function refresh() {
    syncMarkers();
    units.forEach(paintMarker);
    renderList();
    renderLegend();
    if (mapReady) {
      try { const src = map.getSource("trails"); if (src) src.setData(trailsGeoJSON()); } catch (e) { /* стиль ещё перезагружается */ }
    }
    updatePopup();
    if (!didInitialFit && mapReady && units.size) { didInitialFit = true; fitAll(false); }
    els.live.classList.toggle("is-offline", ![...units.values()].some((u) => u.state !== "offline"));
  }

  /* ---------- список и легенда ---------- */
  function renderList() {
    const rows = [...units.values()].sort((a, b) => a.meta.id.localeCompare(b.meta.id));
    els.list.innerHTML = rows
      .map((u) => {
        const f = u.frame;
        const low = f.fuelPct < LOW_FUEL_PCT;
        return `
        <li>
          <button type="button" class="unit-row st-${u.state}${u.meta.id === selectedId ? " is-selected" : ""}" data-unit="${esc(u.meta.id)}">
            <span class="unit-ico"><i class="fa-solid ${esc(u.meta.icon)}"></i></span>
            <span class="unit-main">
              <b>${esc(u.meta.name)}</b>
              <small>${esc(u.meta.id)} · <span class="unit-state">${esc(tr(STATE_LABEL[u.state]))}</span></small>
            </span>
            <span class="unit-side">
              <strong>${Math.round(f.speedKmh)} ${esc(tr("km/h"))}</strong>
              <span class="${low ? "warn-fuel" : ""}">${low ? '<i class="fa-solid fa-gas-pump"></i> ' : ""}${Math.round(f.fuelPct)}%</span>
            </span>
          </button>
        </li>`;
      })
      .join("");
  }

  function renderLegend() {
    const counts = Object.fromEntries(STATES.map((s) => [s, 0]));
    units.forEach((u) => counts[u.state]++);
    els.legend.innerHTML = STATES.filter((s) => counts[s] > 0)
      .map((s) => `<span class="legend-item st-${s}"><i></i>${esc(tr(STATE_LABEL[s]))} <b>${counts[s]}</b></span>`)
      .join("");
  }

  /* ---------- выбор техники и попап ---------- */
  function popupHtml(u) {
    const f = u.frame;
    return `
      <p class="pop-title">${esc(u.meta.name)}</p>
      <p class="pop-sub">${esc(u.meta.id)} · <span class="unit-state st-${u.state}">${esc(tr(STATE_LABEL[u.state]))}</span></p>
      <dl class="pop-grid">
        <dt>${esc(tr("Speed"))}</dt><dd>${Math.round(f.speedKmh)} ${esc(tr("km/h"))}</dd>
        <dt>${esc(tr("Fuel"))}</dt><dd class="${f.fuelPct < LOW_FUEL_PCT ? "warn-fuel" : ""}">${Math.round(f.fuelPct)}%${f.fuelPct < LOW_FUEL_PCT ? " · " + esc(tr("Low fuel")) : ""}</dd>
        <dt>${esc(tr("Engine hours"))}</dt><dd>${f.engineHours.toFixed(1)} ${esc(tr("h"))}</dd>
        <dt>${esc(tr("Last update"))}</dt><dd>${esc(ago(f.ts))}</dd>
      </dl>`;
  }

  function updatePopup() {
    if (!popup || !selectedId) return;
    const u = units.get(selectedId);
    if (!u) return;
    popup.setLngLat(u.to || [u.frame.lng, u.frame.lat]);
    popup.setHTML(popupHtml(u));
  }

  function selectUnit(id, { fly = true } = {}) {
    selectedId = id;
    if (popup) { const old = popup; popup = null; old.remove(); }
    units.forEach(paintMarker);
    renderList();
    if (!id || !mapReady) return;
    const u = units.get(id);
    if (!u) return;
    const p = new maplibregl.Popup({ offset: 26, closeButton: true, closeOnClick: false, maxWidth: "260px" })
      .setLngLat(u.to || [u.frame.lng, u.frame.lat])
      .setHTML(popupHtml(u))
      .addTo(map);
    popup = p;
    p.on("close", () => {
      if (popup !== p) return; // закрыт программно при выборе другой машины
      popup = null; selectedId = null;
      units.forEach(paintMarker); renderList();
    });
    if (fly) map.flyTo({ center: u.to || [u.frame.lng, u.frame.lat], zoom: Math.max(map.getZoom(), 14), speed: 1.4, essential: true });
  }

  function fitAll(animated = true) {
    if (!mapReady || !units.size) return;
    const b = new maplibregl.LngLatBounds();
    units.forEach((u) => b.extend(u.to || [u.frame.lng, u.frame.lat]));
    map.fitBounds(b, { padding: { top: 70, bottom: 50, left: 50, right: 50 }, maxZoom: 13, duration: animated ? 800 : 0 });
  }

  /* ---------- события ---------- */
  els.list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-unit]");
    if (b) selectUnit(b.dataset.unit);
  });
  els.fit.addEventListener("click", () => { selectUnit(null); fitAll(true); });

  // Смена темы/языка: перерисовать тексты, при смене темы переключить стиль карты
  P.onChange(() => {
    if (map && mapReady && styleKey !== `${isDark()}`) {
      styleKey = `${isDark()}`;
      map.setStyle(styleUrl());
    }
    if (units.size) { refresh(); }
    notes();
  });

  function notes() {
    const lines = [tr("Demo data: telemetry is simulated.")];
    if (!hasMapLib()) lines.push(tr("Map library failed to load. Check the maplibre-gl script in index.html."));
    if (!KEY) lines.push(tr("Demo basemap: MapTiler key not found in tokens.env."));
    showNote(lines);
  }

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) {
        keyReady.then(() => {
          setTimeout(() => {
            initMap();
            if (map) map.resize();
            notes();
            startAnim();
          }, 150);
        });
      }
    },
    { threshold: 0.05 }
  );
  io.observe(els.panel);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) startAnim(); });

  /* ---------- старт ---------- */
  notes();
  source.subscribe(onFrames);
  source.start();
})();
