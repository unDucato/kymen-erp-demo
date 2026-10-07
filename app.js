const clientFleet = [
  {
    id: "KTP-118",
    name: "Mitsubishi EDIA EM (Forklift)",
    icon: "fa-dolly",
    status: "Active",
    hours: 480,
    limit: 500,
    tone: "warn",
  },
  {
    id: "KTP-204",
    name: "Yanmar V80 (Loader)",
    icon: "fa-truck",
    status: "Active",
    hours: 120,
    limit: 500,
    tone: "ok",
  },
];

const roiAssets = [
  {
    id: "KTP-001",
    model: "Combilift C4000",
    status: "Rented",
    revenue: 12000,
    maint: 1000,
    roi: "excellent",
    sell: false,
  },
  {
    id: "KTP-042",
    model: "Volvo L60H",
    status: "Idle",
    revenue: 4000,
    maint: 5500,
    roi: "zombie",
    sell: true,
  },
];

const kpis = [
  {
    label: "Fleet utilization",
    value: "88%",
    delta: "+4%",
  },
  {
    label: "Active fleet",
    value: "310 / 350",
  },
  {
    label: "Est. monthly revenue",
    amount: 680000,
  },
];

const P = window.Prefs || { t: (k) => k, locale: () => "en-GB", onChange() {} };
const tr = (key, vars = {}) =>
  Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), P.t(key));

function fmtDate(iso, { locale = P.locale(), year = true } = {}) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", ...(year ? { year: "numeric" } : {}) });
}
function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const els = {
  clientView: document.getElementById("view-client"),
  erpView: document.getElementById("view-erp"),
  fleetGrid: document.getElementById("fleet-grid"),
  kpiRow: document.getElementById("kpi-row"),
  roiBody: document.getElementById("roi-tbody"),
  sosModal: document.getElementById("sos-modal"),
  sosForm: document.getElementById("sos-form"),
  sosMachine: document.getElementById("sos-machine"),
  uploadZone: document.getElementById("upload-zone"),
  photoInput: document.getElementById("sos-photo"),
  fileName: document.getElementById("file-name"),
  toast: document.getElementById("toast"),
  sessionName: document.getElementById("session-name"),
  sessionRole: document.getElementById("session-role"),
  sessionAvatar: document.getElementById("session-avatar"),
};

let utilizationChart;

function money(n, locale = P.locale()) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  els.toast.classList.add("is-open");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
    els.toast.classList.remove("is-open");
  }, 2600);
}

function renderFleet() {
  els.fleetGrid.innerHTML = clientFleet
    .map((machine) => {
      const pct = Math.min(100, Math.round((machine.hours / machine.limit) * 100));
      return `
        <article class="machine-card">
          <div class="card-top">
            <div class="machine-icon"><i class="fa-solid ${machine.icon}"></i></div>
            <span class="status-pill">${machine.status}</span>
          </div>
          <h4>${machine.name}</h4>
          <p class="machine-meta">${machine.id} · <span>contracted unit</span></p>
          <div class="hours">
            <span>Engine hours</span>
            <span>${machine.hours}/${machine.limit} <span>hrs</span></span>
          </div>
          <div class="progress ${machine.tone}" aria-label="${tr("Hours used")} ${pct}%">
            <span style="width:${pct}%"></span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn ghost" data-download="${machine.id}">
              <i class="fa-solid fa-file-pdf"></i>
              Download Katsastus PDF
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderKpis() {
  els.kpiRow.innerHTML = kpis
    .map(
      (kpi) => `
        <article class="kpi-card">
          <p class="kpi-label">${kpi.label}</p>
          <p class="kpi-value">${kpi.amount ? money(kpi.amount) : kpi.value}</p>
          ${
            kpi.delta
              ? `<p class="delta"><i class="fa-solid fa-arrow-up"></i> ${kpi.delta}</p>`
              : ""
          }
        </article>
      `
    )
    .join("");
}

function renderRoiTable() {
  els.roiBody.innerHTML = roiAssets
    .map((row) => {
      const badge =
        row.roi === "zombie"
          ? '<span class="badge zombie">Zombie machine</span>'
          : '<span class="badge excellent">Excellent</span>';
      const action = row.sell
        ? `<button type="button" class="btn danger" data-sell="${row.id}">Sell asset</button>`
        : "";
      const statusClass = row.status === "Idle" ? "idle" : "rented";
      return `
        <tr>
          <td>${row.id}</td>
          <td>${row.model}</td>
          <td class="${statusClass}">${row.status}</td>
          <td>${money(row.revenue)}</td>
          <td>${money(row.maint)}</td>
          <td>${badge}</td>
          <td class="row-actions"><button type="button" class="btn ghost" data-details="${row.id}"><i class="fa-solid fa-id-card"></i> Details</button>${action}</td>
        </tr>
      `;
    })
    .join("");
}

function fillSosMachines() {
  els.sosMachine.innerHTML = clientFleet
    .map((m) => `<option value="${m.id}">${m.name}</option>`)
    .join("");
}

function setView(view) {
  const isClient = view === "client";
  els.clientView.classList.toggle("is-visible", isClient);
  els.erpView.classList.toggle("is-visible", !isClient);
  els.clientView.hidden = !isClient;
  els.erpView.hidden = isClient;

  document.getElementById("btn-client").classList.toggle("is-active", isClient);
  document.getElementById("btn-erp").classList.toggle("is-active", !isClient);
  document.getElementById("btn-client").setAttribute("aria-selected", String(isClient));
  document.getElementById("btn-erp").setAttribute("aria-selected", String(!isClient));

  if (isClient) {
    els.sessionName.textContent = "Stora Enso";
    els.sessionRole.textContent = "Client account";
    els.sessionAvatar.textContent = "SE";
  } else {
    els.sessionName.textContent = "Ville";
    els.sessionRole.textContent = "Fleet manager";
    els.sessionAvatar.textContent = "VH";
    requestAnimationFrame(ensureChart);
  }
}

function ensureChart() {
  const canvas = document.getElementById("utilization-chart");
  if (!canvas || typeof Chart === "undefined") return;
  if (utilizationChart) {
    utilizationChart.resize();
    return;
  }
  const text = cssVar("--muted");
  const grid = cssVar("--border");
  const line = cssVar("--chart-line");
  const monthFmt = new Intl.DateTimeFormat(P.locale(), { month: "short" });
  const labels = [3, 4, 5, 6, 7, 8].map((m) => monthFmt.format(new Date(2026, m, 1)));
  Chart.defaults.font.family = '"Inter", system-ui, sans-serif';
  utilizationChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: P.t("Utilization %"),
          data: [74, 78, 81, 80, 85, 88],
          borderColor: line,
          backgroundColor: cssVar("--green-soft"),
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: cssVar("--green"),
          pointBorderColor: cssVar("--card"),
          pointBorderWidth: 2,
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: text } },
      },
      scales: {
        x: {
          ticks: { color: text },
          grid: { color: grid },
        },
        y: {
          min: 60,
          max: 100,
          ticks: { color: text, callback: (v) => `${v}%` },
          grid: { color: grid },
        },
      },
    },
  });
}

function openSos() {
  els.sosModal.hidden = false;
  els.sosModal.classList.add("is-open");
}

function closeSos() {
  els.sosModal.classList.remove("is-open");
  els.sosModal.hidden = true;
}

function downloadKatsastus(id) {
  const m = clientFleet.find((x) => x.id === id);
  openPdf(`Katsastus-${id}.pdf`, "KATSASTUS CERTIFICATE (DEMO)", [
    `Asset: ${m.name}`, `ID: ${m.id}`, `Engine hours: ${m.hours} / ${m.limit}`,
    "Inspection result: PASSED", "Issued: 5 Oct 2026", "Valid until: 5 Oct 2027", "",
    "Inspector: Kymen Trukkipalvelu Service, Kouvola",
  ]);
  showToast(tr("Katsastus PDF opened for {id}", { id }));
}

document.querySelectorAll(".toggle-btn").forEach((btn) => {
  btn.addEventListener("click", () => setView(btn.dataset.view));
});

document.getElementById("sos-open").addEventListener("click", openSos);
document.getElementById("sos-close").addEventListener("click", closeSos);
document.getElementById("sos-cancel").addEventListener("click", closeSos);
els.sosModal.addEventListener("click", (e) => {
  if (e.target === els.sosModal) closeSos();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && els.sosModal.classList.contains("is-open")) {
    closeSos();
  }
});

els.fleetGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-download]");
  if (btn) downloadKatsastus(btn.dataset.download);
});

els.roiBody.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-sell]");
  if (!btn) return;
  showToast(tr("{id} queued for asset sale", { id: btn.dataset.sell }));
});

els.uploadZone.addEventListener("click", () => els.photoInput.click());
els.uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  els.uploadZone.classList.add("is-drag");
});
els.uploadZone.addEventListener("dragleave", () => {
  els.uploadZone.classList.remove("is-drag");
});
els.uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  els.uploadZone.classList.remove("is-drag");
  const file = e.dataTransfer.files[0];
  if (file) {
    els.photoInput.files = e.dataTransfer.files;
    els.fileName.textContent = file.name;
  }
});
els.photoInput.addEventListener("change", () => {
  const file = els.photoInput.files[0];
  els.fileName.textContent = file ? file.name : "";
});

els.sosForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const machine = els.sosMachine.value;
  closeSos();
  els.sosForm.reset();
  els.fileName.textContent = "";
  showToast(tr("Breakdown ticket sent for {id}", { id: machine }));
});

function openPdf(filename, title, lines) {
  const clean = (s) => String(s).replace(/\u20ac/g, "EUR").replace(/[^\x20-\x7e]/g, "?").replace(/([\\()])/g, "\\$1");
  let y = 780;
  let content = `BT /F2 20 Tf 60 ${y} Td (${clean("Kymen Trukkipalvelu 2.0")}) Tj ET\n`;
  y -= 36;
  content += `BT /F2 15 Tf 60 ${y} Td (${clean(title)}) Tj ET\n0.6 w 60 ${y - 10} m 535 ${y - 10} l S\n`;
  y -= 40;
  lines.forEach((l) => { content += `BT /F1 12 Tf 60 ${y} Td (${clean(l)}) Tj ET\n`; y -= 20; });
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  let pdf = "%PDF-1.4\n"; const off = [];
  objs.forEach((o, i) => { off.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + off.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("");
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const w = window.open(url, "_blank");
  if (!w) { const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

const invoices = [
  { no: "INV-2026-0142", date: "2026-09-30", desc: "Sep rental: Mitsubishi EDIA EM + Yanmar V80", amount: 9840, status: "Due" },
  { no: "INV-2026-0121", date: "2026-08-31", desc: "Aug rental + service call-out", amount: 10260, status: "Paid" },
  { no: "INV-2026-0098", date: "2026-07-31", desc: "Jul rental: 2 units", amount: 9840, status: "Paid" },
];
const orders = [
  { no: "ORD-5531", date: "2026-08-12", machine: "Yanmar V80 (Loader)", from: "2026-08-12", to: null, status: "Active" },
  { no: "ORD-5407", date: "2026-06-01", machine: "Mitsubishi EDIA EM (Forklift)", from: "2026-06-01", to: null, status: "Active" },
  { no: "ORD-5320", date: "2026-04-14", machine: "Combilift C4000", from: "2026-04-14", to: "2026-05-31", status: "Completed" },
];
function periodText(o, locale = P.locale(), ongoing = P.t("ongoing")) {
  const f = (d) => fmtDate(d, { locale, year: false });
  return `${f(o.from)} – ${o.to ? f(o.to) : ongoing}`;
}
function renderClientTables() {
  document.getElementById("invoice-tbody").innerHTML = invoices.map((i) => `
    <tr><td>${i.no}</td><td>${fmtDate(i.date)}</td><td>${i.desc}</td><td>${money(i.amount)}</td>
    <td><span class="badge ${i.status === "Paid" ? "excellent" : "due"}">${i.status}</span></td>
    <td><button type="button" class="btn ghost" data-invoice="${i.no}"><i class="fa-solid fa-file-pdf"></i> Download PDF</button></td></tr>`).join("");
  document.getElementById("order-tbody").innerHTML = orders.map((o) => `
    <tr><td>${o.no}</td><td>${fmtDate(o.date)}</td><td>${o.machine}</td><td>${periodText(o)}</td>
    <td><span class="badge ${o.status === "Completed" ? "done" : "excellent"}">${o.status}</span></td>
    <td><button type="button" class="btn ghost" data-order="${o.no}"><i class="fa-solid fa-file-pdf"></i> Order PDF</button></td></tr>`).join("");
}
document.querySelectorAll(".subtab").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".subtab").forEach((x) => x.classList.toggle("is-active", x === b));
  document.querySelectorAll(".ctab").forEach((t) => t.classList.toggle("is-visible", t.id === `ctab-${b.dataset.ctab}`));
}));
document.getElementById("ctab-invoices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-invoice]"); if (!b) return;
  const i = invoices.find((x) => x.no === b.dataset.invoice);
  const vat = Math.round(i.amount * 0.255);
  openPdf(`${i.no}.pdf`, `INVOICE ${i.no}`, [
    "Bill to: Stora Enso Oyj, Anjalankoski mill", `Invoice date: ${fmtDate(i.date, { locale: "en-GB" })}`, "Payment terms: 14 days net", "",
    `Description: ${i.desc}`, `Net amount: ${money(i.amount, "en-GB")}`, `VAT 25.5%: ${money(vat, "en-GB")}`, `TOTAL: ${money(i.amount + vat, "en-GB")}`, "",
    `Status: ${i.status}`, "IBAN: FI00 0000 0000 0000 00 (demo)",
  ]);
});
document.getElementById("ctab-orders").addEventListener("click", (e) => {
  const b = e.target.closest("[data-order]"); if (!b) return;
  const o = orders.find((x) => x.no === b.dataset.order);
  openPdf(`${o.no}.pdf`, `ORDER CONFIRMATION ${o.no}`, [
    "Customer: Stora Enso Oyj, Anjalankoski mill", `Ordered: ${fmtDate(o.date, { locale: "en-GB" })}`, `Machine: ${o.machine}`, `Rental period: ${periodText(o, "en-GB", "ongoing")}`, `Status: ${o.status}`,
  ]);
});

const erpModules = {
  fleet: { icon: "fa-tractor", title: "Fleet Passport", text: "Digital Konekortti for the whole fleet: purchase price, depreciation and lifetime P&L per machine. Open any asset from the Dashboard table via Details." },
  mechanics: { icon: "fa-wrench", title: "Mechanics & Tasks", text: "Work orders, service schedules and mechanic assignments, linked to client SOS tickets." },
  accounting: { icon: "fa-euro-sign", title: "Accounting", text: "One-click invoice export to Procountor and Netvisor. No double entry." },
  ai: { icon: "fa-wand-magic-sparkles", title: "AI Insights", text: "Predictive maintenance, zombie-asset forecasting and pricing suggestions from your own fleet data." },
};
function setErpTab(tab) {
  document.querySelectorAll(".side-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
  const dash = document.getElementById("erp-tab-dashboard");
  const ph = document.getElementById("erp-tab-placeholder");
  const isDash = tab === "dashboard";
  dash.classList.toggle("is-visible", isDash);
  ph.classList.toggle("is-visible", !isDash);
  if (isDash) { requestAnimationFrame(ensureChart); return; }
  const m = erpModules[tab];
  ph.innerHTML = `<div class="soon"><div class="soon-icon"><i class="fa-solid ${m.icon}"></i></div>
    <h3>${m.title}</h3><p>${m.text}</p>
    <span class="soon-pill"><i class="fa-solid fa-hammer"></i> Module in development. Expected release: Phase 2</span></div>`;
}
document.querySelector(".sidebar").addEventListener("click", (e) => {
  const b = e.target.closest(".side-btn"); if (b) setErpTab(b.dataset.tab);
});

const passports = {
  "KTP-001": { name: "Combilift C4000", icon: "fa-truck-monster", photo: "img/ktp-001.jpg", purchase: 45000, value: 32000, revenue: 85000, maint: 4500, roi: 188, hours: 3120, year: 2021,
    repairs: [["2026-08-14", "Hydraulic hose replacement", 620], ["2026-05-02", "Annual service + oil change", 980], ["2026-01-11", "Mast chain adjustment", 340]] },
  "KTP-042": { name: "Volvo L60H", icon: "fa-tractor", photo: "img/ktp-042.jpg", purchase: 78000, value: 41000, revenue: 21000, maint: 14800, roi: 27, hours: 7840, year: 2017,
    repairs: [["2026-09-22", "Transmission repair", 3900], ["2026-06-30", "Boom cylinder reseal", 1600], ["2026-03-18", "Brake system overhaul", 2100]] },
};
function openPassport(id) {
  const p = passports[id]; if (!p) return;
  const good = p.roi >= 100;
  document.getElementById("pp-icon").className = `fa-solid ${p.icon}`;
  const img = document.getElementById("pp-photo");
  img.hidden = true; img.onload = () => (img.hidden = false); img.onerror = () => (img.hidden = true); img.src = p.photo; img.alt = p.name;
  const maxRepair = Math.max(...p.repairs.map((r) => r[2]));
  document.getElementById("pp-body").innerHTML = `
    <div class="pp-title"><div><p class="eyebrow">${id} · ${p.year} · ${p.hours.toLocaleString(P.locale())} <span>h</span></p><h3 id="pp-title">${p.name}</h3></div>
      <span class="badge ${good ? "excellent" : "zombie"}">${good ? "Excellent" : "Zombie machine"}</span></div>
    <div class="pp-grid">
      <div class="pp-stat"><span>Purchase price</span><strong>${money(p.purchase)}</strong></div>
      <div class="pp-stat"><span>Current value</span><strong>${money(p.value)}</strong></div>
      <div class="pp-stat"><span>Total revenue</span><strong class="pos">${money(p.revenue)}</strong></div>
      <div class="pp-stat"><span>Total maintenance</span><strong class="neg">${money(p.maint)}</strong></div>
      <div class="pp-stat wide"><span>ROI</span><strong class="${good ? "pos" : "neg"} big">${p.roi}%</strong></div>
    </div>
    <h4 class="pp-sub">Last 3 repairs</h4>
    <ul class="repairs">${p.repairs.map((r) => `<li><div><b>${r[1]}</b><small>${fmtDate(r[0])}</small></div>
      <div class="rbar"><span style="width:${Math.round((r[2] / maxRepair) * 100)}%"></span></div><em>${money(r[2])}</em></li>`).join("")}</ul>
    <div class="modal-actions"><button type="button" class="btn ghost" id="pp-done">Close</button>
      <button type="button" class="btn primary" id="pp-pdf"><i class="fa-solid fa-file-pdf"></i> Export passport PDF</button></div>`;
  const m = document.getElementById("passport-modal");
  m.hidden = false; m.classList.add("is-open");
  document.getElementById("pp-done").onclick = closePassport;
  document.getElementById("pp-pdf").onclick = () => openPdf(`Konekortti-${id}.pdf`, `KONEKORTTI ${id}`, [
    `Model: ${p.name} (${p.year})`, `Purchase price: ${money(p.purchase, "en-GB")}`, `Current value: ${money(p.value, "en-GB")}`,
    `Total revenue: ${money(p.revenue, "en-GB")}`, `Total maintenance: ${money(p.maint, "en-GB")}`, `ROI: ${p.roi}%`, "", "Recent repairs:",
    ...p.repairs.map((r) => `  ${fmtDate(r[0], { locale: "en-GB" })} - ${r[1]} - ${money(r[2], "en-GB")}`),
  ]);
}
function closePassport() {
  const m = document.getElementById("passport-modal");
  m.classList.remove("is-open"); m.hidden = true;
}
document.getElementById("pp-close").addEventListener("click", closePassport);
document.getElementById("passport-modal").addEventListener("click", (e) => { if (e.target.id === "passport-modal") closePassport(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePassport(); });
els.roiBody.addEventListener("click", (e) => {
  const b = e.target.closest("[data-details]"); if (b) openPassport(b.dataset.details);
});

function labelTables() {

  document.querySelectorAll(".data-table").forEach((table) => {
    const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent.trim());
    table.querySelectorAll("tbody tr").forEach((tr) =>
      [...tr.children].forEach((td, i) => td.setAttribute("data-label", heads[i] || ""))
    );
  });
}

function renderAll() {
  renderFleet();
  renderClientTables();
  renderKpis();
  renderRoiTable();
  labelTables();
}

renderAll();
fillSosMachines();
setView("client");

P.onChange(() => {
  renderAll();
  if (utilizationChart) {
    utilizationChart.destroy();
    utilizationChart = null;
    if (!els.erpView.hidden) ensureChart();
  }
});

// Пока открыта любая шторка (SOS, паспорт техники), фон под ней не скроллится.
(function lockScrollWhileModalOpen() {
  const root = document.documentElement;
  const backdrops = document.querySelectorAll(".modal-backdrop");
  const sync = () => {
    const open = [...backdrops].some((b) => b.classList.contains("is-open") && !b.hidden);
    if (open === root.classList.contains("modal-open")) return;
    // На ПК полоса прокрутки пропадает - компенсируем ширину, чтобы страница не дёргалась.
    if (open) root.style.setProperty("--scrollbar-w", `${window.innerWidth - root.clientWidth}px`);
    root.classList.toggle("modal-open", open);
  };
  const observer = new MutationObserver(sync);
  backdrops.forEach((b) => observer.observe(b, { attributes: true, attributeFilter: ["class", "hidden"] }));
  sync();
})();
