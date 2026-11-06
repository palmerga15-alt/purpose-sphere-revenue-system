// ============================================================
// PURPOSE SPHERE COMMAND CENTER — PURPOSEOLOGY IP INTELLIGENCE
// MODULE (Milestone 3)
//
// Renders the PURPOSEOLOGY IP INTELLIGENCE section from whatever
// the adapter layer supplies:
//
//   IPValidate  → schema/contract validation (gatekeeper, also
//                 rejects IP-leak-pattern content)
//   IPLocal     → browser-local manual records
//   IPApiClient → secure authenticated backend client
//   IPAdapter   → mode resolution + load()
//   IPModule    → this file: model math + rendering only
//
// This module tracks IP ADMINISTRATION ONLY — trademark/copyright
// status, licensing records, and compliance-scan results. It
// never stores, displays, or reconstructs the internal 26-concept
// framework or Concept Dictionary; see dashboard/IP-ARCHITECTURE.md.
//
// Security behaviors owned here (mirrors dashboard/billing.js):
//   - shared body.privacy state with Financial Intelligence and
//     Billing — one toggle governs all three
//   - own in-section two-way toggle, own LOCK button, own
//     inactivity relock
//   - no IP values, licensee PII, or tokens in logs, URLs, errors
// ============================================================
window.IPModule = (function () {
  "use strict";

  const MS_DAY = 86400000;
  const RENEWAL_WINDOW_DAYS = 90;

  // ---------- pure helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = v => v ? `<span class="money">${esc(v)}</span>` : "";
  const parseDay = s => {
    const [y, m, d] = String(s || "").split("-").map(Number);
    return (y && m && d) ? new Date(y, m - 1, d) : null;
  };
  const startOfToday = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  const fmtAmt = n => (typeof n === "number")
    ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  const sum = (list, f) => list.reduce((t, x) => t + (typeof f(x) === "number" ? f(x) : 0), 0);

  // ---------- model: every number the panels show, derived in one place ----------
  function buildModel(F) {
    const today = startOfToday();
    const daysUntil = d => d ? Math.round((d - today) / MS_DAY) : null;

    const assets = (F.ipAssets || []).map(a => {
      const renewal = parseDay(a.renewalDate);
      const daysToRenewal = daysUntil(renewal);
      const renewalSoon = daysToRenewal !== null && daysToRenewal >= 0 && daysToRenewal <= RENEWAL_WINDOW_DAYS;
      const renewalPast = daysToRenewal !== null && daysToRenewal < 0 && a.status === "REGISTERED";
      return { ...a, renewal, daysToRenewal, renewalSoon, renewalPast };
    });
    const registered = assets.filter(a => a.status === "REGISTERED");
    const pending = assets.filter(a => a.status === "PENDING");
    const renewalSoon = assets.filter(a => a.renewalSoon);
    const renewalOverdue = assets.filter(a => a.renewalPast);

    const licenses = (F.licenses || []).map(l => {
      const exp = parseDay(l.expirationDate);
      const daysToExpiry = daysUntil(exp);
      const expiringSoon = l.status === "ACTIVE" && daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= RENEWAL_WINDOW_DAYS;
      return { ...l, exp, daysToExpiry, expiringSoon };
    });
    const activeLicenses = licenses.filter(l => l.status === "ACTIVE");
    const activeFeeTotal = sum(activeLicenses, l => l.feeTier);
    const expiringLicenses = licenses.filter(l => l.expiringSoon);

    const scan = F.complianceScan || { scannedAt: null, filesScanned: 0, findings: [], clean: true };

    // ---- IP protection calendar: forward-looking renewal/expiry deadlines ----
    const events = [];
    assets.forEach(a => {
      if (a.renewal && daysUntil(a.renewal) >= 0) events.push({
        date: a.renewalDate, d: a.renewal, label: `${a.markText} — renewal due`, type: "RENEWAL"
      });
    });
    licenses.forEach(l => {
      if (l.exp && daysUntil(l.exp) >= 0) events.push({
        date: l.expirationDate, d: l.exp, label: `${l.licenseeName} — license expires`, type: "LICENSE_EXPIRY"
      });
    });
    events.sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity));
    const calendar = events.slice(0, 16);

    return {
      today, assets, registered, pending, renewalSoon, renewalOverdue,
      licenses, activeLicenses, activeFeeTotal, expiringLicenses, scan, calendar
    };
  }

  // ---------- adapter-state presentation ----------
  const STATE_META = {
    SAMPLE:     { chip: "SAMPLE + REAL SCAN",        chipCls: "st-sample", badge: { cls: "badge-sample", text: "◆ SAMPLE DATA" } },
    LOCAL:      { chip: "MANUAL LOCAL DATA",        chipCls: "st-local",  badge: { cls: "badge-local",  text: "◆ LOCAL DEVICE DATA" } },
    CONNECTED:  { chip: "SECURELY CONNECTED",       chipCls: "st-live",   badge: { cls: "badge-online", text: "● LIVE DATA" } },
    SIGNED_OUT: { chip: "SIGNED OUT · SAMPLE SHOWN", chipCls: "st-sample", badge: { cls: "badge-sample", text: "◆ SAMPLE DATA" } },
    LOADING:    { chip: "CONNECTING…",              chipCls: "st-local",  badge: { cls: "badge-sample", text: "◌ LOADING" } },
    EXPIRED:    { chip: "SESSION EXPIRED",          chipCls: "st-err",    badge: { cls: "badge-offline", text: "○ LOCKED" } },
    ERROR:      { chip: "CONNECTION ERROR",         chipCls: "st-err",    badge: { cls: "badge-offline", text: "○ NO DATA" } }
  };
  const OFFLINE_MSG = {
    EXPIRED: "SESSION EXPIRED — REAUTHENTICATE WITH THE SECURE BACKEND TO RESUME<br>NO IP DATA IS DISPLAYED",
    ERROR: "DATA UNAVAILABLE — SOURCE FAILED OR WAS REJECTED BY VALIDATION<br>NOTHING RENDERS UNTIL A VALID PAYLOAD ARRIVES",
    LOADING: "ESTABLISHING SECURE CONNECTION…"
  };

  // ---------- module state ----------
  let grid = null, sentinel = null, nodes = [];
  let securityArmed = false, inactivityTimer = null, privacyObserver = null;
  let entryType = "asset", editKey = null;

  const PANEL_TITLES = [
    ["panel-ip-overview", "IP INTELLIGENCE OVERVIEW", "wide"],
    ["panel-ip-registry", "IP ASSET REGISTRY", "wide"],
    ["panel-ip-licenses", "LICENSING & CERTIFICATION TRACKER", ""],
    ["panel-ip-compliance", "TERMINOLOGY COMPLIANCE SCANNER", ""],
    ["panel-ip-calendar", "IP PROTECTION CALENDAR", "wide"]
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

  // Privacy Mode: SAME shared body.privacy state as Financial Intelligence
  // and Billing. Content sits inside .ip-sensitive, hidden in favor of
  // the .ip-privacy-msg notice.
  const priv = inner => `
    <div class="ip-privacy-msg">🔒 PRIVATE IP DATA HIDDEN<span class="sub2">CLICK “PRIVACY MODE: ON” IN THE SECTION HEADER ABOVE TO REVEAL AND MANAGE IP RECORDS</span></div>
    <div class="ip-sensitive">${inner}</div>`;

  const isPrivacyOn = () => document.body.classList.contains("privacy");
  function setPrivacy(on) {
    if (window.setPrivacy) window.setPrivacy(!!on);
    else document.body.classList.toggle("privacy", !!on);
  }
  function syncPrivacyToggle() {
    const btn = document.getElementById("ip-privacy-toggle");
    if (!btn) return;
    const on = isPrivacyOn();
    btn.textContent = on ? "🔒 Privacy Mode: ON" : "🔓 Privacy Mode: OFF";
    btn.classList.toggle("on", on);
    btn.classList.toggle("off", !on);
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? "IP data is hidden — click to reveal" : "IP data is visible — click to hide";
  }

  function makeHead(state) {
    const meta = STATE_META[state] || STATE_META.ERROR;
    const mode = window.IPAdapter.currentMode();
    const secure = window.IPAdapter.secureAvailable();
    const head = document.createElement("div");
    head.className = "section-head ip-section-head";
    head.id = "ip-section-head";
    head.innerHTML = `
      <span class="sh-title ip-sh-title">◈ PURPOSEOLOGY IP INTELLIGENCE</span>
      <span class="fin-controls">
        <span class="fin-state-chip ${meta.chipCls}" id="ip-state-chip">${esc(meta.chip)}</span>
        <button class="fin-mode-btn ${mode === "sample" ? "active" : ""}" data-mode="sample" title="Fictional sample assets/licenses + a real compliance scan of this repo">SAMPLE</button>
        <button class="fin-mode-btn ${mode === "manual-local" ? "active" : ""}" data-mode="manual-local" title="Records stored only in this browser">LOCAL</button>
        ${secure ? `<button class="fin-mode-btn ${mode === "secure-api" ? "active" : ""}" data-mode="secure-api" title="Private authenticated backend">SECURE</button>` : ""}
        <button class="fin-privacy-toggle" id="ip-privacy-toggle" aria-pressed="true"></button>
        <button class="fin-lock-btn" id="ip-lock-btn" title="Hide IP panels immediately">🔒 LOCK IP PANELS</button>
      </span>`;
    return head;
  }

  // ---------- data-panel builders ----------
  function buildDataPanels(F, m, badge) {
    const out = [];
    const card = (cls, val, label, sub) => `
      <div class="fin-card ip-card ${cls}">
        <div class="n money">${esc(val)}</div>
        <div class="l">${esc(label)}</div>
        <div class="sub">${esc(sub)}</div>
      </div>`;

    // 1. overview
    out.push(makePanel({
      id: "panel-ip-overview", title: "IP INTELLIGENCE OVERVIEW", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${card("c-paid", m.registered.length, "REGISTERED MARKS", m.pending.length + " PENDING")}
          ${card(m.renewalSoon.length || m.renewalOverdue.length ? "c-due7" : "c-paid", m.renewalSoon.length, "RENEWALS DUE ≤90 DAYS", m.renewalOverdue.length + " OVERDUE")}
          ${card("c-recur", m.activeLicenses.length, "ACTIVE LICENSES", fmtAmt(m.activeFeeTotal) + "/YR")}
          ${card(m.expiringLicenses.length ? "c-due7" : "c-paid", m.expiringLicenses.length, "LICENSES EXPIRING ≤90 DAYS", "REVIEW BEFORE LAPSE")}
          ${card(m.scan.clean ? "c-paid" : "c-overdue", m.scan.clean ? "CLEAN" : m.scan.findings.length, "COMPLIANCE SCAN", m.scan.filesScanned + " FILES · " + esc(m.scan.scannedAt ? m.scan.scannedAt.slice(0, 10) : "NOT RUN"))}
        </div>`)
    }));

    // 2. IP asset registry
    out.push(makePanel({
      id: "panel-ip-registry", title: "IP ASSET REGISTRY", cls: "wide", badge,
      bodyHTML: priv(`
        <table class="fin-table">
          <tr><th>MARK</th><th>TYPE</th><th>JURISDICTION</th><th>STATUS</th><th>FILED</th><th>REGISTERED</th><th>RENEWAL</th><th>NOTES</th></tr>
          ${m.assets.length ? m.assets.map(a => `
            <tr>
              <td class="white">${esc(a.markText)}</td>
              <td class="dim">${esc(a.type)}</td>
              <td class="dim">${esc(a.jurisdiction || "—")}</td>
              <td><span class="ip-status is-${esc(a.status)}">${esc(a.status.replace("_", " "))}</span></td>
              <td class="dim">${esc(a.filingDate || "—")}</td>
              <td class="dim">${esc(a.registrationDate || "—")}</td>
              <td class="${a.renewalPast ? "white" : a.renewalSoon ? "white" : "dim"}">${esc(a.renewalDate || "—")}</td>
              <td class="dim">${esc(a.notes || "")}</td>
            </tr>`).join("") : `<tr><td colspan="8" class="dim">NO IP ASSETS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">${esc(F.source?.label || "")} · ADMINISTRATIVE METADATA ONLY — NEVER THE SUBSTANCE OF THE INTERNAL 26-CONCEPT FRAMEWORK</div>`)
    }));

    // 3. licensing & certification tracker
    out.push(makePanel({
      id: "panel-ip-licenses", title: "LICENSING & CERTIFICATION TRACKER", badge,
      bodyHTML: priv(`
        <table class="fin-table-sm">
          <tr><th>LICENSEE</th><th>TYPE</th><th>STATUS</th><th>GRANTED</th><th>EXPIRES</th><th>FEE/YR</th></tr>
          ${m.licenses.length ? m.licenses.map(l => `
            <tr>
              <td class="white">${esc(l.licenseeName)}</td>
              <td class="dim">${esc(l.licenseType.replace(/_/g, " "))}</td>
              <td><span class="ip-status il-${esc(l.status)}">${esc(l.status)}</span></td>
              <td class="dim">${esc(l.grantedDate || "—")}</td>
              <td class="${l.expiringSoon ? "white" : "dim"}">${esc(l.expirationDate || "—")}</td>
              <td>${money(fmtAmt(l.feeTier))}</td>
            </tr>`).join("") : `<tr><td colspan="6" class="dim">NO LICENSE RECORDS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">CORPORATE DELIVERY LICENSE / CERTIFIED PRACTITIONER TIERS PER THE CERTIFICATION-SCHOOL OFFER SPEC</div>`)
    }));

    // 4. terminology compliance scanner
    out.push(makePanel({
      id: "panel-ip-compliance", title: "TERMINOLOGY COMPLIANCE SCANNER", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${card(m.scan.clean ? "c-paid" : "c-overdue", m.scan.clean ? "CLEAN" : "ISSUES FOUND", "SCAN STATUS", m.scan.filesScanned + " MARKDOWN FILES SCANNED")}
        </div>
        ${m.scan.findings && m.scan.findings.length ? `
          <table class="fin-table-sm">
            <tr><th>FILE</th><th>LINE</th><th>SNIPPET</th></tr>
            ${m.scan.findings.map(f => `<tr><td class="white">${esc(f.file)}</td><td class="dim">${esc(f.line)}</td><td class="dim">${esc(f.snippet || "")}</td></tr>`).join("")}
          </table>` : `<div class="dim" style="margin-top:8px">No enumeration/definition-shaped matches found — run <code>node dashboard/ip-scan.js</code> to re-scan.</div>`}
        <div class="dim fin-footnote">LAST SCANNED ${esc(m.scan.scannedAt ? m.scan.scannedAt : "NEVER")} · FLAGS DEFINITION/ENUMERATION SHAPES ONLY, NOT MERE MENTIONS OF RESTRICTED TERMS</div>`)
    }));

    // 5. IP protection calendar
    out.push(makePanel({
      id: "panel-ip-calendar", title: "IP PROTECTION CALENDAR", cls: "wide", badge,
      bodyHTML: priv(`
        <table>
          <tr><th>DATE</th><th>EVENT</th><th>TYPE</th></tr>
          ${m.calendar.length ? m.calendar.map(e => `
            <tr>
              <td class="dim">${esc(e.date)}</td>
              <td class="white">${esc(e.label)}</td>
              <td><span class="ev-chip ${e.type === "RENEWAL" ? "ev-RENEWAL" : "ev-TAX"}">${esc(e.type.replace("_", " "))}</span></td>
            </tr>`).join("") : `<tr><td colspan="3" class="dim">NO UPCOMING RENEWAL OR LICENSE-EXPIRY DEADLINES</td></tr>`}
        </table>
        <div class="dim fin-footnote">DERIVED FROM IP ASSET RENEWAL DATES AND LICENSE EXPIRATION DATES</div>`)
    }));

    return out;
  }

  // ---------- manual local entry panel ----------
  const ENTRY_FIELDS = {
    asset: [
      { key: "markText", label: "MARK / WORK TITLE", kind: "text", required: true },
      { key: "type", label: "TYPE", kind: "select", options: () => window.IPValidate.CONTRACT.assetTypes, required: true },
      { key: "jurisdiction", label: "JURISDICTION", kind: "text" },
      { key: "status", label: "STATUS", kind: "select", options: () => window.IPValidate.CONTRACT.assetStatuses, required: true },
      { key: "filingDate", label: "FILING DATE", kind: "date" },
      { key: "registrationDate", label: "REGISTRATION DATE", kind: "date" },
      { key: "renewalDate", label: "RENEWAL DATE", kind: "date" },
      { key: "registrationNumber", label: "REGISTRATION NUMBER (LABEL ONLY)", kind: "text" },
      { key: "notes", label: "NOTES", kind: "text" }
    ],
    license: [
      { key: "licenseeName", label: "LICENSEE NAME", kind: "text", required: true },
      { key: "licenseType", label: "LICENSE TYPE", kind: "select", options: () => window.IPValidate.CONTRACT.licenseTypes, required: true },
      { key: "status", label: "STATUS", kind: "select", options: () => window.IPValidate.CONTRACT.licenseStatuses, required: true },
      { key: "grantedDate", label: "GRANTED DATE", kind: "date" },
      { key: "expirationDate", label: "EXPIRATION DATE", kind: "date" },
      { key: "territory", label: "TERRITORY", kind: "text" },
      { key: "feeTier", label: "FEE TIER (USD/YR)", kind: "number" },
      { key: "notes", label: "NOTES", kind: "text" }
    ]
  };
  const TYPE_LABELS = { asset: "IP ASSET", license: "LICENSE RECORD" };

  function fieldInput(f, value) {
    const v = value === undefined || value === null ? "" : value;
    if (f.kind === "select") {
      const opts = f.options();
      return `<select class="fin-input" data-key="${esc(f.key)}">${opts.map(o =>
        `<option value="${esc(o)}" ${String(v) === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    }
    const type = f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text";
    return `<input class="fin-input" type="${type}" ${f.kind === "number" ? 'step="0.01" min="0"' : ""} data-key="${esc(f.key)}" value="${esc(v)}">`;
  }

  function entryFormFields(type, record) {
    return ENTRY_FIELDS[type].map(f => `
      <label class="fin-field">
        <span class="fin-field-label">${esc(f.label)}${f.required ? " *" : ""}</span>
        ${fieldInput(f, record ? record[f.key] : undefined)}
      </label>`).join("");
  }

  function localList(type) {
    const items = window.IPLocal.list(type);
    if (!items.length) return "";
    const title = r => type === "asset" ? r.markText : r.licenseeName;
    const when = r => r.renewalDate || r.expirationDate || "";
    return `
      <div class="fin-local-group">${esc(TYPE_LABELS[type])}S</div>
      ${items.map((r, i) => {
        const key = r.id !== undefined ? r.id : String(i);
        return `
        <div class="fin-local-row">
          <span class="white">${esc(title(r))}</span>
          <span class="dim">${esc(type === "asset" ? r.status : r.licenseType)}</span>
          <span class="dim">${esc(when(r))}</span>
          <span class="fin-row-actions">
            <button class="fin-sm-btn" data-act="edit" data-type="${esc(type)}" data-key="${esc(key)}">EDIT</button>
            <button class="fin-sm-btn danger" data-act="del" data-type="${esc(type)}" data-key="${esc(key)}">DELETE</button>
          </span>
        </div>`;
      }).join("")}`;
  }

  function buildEntryPanel() {
    const editing = editKey !== null;
    let editRecord = null;
    if (editing) {
      const items = window.IPLocal.list(entryType);
      editRecord = items.find((r, i) => (r.id !== undefined ? r.id === editKey : String(i) === editKey)) || null;
    }
    return makePanel({
      id: "panel-ip-entry", title: "MANUAL LOCAL ENTRY — LOCAL TO THIS DEVICE", cls: "wide",
      badge: { cls: "badge-local", text: "◆ LOCAL TO THIS DEVICE" },
      bodyHTML: priv(`
        <div class="fin-local-note">⚠ RECORDS ENTERED HERE ARE STORED ONLY IN THIS BROWSER'S LOCAL STORAGE ON THIS DEVICE.
        THEY ARE NEVER COMMITTED TO GIT, NEVER WRITTEN TO ip-data.js, AND NEVER SENT TO ANY SERVER.
        NOTE/FREE-TEXT FIELDS ARE REJECTED IF THEY LOOK LIKE AN ATTEMPT TO DEFINE OR ENUMERATE AN INTERNAL CONCEPT —
        THIS MODULE TRACKS IP ADMINISTRATION ONLY, <span class="white">NEVER THE FRAMEWORK'S SUBSTANCE</span>.</div>
        <div class="fin-entry-bar">
          <label class="fin-field"><span class="fin-field-label">RECORD TYPE</span>
            <select class="fin-input" id="ip-entry-type">
              ${Object.keys(ENTRY_FIELDS).map(t => `<option value="${t}" ${t === entryType ? "selected" : ""}>${esc(TYPE_LABELS[t])}</option>`).join("")}
            </select>
          </label>
          <span class="dim" id="ip-entry-mode">${editing ? "EDITING EXISTING RECORD" : "ADDING NEW RECORD"}</span>
        </div>
        <div class="fin-form" id="ip-entry-fields">${entryFormFields(entryType, editRecord)}</div>
        <div class="fin-entry-actions">
          <button class="fin-sm-btn primary" id="ip-entry-save">${editing ? "✓ UPDATE RECORD" : "+ ADD RECORD"}</button>
          ${editing ? `<button class="fin-sm-btn" id="ip-entry-cancel">CANCEL EDIT</button>` : ""}
          <span class="fin-entry-err" id="ip-entry-err"></span>
        </div>
        <div id="ip-local-lists">
          ${["asset", "license"].map(localList).join("")}
        </div>
        <div class="fin-entry-actions" style="margin-top:14px">
          <button class="fin-sm-btn danger" id="ip-erase-btn">⨯ ERASE LOCAL IP DATA</button>
          <span class="dim">REMOVES EVERY LOCALLY STORED RECORD FROM THIS BROWSER — CANNOT BE UNDONE</span>
        </div>`)
    });
  }

  function readForm(panelEl) {
    const rec = {};
    for (const f of ENTRY_FIELDS[entryType]) {
      const input = panelEl.querySelector(`[data-key="${f.key}"]`);
      if (!input) continue;
      let v = input.value.trim();
      if (v === "") continue;
      if (f.kind === "number") {
        const n = Number(v);
        rec[f.key] = isFinite(n) ? n : v;
      } else rec[f.key] = v;
    }
    return rec;
  }

  const ERR_TEXT = {
    REQUIRED: "is required", INVALID_AMOUNT: "must be a valid amount",
    INVALID_DATE: "must be a valid date", INVALID_STATUS: "has an invalid status",
    INVALID_TYPE: "has an invalid type", INVALID_LICENSE_TYPE: "has an invalid license type",
    INVALID_LINE: "has an invalid line number", INVALID_COUNT: "must be a non-negative count",
    INVALID_BOOLEAN: "must be true or false",
    CREDENTIAL_LIKE: "looks like a credential or account number — not allowed",
    IP_LEAK_PATTERN: "reads like it's defining or enumerating an internal concept — not allowed in this module",
    DUPLICATE_ID: "duplicates an existing record id", UNEXPECTED_PROPERTY: "is not an allowed field"
  };
  function showErrors(panelEl, errors) {
    const el = panelEl.querySelector("#ip-entry-err");
    if (!el) return;
    el.textContent = errors.slice(0, 3).map(e =>
      `${e.path.split(".").pop()} ${ERR_TEXT[e.code] || "is invalid"}`).join(" · ");
  }

  function wireEntryPanel(panelEl) {
    panelEl.querySelector("#ip-entry-type")?.addEventListener("change", ev => {
      entryType = ev.target.value; editKey = null;
      rerender();
    });
    panelEl.querySelector("#ip-entry-save")?.addEventListener("click", () => {
      const rec = readForm(panelEl);
      const res = editKey !== null
        ? window.IPLocal.update(entryType, editKey, { ...rec, id: typeof editKey === "string" ? editKey : rec.id })
        : window.IPLocal.add(entryType, rec);
      if (!res.ok) { showErrors(panelEl, res.errors); return; }
      editKey = null;
      rerender();
    });
    panelEl.querySelector("#ip-entry-cancel")?.addEventListener("click", () => { editKey = null; rerender(); });
    panelEl.querySelector("#ip-erase-btn")?.addEventListener("click", () => {
      const n = window.IPLocal.count();
      const ok = window.confirm(
        `Erase ALL locally stored IP data on this device?\n\n${n} record(s) will be permanently deleted from this browser. This cannot be undone.`);
      if (!ok) return;
      window.IPLocal.eraseAll();
      editKey = null;
      rerender();
    });
    panelEl.querySelectorAll("[data-act]").forEach(btn => btn.addEventListener("click", () => {
      const { act, type, key } = btn.dataset;
      if (act === "edit") { entryType = type; editKey = key; rerender(); }
      if (act === "del") { window.IPLocal.remove(type, key); if (editKey === key) editKey = null; rerender(); }
    }));
  }

  // ---------- security controls ----------
  function lock() { setPrivacy(true); }
  function unlock() { setPrivacy(false); }
  function togglePrivacy() { setPrivacy(!isPrivacyOn()); }

  function initSecurity() {
    if (securityArmed) return;
    securityArmed = true;
    if (window.MutationObserver && !privacyObserver) {
      privacyObserver = new MutationObserver(syncPrivacyToggle);
      privacyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
    const secs = (window.IP_CONFIG && Number(window.IP_CONFIG.inactivitySeconds)) || 300;
    const rearm = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(lock, secs * 1000);
    };
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(ev =>
      document.addEventListener(ev, rearm, { passive: true }));
    rearm();
  }

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
      if (state === "LOCAL") els.push(buildEntryPanel());
    } else {
      IPModule.model = null;
      const msg = OFFLINE_MSG[state] || OFFLINE_MSG.ERROR;
      for (const [id, title, cls] of PANEL_TITLES) els.push(makePanel({ id, title, cls, badge: meta.badge, offlineMsg: msg }));
      if (state === "EXPIRED") lock();
    }

    els.forEach(el => grid.insertBefore(el, sentinel));
    nodes = els;
    IPModule.state = state;

    const head = els[0];
    head.querySelectorAll(".fin-mode-btn").forEach(btn => btn.addEventListener("click", () => {
      window.IPAdapter.setMode(btn.dataset.mode);
      editKey = null;
      rerender();
    }));
    head.querySelector("#ip-privacy-toggle")?.addEventListener("click", togglePrivacy);
    head.querySelector("#ip-lock-btn")?.addEventListener("click", lock);
    syncPrivacyToggle();

    const entry = els.find(e => e.id === "panel-ip-entry");
    if (entry) wireEntryPanel(entry);
  }

  async function rerender() {
    if (window.IPAdapter.currentMode() === "secure-api") paint({ state: "LOADING" });
    const res = await window.IPAdapter.load();
    paint(res);
  }

  async function render(opts) {
    grid = (opts && opts.grid) || document.getElementById("grid");
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "ip-anchor";
      sentinel.style.display = "none";
      grid.appendChild(sentinel);
      initSecurity();
    }
    await rerender();
  }

  return { render, rerender, buildModel, model: null, state: null };
})();
