// ============================================================
// PURPOSE SPHERE COMMAND CENTER — PURPOSEOLOGY IP INTELLIGENCE
// Phase 1. Renders the PURPOSEOLOGY IP INTELLIGENCE section
// from whatever the adapter layer supplies:
//
//   IPValidate → schema/contract validation (gatekeeper)
//   IPAdapter  → mode resolution + load()
//   IPModule   → this file: model math + rendering only
//
// The UI paints one of these states and never needs changes when
// the data source switches:
//   SAMPLE | LOCAL | CONNECTED | SIGNED_OUT | LOADING | EXPIRED | ERROR
//
// Security behaviors owned here:
//   - Privacy Mode (shared body.privacy toggle) conceals every
//     panel's content behind "PRIVATE PURPOSEOLOGY IP HIDDEN" —
//     titles, descriptions, creators, source references,
//     licensing parties, legal notes, registration refs, and
//     unpublished product names are all inside .ip-sensitive
//   - "LOCK IP PANELS" button → Privacy Mode on
//   - EXPIRED session → panels relock automatically, no data
//   - no IP metadata or tokens in logs, URLs, or errors
//
// Full architecture: dashboard/IP-ARCHITECTURE.md
// ============================================================
window.IPModule = (function () {
  "use strict";

  const MS_DAY = 86400000;

  // ---------- pure helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const parseDay = s => {
    const [y, m, d] = String(s || "").split("-").map(Number);
    return (y && m && d) ? new Date(y, m - 1, d) : null;
  };
  const startOfToday = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  const dash = v => (v === undefined || v === null || v === "") ? "—" : v;

  // Deadline urgency window: OVERDUE, then 30 / 60 / 90 days, else LATER.
  function urgency(days) {
    if (days === null) return null;
    if (days < 0) return "OVERDUE";
    if (days <= 30) return "30D";
    if (days <= 60) return "60D";
    if (days <= 90) return "90D";
    return "LATER";
  }
  const URG_LABEL = { OVERDUE: "⚠ OVERDUE", "30D": "≤ 30 DAYS", "60D": "≤ 60 DAYS", "90D": "≤ 90 DAYS", LATER: "SCHEDULED" };

  // ---------- model: every number the panels show, derived in one place ----------
  function buildModel(F) {
    const today = startOfToday();
    const daysUntil = d => d ? Math.round((d - today) / MS_DAY) : null;

    const assets = (F.assets || []).map(a => ({ ...a }));
    const byId = {};
    assets.forEach(a => { byId[a.id] = a; });
    const assetTitle = id => byId[id]?.title || (id ? id : "—");

    // executive snapshot counts
    const count = fn => assets.filter(fn).length;
    const snapshot = {
      total: assets.length,
      draft: count(a => a.status === "Draft"),
      published: count(a => a.status === "Published"),
      protected: count(a => a.status === "Protected" || a.status === "Licensed"),
      trademarks: count(a => a.trademarkStatus === "REGISTERED"),
      copyrights: count(a => a.copyrightStatus === "REGISTERED"),
      licensable: count(a => a.licensingStatus === "AVAILABLE")
    };

    // protection & registration tracker with deadline windows
    const protections = (F.protections || []).map(p => {
      const due = parseDay(p.dueDate);
      const dueIn = daysUntil(due);
      return { ...p, due, dueIn, urg: urgency(dueIn) };
    }).sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity));
    const actionable = protections.filter(p =>
      p.status !== "EXPIRED" && p.dueIn !== null && p.dueIn <= 90);
    snapshot.actionsDue = actionable.length;

    // licensing intelligence
    const licenses = (F.licenses || []).map(l => {
      const end = parseDay(l.endDate);
      const endIn = daysUntil(end);
      return { ...l, end, endIn, endUrg: urgency(endIn) };
    });
    const activeLicenses = licenses.filter(l => l.status === "ACTIVE");
    const expiring90 = activeLicenses.filter(l => l.endIn !== null && l.endIn >= 0 && l.endIn <= 90);

    // IP calendar: filings, renewals, publications, legal reviews,
    // licensing expirations, trademark deadlines — combined + sorted.
    const events = [];
    protections.forEach(p => {
      if (p.due && p.status !== "EXPIRED") events.push({
        date: p.dueDate, d: p.due, label: p.label, type: p.type,
        source: assetTitle(p.assetId)
      });
    });
    assets.forEach(a => {
      const pub = parseDay(a.publicationDate);
      if (pub && daysUntil(pub) >= 0) events.push({
        date: a.publicationDate, d: pub, label: `${a.title} — publication`, type: "PUBLICATION", source: a.title
      });
      const ren = parseDay(a.renewalDate);
      if (ren) events.push({
        date: a.renewalDate, d: ren, label: `${a.title} — renewal / filing`, type: "RENEWAL", source: a.title
      });
    });
    licenses.forEach(l => {
      if (l.end && l.status === "ACTIVE") events.push({
        date: l.endDate, d: l.end, label: `License ends — ${l.licensee}`, type: "LICENSE-END", source: assetTitle(l.assetId)
      });
      const ren = parseDay(l.renewalDate);
      if (ren && l.status === "ACTIVE") events.push({
        date: l.renewalDate, d: ren, label: `License renewal — ${l.licensee}`, type: "LICENSE-RENEWAL", source: assetTitle(l.assetId)
      });
    });
    events.forEach(e => { e.dueIn = daysUntil(e.d); e.urg = urgency(e.dueIn); });
    // chronological; anything already overdue floats to the top of the list
    events.sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity));
    const calendar = events.filter(e => e.dueIn === null || e.dueIn >= -120).slice(0, 14);

    return { today, assets, assetTitle, snapshot, protections, actionable, licenses, activeLicenses, expiring90, calendar };
  }

  // ---------- adapter-state presentation ----------
  const STATE_META = {
    SAMPLE:     { chip: "SAMPLE DATA",               chipCls: "st-sample", badge: { cls: "badge-sample", text: "◆ SAMPLE DATA" } },
    LOCAL:      { chip: "MANUAL LOCAL DATA",         chipCls: "st-local",  badge: { cls: "badge-local",  text: "◆ LOCAL DEVICE DATA" } },
    CONNECTED:  { chip: "SECURELY CONNECTED",        chipCls: "st-live",   badge: { cls: "badge-online", text: "● LIVE DATA" } },
    SIGNED_OUT: { chip: "SIGNED OUT · SAMPLE SHOWN", chipCls: "st-sample", badge: { cls: "badge-sample", text: "◆ SAMPLE DATA" } },
    LOADING:    { chip: "CONNECTING…",               chipCls: "st-local",  badge: { cls: "badge-sample", text: "◌ LOADING" } },
    EXPIRED:    { chip: "SESSION EXPIRED",           chipCls: "st-err",    badge: { cls: "badge-offline", text: "○ LOCKED" } },
    ERROR:      { chip: "DATA REJECTED",             chipCls: "st-err",    badge: { cls: "badge-offline", text: "○ NO DATA" } }
  };
  const OFFLINE_MSG = {
    EXPIRED: "SESSION EXPIRED — REAUTHENTICATE WITH THE SECURE BACKEND TO RESUME<br>NO IP METADATA IS DISPLAYED",
    ERROR: "DATA UNAVAILABLE — SOURCE FAILED OR WAS REJECTED BY VALIDATION<br>NOTHING RENDERS UNTIL A VALID PAYLOAD ARRIVES",
    LOADING: "ESTABLISHING SECURE CONNECTION…"
  };

  // ---------- module state ----------
  let grid = null, sentinel = null, nodes = [];

  const PANEL_TITLES = [
    ["panel-ip-snapshot", "IP EXECUTIVE SNAPSHOT", "wide"],
    ["panel-ip-register", "INTELLECTUAL PROPERTY ASSET REGISTER", "wide"],
    ["panel-ip-protection", "PROTECTION & REGISTRATION TRACKER", "wide"],
    ["panel-ip-provenance", "VERSION & PROVENANCE TRACKER", "wide"],
    ["panel-ip-licensing", "LICENSING INTELLIGENCE", ""],
    ["panel-ip-calendar", "IP CALENDAR", ""]
  ];

  function makePanel({ id, title, cls = "", badge, bodyHTML, offlineMsg }) {
    const el = document.createElement("section");
    el.className = `panel ip-panel ${cls}`;
    el.id = id;
    const badgeHTML = badge ? `<span class="panel-badge ${esc(badge.cls)}">${esc(badge.text)}</span>` : "";
    el.innerHTML = `
      <div class="panel-head">
        <span class="panel-title">${esc(title)}</span>
        ${badgeHTML}
      </div>
      <div class="panel-body">${offlineMsg !== undefined
        ? `<div class="panel-offline-msg">${offlineMsg}</div>`
        : bodyHTML}</div>`;
    return el;
  }

  // Privacy Mode: content sits inside .ip-sensitive, hidden by body.privacy
  // in favor of the .ip-privacy-msg notice. Everything the panel shows —
  // titles, descriptions, creators, source refs, licensees, legal notes,
  // registration refs, unpublished product names — lives inside this wrapper.
  const priv = inner => `
    <div class="ip-privacy-msg">🔒 PRIVATE PURPOSEOLOGY IP HIDDEN<span class="sub2">TURN PRIVACY OFF TO VIEW IP METADATA</span></div>
    <div class="ip-sensitive">${inner}</div>`;

  const chip = (cls, text) => `<span class="pay-status ${cls}">${esc(text)}</span>`;
  const lcChip = st => chip("lc-" + String(st || "").replace(/ /g, "-"), st);
  const cfChip = cf => chip("cf-" + String(cf || "").replace(/ /g, "-"), String(cf || "").toUpperCase());
  const urgChip = u => u ? chip("dl-" + u, URG_LABEL[u] || u) : `<span class="dim">—</span>`;

  // ---------- section header w/ connection-status control ----------
  function makeHead(state) {
    const meta = STATE_META[state] || STATE_META.ERROR;
    const mode = window.IPAdapter.currentMode();
    const head = document.createElement("div");
    head.className = "section-head sh-ip";
    head.id = "ip-section-head";
    head.innerHTML = `
      <span class="sh-title">◈ PURPOSEOLOGY IP INTELLIGENCE</span>
      <span class="fin-controls">
        <span class="fin-state-chip ${meta.chipCls}" id="ip-state-chip">${esc(meta.chip)}</span>
        <button class="fin-mode-btn ${mode === "sample" ? "active" : ""}" data-ip-mode="sample" title="Fictional demo data from the public repo">SAMPLE</button>
        ${window.IPAdapter.localAvailable() ? `<button class="fin-mode-btn ${mode === "manual-local" ? "active" : ""}" data-ip-mode="manual-local" title="Records stored only in this browser">LOCAL</button>` : ""}
        ${window.IPAdapter.secureAvailable() ? `<button class="fin-mode-btn ${mode === "secure-api" ? "active" : ""}" data-ip-mode="secure-api" title="Private authenticated backend">SECURE</button>` : ""}
        <button class="fin-lock-btn" id="ip-lock-btn" title="Enable Privacy Mode immediately">🔒 LOCK IP PANELS</button>
      </span>`;
    return head;
  }

  // ---------- data-panel builders ----------
  function buildDataPanels(F, m, badge) {
    const out = [];
    const card = (cls, val, label, sub) => `
      <div class="fin-card ${cls}">
        <div class="n">${esc(val)}</div>
        <div class="l">${esc(label)}</div>
        <div class="sub">${esc(sub)}</div>
      </div>`;

    // 1. IP EXECUTIVE SNAPSHOT
    const s = m.snapshot;
    out.push(makePanel({
      id: "panel-ip-snapshot", title: "IP EXECUTIVE SNAPSHOT", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${card("c-month", s.total, "TOTAL IP ASSETS", "ALL TYPES · ALL STATUSES")}
          ${card("c-due7", s.draft, "DRAFT ASSETS", "IN ACTIVE DEVELOPMENT")}
          ${card("c-paid", s.published, "PUBLISHED ASSETS", "PUBLICLY RELEASED")}
          ${card("c-recur", s.protected, "PROTECTED ASSETS", "PROTECTED OR LICENSED STATUS")}
          ${card("c-cash", s.trademarks, "REGISTERED TRADEMARKS", "MARK STATUS: REGISTERED")}
          ${card("c-cash", s.copyrights, "COPYRIGHT REGISTRATIONS", "STATUS: REGISTERED")}
          ${card("c-paid", s.licensable, "LICENSING OPPORTUNITIES", "AVAILABLE TO LICENSE")}
          ${card(s.actionsDue ? "c-overdue" : "c-paid", s.actionsDue, "LEGAL / RENEWAL ACTIONS DUE", "OVERDUE OR NEXT 90 DAYS")}
        </div>`)
    }));

    // 2. INTELLECTUAL PROPERTY ASSET REGISTER
    out.push(makePanel({
      id: "panel-ip-register", title: "INTELLECTUAL PROPERTY ASSET REGISTER", cls: "wide", badge,
      bodyHTML: priv(`
        <table class="ip-table">
          <tr>
            <th>ID</th><th>TITLE</th><th>TYPE</th><th>DESCRIPTION</th><th>STATUS</th>
            <th>CONFIDENTIALITY</th><th>CREATOR</th><th>OWNING BUSINESS</th><th>CREATED</th>
            <th>PUBLISHED</th><th>VERSION</th><th>COPYRIGHT</th><th>TRADEMARK</th>
            <th>LICENSING</th><th>RELATED PRODUCT</th><th>RENEWAL / FILING</th>
            <th>SOURCE REF</th><th>NOTES</th>
          </tr>
          ${m.assets.length ? m.assets.map(a => `
            <tr class="${a.status === "Archived" ? "row-cancelled" : ""}">
              <td class="dim">${esc(a.id)}</td>
              <td class="white">${esc(a.title)}</td>
              <td class="dim">${esc(a.type)}</td>
              <td class="dim">${esc(dash(a.description))}</td>
              <td>${lcChip(a.status)}</td>
              <td>${cfChip(a.confidentiality)}</td>
              <td class="dim">${esc(dash(a.creator))}</td>
              <td class="dim">${esc(dash(a.owningBusiness))}</td>
              <td class="dim">${esc(dash(a.creationDate))}</td>
              <td class="dim">${esc(dash(a.publicationDate))}</td>
              <td class="dim">${esc(dash(a.version))}</td>
              <td class="dim">${esc(dash(a.copyrightStatus))}</td>
              <td class="dim">${esc(dash(a.trademarkStatus))}</td>
              <td class="dim">${esc(dash(a.licensingStatus))}</td>
              <td class="dim">${esc(dash(a.relatedProduct))}</td>
              <td class="dim">${esc(dash(a.renewalDate))}</td>
              <td class="dim">${esc(dash(a.sourceRef))}</td>
              <td class="dim">${esc(dash(a.notes))}</td>
            </tr>`).join("") : `<tr><td colspan="18" class="dim">NO IP ASSETS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">${esc(F.source?.label || "")} · SOURCE REFS ARE OPAQUE LABELS RESOLVED ONLY INSIDE PRIVATE STORAGE — NO DOCUMENTS, LINKS, OR REGISTRATION NUMBERS IN THIS MODULE</div>`)
    }));

    // 3. PROTECTION & REGISTRATION TRACKER
    const win = u => m.protections.filter(p => p.urg === u && p.status !== "EXPIRED").length;
    out.push(makePanel({
      id: "panel-ip-protection", title: "PROTECTION & REGISTRATION TRACKER", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${card(win("OVERDUE") ? "c-overdue" : "c-paid", win("OVERDUE"), "OVERDUE ACTIONS", "PAST DEADLINE")}
          ${card(win("30D") ? "c-overdue" : "c-paid", win("30D"), "DUE WITHIN 30 DAYS", "IMMEDIATE ACTION WINDOW")}
          ${card(win("60D") ? "c-due7" : "c-paid", win("60D"), "DUE WITHIN 60 DAYS", "PREPARE FILINGS")}
          ${card(win("90D") ? "c-month" : "c-paid", win("90D"), "DUE WITHIN 90 DAYS", "PLANNING HORIZON")}
        </div>
        <table class="ip-table-md">
          <tr><th>TYPE</th><th>ITEM</th><th>ASSET</th><th>JURISDICTION</th><th>REF (LABEL)</th><th>FILED</th><th>DUE</th><th>WINDOW</th><th>STATUS</th><th>NOTES</th></tr>
          ${m.protections.length ? m.protections.map(p => `
            <tr class="${p.status === "EXPIRED" ? "row-cancelled" : ""}">
              <td>${chip("pt-" + esc(p.type), p.type)}</td>
              <td class="white">${esc(p.label)}</td>
              <td class="dim">${esc(p.assetId ? m.assetTitle(p.assetId) : "—")}</td>
              <td class="dim">${esc(dash(p.jurisdiction))}</td>
              <td class="dim">${esc(dash(p.registrationRef))}</td>
              <td class="dim">${esc(dash(p.filedDate))}</td>
              <td class="${p.urg === "OVERDUE" || p.urg === "30D" ? "white" : "dim"}">${esc(dash(p.dueDate))}</td>
              <td>${p.status === "EXPIRED" ? `<span class="dim">—</span>` : urgChip(p.urg)}</td>
              <td>${chip("ps-" + (p.status === "RENEWAL-DUE" || p.status === "PENDING" ? "DUE-SOON" : ["REGISTERED", "ACTIVE"].includes(p.status) ? "PAID" : p.status === "EXPIRED" ? "CANCELLED" : "DUE"), p.status)}</td>
              <td class="dim">${esc(dash(p.notes))}</td>
            </tr>`).join("") : `<tr><td colspan="10" class="dim">NO PROTECTION RECORDS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">COPYRIGHTS · TRADEMARK APPLICATIONS &amp; RENEWALS · DOMAINS · LICENSING AGREEMENTS · PERMISSIONS · PUBLICATION RECORDS · LEGAL REVIEW — REFS ARE SAMPLE LABELS, NEVER REAL REGISTRATION NUMBERS</div>`)
    }));

    // 4. VERSION & PROVENANCE TRACKER
    out.push(makePanel({
      id: "panel-ip-provenance", title: "VERSION & PROVENANCE TRACKER", cls: "wide", badge,
      bodyHTML: priv(`
        <table class="ip-table-md">
          <tr><th>ASSET</th><th>CURRENT VERSION</th><th>ORIGINAL CREATION</th><th>LAST REVISION</th><th>CREATOR</th><th>CONTRIBUTORS</th><th>APPROVAL</th><th>SOURCE LOCATION</th><th>RELATED VERSIONS</th></tr>
          ${m.assets.length ? m.assets.map(a => {
            const p = a.provenance || {};
            return `
            <tr class="${a.status === "Archived" ? "row-cancelled" : ""}">
              <td class="white">${esc(a.title)}</td>
              <td class="dim">${esc(dash(a.version))}</td>
              <td class="dim">${esc(dash(p.originalCreationDate || a.creationDate))}</td>
              <td class="dim">${esc(dash(p.lastRevisionDate))}</td>
              <td class="dim">${esc(dash(a.creator))}</td>
              <td class="dim">${esc((p.contributors || []).join(", ") || "—")}</td>
              <td>${p.approvalStatus ? chip("ap-" + esc(p.approvalStatus), p.approvalStatus) : `<span class="dim">—</span>`}</td>
              <td class="dim">${esc(dash(p.sourceLocation))}</td>
              <td class="dim">${esc((p.relatedVersions || []).join(", ") || "—")}</td>
            </tr>`;
          }).join("") : `<tr><td colspan="9" class="dim">NO PROVENANCE RECORDS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">SOURCE LOCATIONS ARE PRIVATE-STORAGE LABELS ONLY — ACTUAL DOCUMENTS ARE NEVER STORED IN THE PUBLIC REPOSITORY</div>`)
    }));

    // 5. LICENSING INTELLIGENCE
    out.push(makePanel({
      id: "panel-ip-licensing", title: "LICENSING INTELLIGENCE", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${card("c-paid", m.snapshot.licensable, "LICENSABLE ASSETS", "MARKED AVAILABLE")}
          ${card("c-month", m.activeLicenses.length, "ACTIVE LICENSES", "CURRENT LICENSEES")}
          ${card(m.expiring90.length ? "c-due7" : "c-paid", m.expiring90.length, "EXPIRING ≤ 90 DAYS", "RENEWAL CONVERSATIONS DUE")}
        </div>
        <table class="ip-table-md">
          <tr><th>LICENSEE</th><th>ASSET</th><th>TERRITORY</th><th>USAGE RIGHTS</th><th>START</th><th>END</th><th>RENEWAL</th><th>MODEL</th><th>RESTRICTIONS</th><th>STATUS</th></tr>
          ${m.licenses.length ? m.licenses.map(l => `
            <tr class="${["EXPIRED", "TERMINATED"].includes(l.status) ? "row-cancelled" : ""}">
              <td class="white">${esc(l.licensee)}</td>
              <td class="dim">${esc(l.assetId ? m.assetTitle(l.assetId) : "—")}</td>
              <td class="dim">${esc(dash(l.territory))}</td>
              <td class="dim">${esc(dash(l.usageRights))}</td>
              <td class="dim">${esc(dash(l.startDate))}</td>
              <td class="${l.endUrg === "30D" || l.endUrg === "60D" ? "white" : "dim"}">${esc(dash(l.endDate))}</td>
              <td class="dim">${esc(dash(l.renewalDate))}</td>
              <td class="dim">${esc(dash(l.revenueModel))}</td>
              <td class="dim">${esc(dash(l.restrictions))}</td>
              <td>${chip("ps-" + (l.status === "ACTIVE" ? "PAID" : l.status === "IN-NEGOTIATION" || l.status === "PENDING" ? "DUE-SOON" : "CANCELLED"), l.status)}</td>
            </tr>`).join("") : `<tr><td colspan="10" class="dim">NO LICENSING RECORDS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">FICTIONAL SAMPLE LICENSING RECORDS · AGREEMENT DOCUMENTS LIVE ONLY IN PRIVATE STORAGE</div>`)
    }));

    // 6. IP CALENDAR
    out.push(makePanel({
      id: "panel-ip-calendar", title: "IP CALENDAR", badge,
      bodyHTML: priv(`
        <table>
          <tr><th>DATE</th><th>EVENT</th><th>TYPE</th><th>URGENCY</th></tr>
          ${m.calendar.length ? m.calendar.map(e => `
            <tr>
              <td class="${e.urg === "OVERDUE" || e.urg === "30D" ? "white" : "dim"}">${esc(e.date)}</td>
              <td class="white">${esc(e.label)}</td>
              <td>${chip("pt-" + esc(e.type), e.type)}</td>
              <td>${urgChip(e.urg)}</td>
            </tr>`).join("") : `<tr><td colspan="4" class="dim">NO UPCOMING IP EVENTS IN THIS SOURCE</td></tr>`}
        </table>
        <div class="dim fin-footnote">FILINGS + RENEWALS + PUBLICATIONS + LEGAL REVIEWS + LICENSE EXPIRATIONS + TRADEMARK DEADLINES · CHRONOLOGICAL · URGENT ITEMS HIGHLIGHTED</div>`)
    }));

    return out;
  }

  // ---------- security ----------
  function lock() { if (window.setPrivacy) window.setPrivacy(true); }

  // ---------- render lifecycle ----------
  function clearNodes() {
    nodes.forEach(n => n.remove());
    nodes = [];
  }

  function paint(res) {
    clearNodes();
    const state = res.state;
    const meta = STATE_META[state] || STATE_META.ERROR;
    const els = [makeHead(state)];

    if (res.data) {
      const m = buildModel(res.data);
      IPModule.model = m;
      els.push(...buildDataPanels(res.data, m, meta.badge));
    } else {
      IPModule.model = null;
      const msg = OFFLINE_MSG[state] || OFFLINE_MSG.ERROR;
      for (const [id, title, cls] of PANEL_TITLES) els.push(makePanel({ id, title, cls, badge: meta.badge, offlineMsg: msg }));
      if (state === "EXPIRED") lock(); // expired session relocks the panels
    }

    els.forEach(el => grid.insertBefore(el, sentinel));
    nodes = els;
    IPModule.state = state;

    // wire controls
    const head = els[0];
    head.querySelectorAll("[data-ip-mode]").forEach(btn => btn.addEventListener("click", () => {
      window.IPAdapter.setMode(btn.dataset.ipMode);
      rerender();
    }));
    head.querySelector("#ip-lock-btn")?.addEventListener("click", lock);
  }

  async function rerender() {
    if (window.IPAdapter.currentMode() === "secure-api") paint({ state: "LOADING" });
    const res = await window.IPAdapter.load();
    paint(res);
  }

  async function render(opts) {
    grid = (opts && opts.grid) || document.getElementById("grid");
    if (!sentinel) {
      // Sentinel reserves the section's position in the grid so re-renders
      // in any adapter state land in exactly the same place.
      sentinel = document.createElement("div");
      sentinel.id = "ip-anchor";
      sentinel.style.display = "none";
      grid.appendChild(sentinel);
    }
    await rerender();
  }

  return { render, rerender, buildModel, model: null, state: null };
})();
